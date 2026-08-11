(function(){
  'use strict';

  /*
   * PDF mode visibility policy.
   *
   * Only tools that truly require the server belong in ONLINE_ONLY.
   * Current source explicitly treats "Nén PDF / Compress PDF" as Online-only.
   * Add future server-only tools here instead of showing a generic warning after selection.
   */
  var ONLINE_ONLY = [
    'compress',
    'compress-pdf',
    'pdf-compress'
  ];

  var STYLE_ID = 'nlkh-pdf-mode-filter-style';
  var LAST_MODE = null;
  var applying = false;

  function mode(){
    return (localStorage.getItem('nlkh_pdf_mode') || 'offline').toLowerCase() === 'online' ? 'online' : 'offline';
  }

  function norm(s){
    return String(s || '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[→–—]/g,'-')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function nodeKey(node){
    if(!node) return '';
    return norm(
      node.getAttribute('data-tool') ||
      node.getAttribute('data-value') ||
      node.value ||
      node.id ||
      node.textContent
    );
  }

  function isOnlineOnlyKey(k){
    if(!k) return false;
    if(ONLINE_ONLY.indexOf(k) >= 0) return true;
    // Vietnamese/English labels for Compress PDF.
    return k === 'nen-pdf' || k.indexOf('compress-pdf') >= 0 || k.indexOf('nen-pdf') >= 0;
  }

  function isOnlineOnly(node){
    var keys = [
      nodeKey(node),
      norm(node && node.getAttribute && node.getAttribute('data-tool')),
      norm(node && node.value),
      norm(node && node.textContent)
    ];
    return keys.some(isOnlineOnlyKey);
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=[
      '.nlkh-mode-hidden{display:none!important}',
      'option.nlkh-mode-hidden{display:none!important}',
      '.nlkh-online-only-badge{font-size:9px;opacity:.72;margin-left:6px}'
    ].join('');
    document.head.appendChild(s);
  }

  function toolButtons(){
    var set = new Set();
    [
      '[data-tool]',
      '.tool-card',
      '.tool-button',
      '.pdf-tool-card',
      '#toolGrid button',
      '#toolGrid [role="button"]'
    ].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(n){
        if(n.closest && n.closest('#toolOptions')) return;
        set.add(n);
      });
    });
    return Array.from(set);
  }

  function toolSelect(){
    return document.getElementById('apiTool') ||
           document.querySelector('select[name="tool"]') ||
           document.querySelector('select[data-tool-select]');
  }

  function clearGenericOfflineWarning(){
    // Do not erase real errors/success messages. Only remove the old generic
    // "this needs Online" footer/status note while browsing Offline tools.
    var candidates = document.querySelectorAll(
      '#status, #statusMessage, #offlineStatus, .status-message, .tool-status, [data-status]'
    );
    candidates.forEach(function(n){
      var t=norm(n.textContent);
      if(
        (t.indexOf('offline') >= 0 && t.indexOf('online') >= 0) &&
        (
          t.indexOf('nen-pdf') >= 0 ||
          t.indexOf('compress') >= 0 ||
          t.indexOf('chuyen-online') >= 0 ||
          t.indexOf('switch-online') >= 0
        )
      ){
        n.textContent='';
        n.classList.add('hidden');
      }
    });
  }

  function firstOfflineOption(select){
    if(!select) return null;
    return Array.from(select.options || []).find(function(o){
      return !isOnlineOnly(o) && !o.disabled && o.value;
    }) || null;
  }

  function chooseFallbackIfNeeded(select){
    if(!select || mode() !== 'offline') return;
    var current = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
    if(!current || !isOnlineOnly(current)) return;

    var fallback = firstOfflineOption(select);
    if(!fallback) return;
    select.value = fallback.value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function apply(){
    if(applying) return;
    applying=true;
    try{
      ensureStyle();
      var m=mode();
      var offline=m==='offline';

      toolButtons().forEach(function(n){
        var serverOnly=isOnlineOnly(n);
        n.classList.toggle('nlkh-mode-hidden', offline && serverOnly);
        n.setAttribute('aria-hidden', offline && serverOnly ? 'true':'false');
      });

      var select=toolSelect();
      if(select){
        Array.from(select.options || []).forEach(function(o){
          var serverOnly=isOnlineOnly(o);
          o.classList.toggle('nlkh-mode-hidden', offline && serverOnly);
          o.disabled = offline && serverOnly;
          o.hidden = offline && serverOnly;
        });
        chooseFallbackIfNeeded(select);
      }

      if(offline) clearGenericOfflineWarning();

      LAST_MODE=m;
    } finally {
      applying=false;
    }
  }

  function observeModeControls(){
    // Existing source may implement the Offline/Online switch using buttons,
    // radio inputs or a select. Listen broadly and re-read localStorage after it changes.
    document.addEventListener('click',function(e){
      var n=e.target && e.target.closest ? e.target.closest('button,[role="button"],label') : null;
      if(!n) return;
      var t=norm((n.id||'')+' '+(n.getAttribute('data-mode')||'')+' '+(n.textContent||''));
      if(t.indexOf('offline')>=0 || t.indexOf('online')>=0){
        setTimeout(apply,0);
        setTimeout(apply,80);
      }
    },true);

    document.addEventListener('change',function(e){
      var n=e.target;
      if(!n) return;
      var t=norm((n.id||'')+' '+(n.name||'')+' '+(n.value||''));
      if(t.indexOf('mode')>=0 || t.indexOf('offline')>=0 || t.indexOf('online')>=0){
        setTimeout(apply,0);
      }
    },true);

    window.addEventListener('storage',function(e){
      if(e.key==='nlkh_pdf_mode') apply();
    });
  }

  window.addEventListener('load',function(){
    apply();
    observeModeControls();

    var mo=new MutationObserver(function(){
      // module.js rebuilds cards/options in some flows.
      requestAnimationFrame(apply);
    });
    mo.observe(document.body,{childList:true,subtree:true});

    setInterval(function(){
      if(mode()!==LAST_MODE) apply();
    },500);
  });
})();