/* =====================================================================
   API URL Rewrite Shim (Customer Mobile App)
   ---------------------------------------------------------------------
   The compiled Customer Portal bundle was originally built with hard-
   coded development API URLs. This shim runs BEFORE the bundle and
   intercepts every fetch / XHR request, rewriting any of those legacy
   URLs to the API_BASE_URL configured in config.js.

   No UI / behavior is changed. Only the network destination is.
   ===================================================================== */
(function () {
  var cfg = (window.NATURAL_PLYLAM_CONFIG || {});
  var TARGET = (cfg.API_BASE_URL || "").replace(/\/+$/, "");
  if (!TARGET) {
    console.warn("[plylam] API_BASE_URL not set in config.js");
    return;
  }

  // Legacy bases baked into the compiled bundle.
  var LEGACY = [
    "https://source-puller-9.preview.emergentagent.com/api",
    "http://localhost:8001/api",
    "http://localhost/natural/api",
    "http://localhost/natural"
  ];

  function rewrite(url) {
    if (typeof url !== "string") return url;
    for (var i = 0; i < LEGACY.length; i++) {
      if (url.indexOf(LEGACY[i]) === 0) {
        return TARGET + url.substring(LEGACY[i].length);
      }
    }
    return url;
  }

  // --- fetch ---------------------------------------------------------
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = function (input, init) {
      try {
        if (typeof input === "string") {
          input = rewrite(input);
        } else if (input && typeof input.url === "string") {
          var newUrl = rewrite(input.url);
          if (newUrl !== input.url) {
            input = new Request(newUrl, input);
          }
        }
      } catch (e) { /* noop */ }
      return origFetch(input, init);
    };
  }

  // --- XMLHttpRequest -----------------------------------------------
  var XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype && XHR.prototype.open) {
    var origOpen = XHR.prototype.open;
    XHR.prototype.open = function (method, url) {
      arguments[1] = rewrite(url);
      return origOpen.apply(this, arguments);
    };
  }

  console.log("[plylam] API requests routed to:", TARGET);
})();
