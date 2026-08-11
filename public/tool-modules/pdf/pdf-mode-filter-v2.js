(function(){
  'use strict';

  /*
   * Offline allow-list: when Offline is active, ONLY tools known to run locally are shown.
   * This is safer than hiding only one or two Online tools and accidentally exposing
   * server-only conversions in the native <select>.
   */
  var OFFLINE_SUPPORTED = [
    'merge', 'merge-pdf', 'gop-pdf',
    'split', 'split-pdf', 'tach-pdf',
    'rotate', 'rotate-pdf', 'xoay-pdf',
    'watermark', 'watermark-pdf', 'dong-dau', 'dong-dau-pdf',
    'pdf-to-jpg', 'pdf-jpg', 'pdf-sang-jpg',
    'image-to-pdf', 'images-to-pdf', 'anh-pdf', 'anh-sang-pdf',
    'page-numbers', 'page-number', 'number-pages', 'danh-so-trang',
    'delete-pages', 'delete-page', 'xoa-trang-pdf-offline', 'xoa-trang-pdf',
    'reorder-pages', 'reorder-page', 'sap-xep-trang-pdf-offline', 'sap-xep-trang-pdf',
    'edit', 'edit-pdf', 'sua-pdf'
  ];

  var LAST_MODE = null;
  var applying = false;
  var STYLE_ID='nlkh-pdf-mode-filter-v2-style';

  function mode(){
    return (localStorage.getItem('nlkh_pdf_mode')||'offline').toLowerCase()==='online'?'online':'offline';
  }
  function norm(s){
    return String(s||'').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[→–—]/g,'-')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }
  function keys(node){
    if(!node)return [];
    return [
      node.getAttribute&&node.getAttribute('data-tool'),
      node.getAttribute&&node.getAttribute('data-value'),
      node.value,
      node.id,
      node.textContent
    ].map(norm).filter(Boolean);
  }
  function supportedOffline(node){
    var ks=keys(node);
    return ks.some(function(k){
      return OFFLINE_SUPPORTED.some(function(ok){
        return k===ok || k.indexOf(ok)>=0 || ok.indexOf(k)>=0;
      });
    });
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=[
      '.nlkh-mode-hidden{display:none!important}',
      'option.nlkh-mode-hidden{display:none!important}',
      'optgroup.nlkh-mode-hidden{display:none!important}'
    ].join('');
    document.head.appendChild(s);
  }

  function select(){return document.getElementById('apiTool')||document.querySelector('select[name="tool"]')||document.querySelector('select[data-tool-select]');}

  function cards(){
    var set=new Set();
    ['[data-tool]','.tool-card','.tool-button','.pdf-tool-card','#toolGrid button','#toolGrid [role="button"]']
      .forEach(function(sel){document.querySelectorAll(sel).forEach(function(n){
        if(n.closest&&n.closest('#toolOptions'))return;
        set.add(n);
      })});
    return Array.from(set);
  }

  function firstAllowedOption(s){
    return Array.from((s&&s.options)||[]).find(function(o){return supportedOffline(o)&&!o.disabled&&o.value;})||null;
  }

  function filterSelect(s,offline){
    if(!s)return;
    Array.from(s.options||[]).forEach(function(o){
      var hide=offline&&!supportedOffline(o);
      o.hidden=hide;o.disabled=hide;o.classList.toggle('nlkh-mode-hidden',hide);
    });

    // Hide empty category headers too, so the native dropdown is clean.
    Array.from(s.querySelectorAll('optgroup')).forEach(function(g){
      var visible=Array.from(g.querySelectorAll('option')).some(function(o){return !o.hidden&&!o.disabled;});
      g.hidden=offline&&!visible;
      g.disabled=offline&&!visible;
      g.classList.toggle('nlkh-mode-hidden',offline&&!visible);
    });

    if(offline){
      var cur=s.options&&s.selectedIndex>=0?s.options[s.selectedIndex]:null;
      if(!cur||!supportedOffline(cur)){
        var fallback=firstAllowedOption(s);
        if(fallback){
          s.value=fallback.value;
          s.dispatchEvent(new Event('change',{bubbles:true}));
        }
      }
    }
  }

  function filterCards(offline){
    cards().forEach(function(n){
      var hide=offline&&!supportedOffline(n);
      n.hidden=hide;
      n.classList.toggle('nlkh-mode-hidden',hide);
      n.setAttribute('aria-hidden',hide?'true':'false');
    });
  }

  function clearOldWarnings(){
    document.querySelectorAll('#status,#statusMessage,#offlineStatus,.status-message,.tool-status,[data-status]').forEach(function(n){
      var t=norm(n.textContent);
      if(t.indexOf('offline')>=0&&t.indexOf('online')>=0&&
         (t.indexOf('chuyen-online')>=0||t.indexOf('switch-online')>=0||t.indexOf('can-xu-ly-online')>=0)){
        n.textContent='';n.classList.add('hidden');
      }
    });
  }

  function apply(){
    if(applying)return;
    applying=true;
    try{
      ensureStyle();
      var offline=mode()==='offline';
      filterCards(offline);
      filterSelect(select(),offline);
      if(offline)clearOldWarnings();
      LAST_MODE=mode();
    }finally{applying=false}
  }

  function bind(){
    document.addEventListener('click',function(e){
      var n=e.target&&e.target.closest?e.target.closest('button,[role="button"],label'):null;
      if(!n)return;
      var t=norm((n.id||'')+' '+(n.getAttribute('data-mode')||'')+' '+(n.textContent||''));
      if(t.indexOf('offline')>=0||t.indexOf('online')>=0){setTimeout(apply,0);setTimeout(apply,80);}
    },true);
    document.addEventListener('change',function(e){
      var n=e.target;if(!n)return;
      var t=norm((n.id||'')+' '+(n.name||'')+' '+(n.value||''));
      if(t.indexOf('mode')>=0||t.indexOf('offline')>=0||t.indexOf('online')>=0)setTimeout(apply,0);
    },true);
    window.addEventListener('storage',function(e){if(e.key==='nlkh_pdf_mode')apply();});

    var mo=new MutationObserver(function(){requestAnimationFrame(apply);});
    mo.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){if(mode()!==LAST_MODE)apply();},500);
  }

  window.addEventListener('load',function(){apply();bind();});
})();