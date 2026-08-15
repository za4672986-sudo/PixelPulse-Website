(function () {
  "use strict";

  var STARTER_HTML = [
    '<header class="demo-nav"><strong>MySite</strong><a class="btn" href="#">Sign up</a></header>',
    '<section class="demo-hero">',
    '  <h1>Hello, world</h1>',
    '  <p>Edit the code on the left and watch this preview update live.</p>',
    '  <button id="demo-btn" class="btn">Click me</button>',
    '  <span id="demo-count" class="demo-count">0 clicks</span>',
    '</section>',
    '<section class="demo-cards">',
    '  <div class="demo-card"><h3>Fast</h3><p>Built with speed.</p></div>',
    '  <div class="demo-card"><h3>Pretty</h3><p>Designed with care.</p></div>',
    '  <div class="demo-card"><h3>Fun</h3><p>Powered by you.</p></div>',
    '</section>'
  ].join("\n");

  var STARTER_CSS = [
    ":root{--bg:#f4f5fb;--text:#1a1d29;--accent:#7c5cff;--radius:12px;--fs:16px;--gap:24px}",
    "*{box-sizing:border-box;margin:0}",
    "body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:var(--fs);line-height:1.6;padding:24px}",
    ".demo-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}",
    ".demo-nav strong{font-size:1.2rem}",
    ".demo-hero{text-align:center;max-width:520px;margin:0 auto 48px}",
    ".demo-hero h1{font-size:2.4rem;margin-bottom:12px;color:var(--accent)}",
    ".demo-hero p{opacity:.8;margin-bottom:24px}",
    ".demo-count{display:inline-block;margin-left:12px;opacity:.7}",
    ".btn{background:var(--accent);color:#fff;border:0;border-radius:var(--radius);padding:12px 22px;font-size:1rem;cursor:pointer;text-decoration:none;display:inline-block}",
    ".demo-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--gap)}",
    ".demo-card{border:1px solid #e3e5f0;border-radius:var(--radius);padding:20px;background:#fff;box-shadow:0 4px 14px rgba(20,20,40,.06)}",
    ".demo-card h3{margin-bottom:6px;color:var(--accent)}",
    ".demo-card p{opacity:.75;font-size:.9rem}"
  ].join("\n");

  var STARTER_JS = [
    "var n = 0;",
    "document.getElementById('demo-btn').addEventListener('click', function () {",
    "  n++;",
    "  document.getElementById('demo-count').textContent = n + ' clicks';",
    "});"
  ].join("\n");

  var code = {
    html: STARTER_HTML,
    css: STARTER_CSS,
    js: STARTER_JS
  };

  var tabs = document.querySelectorAll(".editor-tab");
  var holder = document.getElementById("editor-holder");
  var visual = document.getElementById("visual-controls");
  var autoRun = document.getElementById("auto-run");
  var btnRun = document.getElementById("btn-run");
  var btnReset = document.getElementById("btn-reset");
  var iframe = document.getElementById("preview");
  var statusEl = document.getElementById("preview-status");
  var consoleEl = document.getElementById("console");

  var tas = {
    html: document.getElementById("editor-html"),
    css: document.getElementById("editor-css"),
    js: document.getElementById("editor-js")
  };

  var editors = { html: null, css: null, js: null };
  var editorWraps = { html: null, css: null, js: null };
  var currentLang = "html";

  var visualState = {
    bg: "#f4f5fb",
    text: "#1a1d29",
    accent: "#7c5cff",
    fs: 16,
    radius: 12,
    gap: 24
  };

  var previewTimer = null;

  function makeVisualCSS() {
    var v = visualState;
    return (
      ":root{--bg:" + v.bg +
      ";--text:" + v.text +
      ";--accent:" + v.accent +
      ";--radius:" + v.radius + "px" +
      ";--fs:" + v.fs + "px" +
      ";--gap:" + v.gap + "px}\n"
    );
  }

  function getValue(lang) {
    if (editors[lang]) return editors[lang].getValue();
    return tas[lang] ? tas[lang].value : "";
  }

  function setValue(lang, value) {
    if (editors[lang]) {
      editors[lang].setValue(value);
    } else if (tas[lang]) {
      tas[lang].value = value;
    }
  }

  /* Only the active editor may be visible — with CodeMirror every instance
     is absolutely positioned inside #editor-holder, so the others must be
     explicitly hidden or the tabs appear dead. */
  function showEditor(lang) {
    ["html", "css", "js"].forEach(function (l) {
      var wrap = editorWraps[l];
      if (wrap) {
        wrap.style.display = l === lang ? "" : "none";
      } else if (tas[l]) {
        tas[l].style.display = l === lang ? "block" : "none";
      }
    });
  }

  function initEditors() {
    if (!window.CodeMirror) return;
    var modes = { html: "xml", css: "css", js: "javascript" };
    ["html", "css", "js"].forEach(function (lang) {
      if (!tas[lang]) return;
      var cm = CodeMirror.fromTextArea(tas[lang], {
        mode: modes[lang],
        theme: "dracula",
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        autoCloseBrackets: true,
        matchBrackets: true
      });
      cm.setValue(code[lang]);
      cm.on("change", function () {
        code[lang] = cm.getValue();
        schedulePreview();
      });
      editors[lang] = cm;
      editorWraps[lang] = cm.getWrapperElement();
      tas[lang].style.display = "none";
    });
    showEditor("html");
  }

  function initFallbackEditors() {
    if (window.CodeMirror) return;
    ["html", "css", "js"].forEach(function (lang) {
      if (!tas[lang]) return;
      tas[lang].value = code[lang];
      tas[lang].addEventListener("input", function () {
        code[lang] = tas[lang].value;
        schedulePreview();
      });
    });
  }

  function switchTab(lang) {
    currentLang = lang;
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-lang") === lang);
    });
    if (holder) holder.hidden = lang === "visual";
    if (visual) visual.hidden = lang !== "visual";
    if (lang !== "visual") showEditor(lang);
  }

  function schedulePreview() {
    if (autoRun && !autoRun.checked) {
      if (statusEl) statusEl.classList.add("stale");
      return;
    }
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 400);
  }

  function escScript(s) {
    return s.replace(/<\/script/gi, "<\\/script");
  }

  function buildDocument() {
    var css = makeVisualCSS() + code.css;
    return (
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<style>" + css + "</style></head><body>" +
      code.html +
      "<script>window.onerror=function(m,s,l){parent.postMessage({type:\"pp-error\",message:m+(l?\" (line \"+l+\")\":\"\")},\"*\");return true;};<\\/script>" +
      "<script>try{" + escScript(code.js) + "}catch(e){window.onerror(e.message)}<\\/script>" +
      "</body></html>"
    );
  }

  function updatePreview() {
    if (!iframe) return;
    iframe.srcdoc = buildDocument();
    if (statusEl) {
      statusEl.textContent = "● updated";
      statusEl.classList.remove("stale");
    }
    if (consoleEl) consoleEl.hidden = true;
  }

  function resetCode() {
    code.html = STARTER_HTML;
    code.css = STARTER_CSS;
    code.js = STARTER_JS;
    ["html", "css", "js"].forEach(function (lang) {
      setValue(lang, code[lang]);
    });
    showEditor(currentLang);
    updatePreview();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchTab(tab.getAttribute("data-lang"));
    });
  });

  if (btnRun) {
    btnRun.addEventListener("click", updatePreview);
  }
  if (btnReset) {
    btnReset.addEventListener("click", resetCode);
  }
  if (autoRun) {
    autoRun.addEventListener("change", function () {
      if (autoRun.checked) updatePreview();
    });
  }

  var btnOpen = document.getElementById("btn-open");
  if (btnOpen) {
    btnOpen.addEventListener("click", function () {
      var blob = new Blob([buildDocument()], { type: "text/html;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 30000);
    });
  }

  window.Playground = {
    getCode: function () {
      return { html: code.html, css: code.css, js: code.js };
    },
    setCode: function (obj) {
      if (obj && typeof obj === "object") {
        if (typeof obj.html === "string") code.html = obj.html;
        if (typeof obj.css === "string") code.css = obj.css;
        if (typeof obj.js === "string") code.js = obj.js;
        ["html", "css", "js"].forEach(function (lang) {
          setValue(lang, code[lang]);
        });
        updatePreview();
      }
    },
    refresh: updatePreview
  };

  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "pp-error") {
      if (consoleEl) {
        consoleEl.textContent = "⚠ " + event.data.message;
        consoleEl.hidden = false;
      }
    }
  });

  function bindVisualControl(id, key, kind, suffix) {
    var el = document.getElementById(id);
    if (!el) return;
    var labelEl = document.getElementById(id + "-val");

    var apply = function () {
      if (kind === "range") {
        visualState[key] = parseInt(el.value, 10) || 0;
        if (labelEl) labelEl.textContent = visualState[key] + (suffix || "");
      } else {
        visualState[key] = el.value;
      }
      schedulePreview();
    };

    el.addEventListener("input", apply);
  }

  bindVisualControl("v-bg", "bg", "color");
  bindVisualControl("v-text", "text", "color");
  bindVisualControl("v-accent", "accent", "color");
  bindVisualControl("v-fs", "fs", "range", "px");
  bindVisualControl("v-radius", "radius", "range", "px");
  bindVisualControl("v-gap", "gap", "range", "px");

  initEditors();
  initFallbackEditors();
  updatePreview();
})();
