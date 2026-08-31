(function () {
  "use strict";

  var loadPromise = null;
  var vendorSrc = "./vendor/pdf-lib.min.js";
  var pdfLibTools = new Set([
    "merge",
    "split",
    "rotate",
    "watermark",
    "pagenumber",
    "imagepdf",
    "deletepages",
    "reorderpages"
  ]);

  function ready() {
    return !!(window.PDFLib && window.PDFLib.PDFDocument);
  }

  window.ensurePDFLib = function ensurePDFLib() {
    if (ready()) return Promise.resolve(window.PDFLib);
    if (loadPromise) return loadPromise;

    loadPromise = new Promise(function (resolve, reject) {
      var script = document.querySelector(
        'script[data-nlkh-pdf-lib-lazy="1"]'
      );

      function complete() {
        if (ready()) {
          resolve(window.PDFLib);
        } else {
          reject(new Error("pdf-lib loaded but PDFLib global is unavailable."));
        }
      }

      function failed() {
        reject(new Error("Could not load local pdf-lib engine."));
      }

      if (script) {
        script.addEventListener("load", complete, { once: true });
        script.addEventListener("error", failed, { once: true });
        return;
      }

      script = document.createElement("script");
      script.src = vendorSrc;
      script.async = true;
      script.dataset.nlkhPdfLibLazy = "1";
      script.onload = complete;
      script.onerror = failed;
      document.head.appendChild(script);
    }).catch(function (error) {
      loadPromise = null;
      throw error;
    });

    return loadPromise;
  };

  function shouldWarmForCurrentTool() {
    var select = document.getElementById("apiTool");
    var tool = select ? String(select.value || "") : "";
    var mode = localStorage.getItem("nlkh_pdf_mode") || "offline";
    return mode === "offline" && pdfLibTools.has(tool);
  }

  // Start downloading after the user chooses a file for a local PDF task.
  // This keeps initial page load light while hiding most engine latency before
  // the user presses Process or waits for a PDF preview.
  document.addEventListener(
    "change",
    function (event) {
      var target = event.target;
      if (
        target &&
        target.matches &&
        target.matches('input[type="file"]') &&
        target.files &&
        target.files.length &&
        shouldWarmForCurrentTool()
      ) {
        window.setTimeout(function () {
          window.ensurePDFLib().catch(function () {});
        }, 0);
      }
    },
    true
  );
})();
