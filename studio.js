(function () {
  "use strict";

  /* --------------------------------- state --------------------------------- */

  var LS_PROJECTS = "pp_studio_projects";
  var LS_HISTORY = "pp_studio_history";
  var LS_USAGE = "pp_studio_usage";
  var LS_KEY = "pp_ai_key";

  var state = {
    files: {},
    activeFile: null,
    language: "html",
    conversation: [],
    provider: "free",
    busy: false,
    streaming: false,
    lastPrompt: "",
    projectId: null
  };

  var LANGUAGES = {
    html: { files: ["index.html"], mode: "htmlmixed", renderable: true },
    css: { files: ["style.css"], mode: "css", renderable: true },
    js: { files: ["script.js"], mode: "javascript", renderable: true },
    ts: { files: ["index.ts"], mode: "javascript", renderable: false },
    python: { files: ["main.py"], mode: "python", renderable: false },
    react: { files: ["App.jsx", "index.css"], mode: "jsx", renderable: false },
    next: { files: ["page.jsx"], mode: "jsx", renderable: false },
    node: { files: ["server.js"], mode: "javascript", renderable: false },
    tailwind: { files: ["index.html"], mode: "htmlmixed", renderable: true }
  };

  var MODE_BY_EXT = {
    html: "htmlmixed",
    htm: "htmlmixed",
    jsx: "jsx",
    js: "javascript",
    mjs: "javascript",
    ts: "javascript",
    tsx: "jsx",
    py: "python",
    css: "css",
    json: "javascript"
  };

  var FREE_AI_URL = "https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate";

  /* --------------------------------- dom --------------------------------- */

  var $ = function (id) {
    return document.getElementById(id);
  };

  var sidebar = $("sidebar");
  var sidebarBackdrop = $("sidebar-backdrop");
  var btnNewChat = $("btn-new-chat");
  var btnSave = $("btn-save");
  var projectNameEl = $("project-name");
  var projectSearch = $("project-search");
  var projectList = $("project-list");
  var historyList = $("history-list");
  var usageCount = $("usage-count");
  var providerBadge = $("provider-badge");
  var btnClearChat = $("btn-clear-chat");
  var chatLog = $("chat-log");
  var chatInput = $("chat-input");
  var btnGenerate = $("btn-generate");
  var languageSelect = $("language-select");
  var modelSelect = $("model-select");
  var codeTabs = document.querySelectorAll(".code-tab");
  var editorArea = $("editor-area");
  var previewArea = $("preview-area");
  var previewNote = $("preview-note");
  var deviceFrame = $("device-frame");
  var studioPreview = $("studio-preview");
  var fileTabs = $("file-tabs");
  var statusBar = $("status-bar");
  var statusText = $("status-text");
  var streamOverlay = $("stream-overlay");
  var streamLabel = $("stream-label");
  var toastEl = $("toast");
  var mobileTabs = document.querySelectorAll(".mobile-tabs button");
  var chatPanel = $("chat-panel");
  var codePanel = $("code-panel");
  var btnCopy = $("btn-copy");
  var btnDownload = $("btn-download");
  var btnRegenerate = $("btn-regenerate");
  var btnImprove = $("btn-improve");
  var btnExplain = $("btn-explain");
  var btnFix = $("btn-fix");
  var btnOptimize = $("btn-optimize");

  var editor = null;

  /* ------------------------------- localStorage ------------------------------- */

  function readLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function getProjects() {
    return readLS(LS_PROJECTS, []);
  }

  function getHistory() {
    return readLS(LS_HISTORY, []);
  }

  function getUsage() {
    return readLS(LS_USAGE, 0);
  }

  /* --------------------------------- toast --------------------------------- */

  var toastTimer = null;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 2200);
  }

  /* ------------------------------ status / busy ------------------------------ */

  function setStatus(text, mode) {
    statusText.textContent = text;
    statusBar.classList.toggle("busy", mode === "busy");
    statusBar.classList.toggle("error", mode === "error");
  }

  function setBusy(busy) {
    state.busy = busy;
    btnGenerate.disabled = busy;
    btnRegenerate.disabled = busy;
    btnImprove.disabled = busy;
    btnExplain.disabled = busy;
    btnFix.disabled = busy;
    btnOptimize.disabled = busy;
    if (busy) {
      setStatus("AI is working…", "busy");
    } else {
      setStatus("Ready");
    }
  }

  /* ------------------------------- code editor ------------------------------- */

  function extOf(name) {
    var i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
  }

  function modeFor(name) {
    return MODE_BY_EXT[extOf(name)] || "javascript";
  }

  function initEditor() {
    if (!window.CodeMirror) return;
    editor = CodeMirror.fromTextArea($("code-editor"), {
      mode: "htmlmixed",
      theme: "dracula",
      lineNumbers: true,
      lineWrapping: false,
      indentUnit: 2,
      tabSize: 2,
      autoCloseBrackets: true,
      matchBrackets: true,
      viewportMargin: Infinity
    });
    editor.setOption("lineNumbers", true);
    editor.on("change", function () {
      if (state.streaming) return;
      if (state.activeFile) {
        state.files[state.activeFile] = editor.getValue();
        scheduleSave();
      }
    });
  }

  function renderFileTabs() {
    fileTabs.innerHTML = "";
    var names = Object.keys(state.files);
    if (!names.length) {
      var empty = document.createElement("span");
      empty.className = "side-empty";
      empty.textContent = "No files yet";
      fileTabs.appendChild(empty);
      return;
    }
    names.forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "file-tab" + (name === state.activeFile ? " active" : "");
      b.textContent = name;
      b.addEventListener("click", function () {
        switchFile(name);
      });
      fileTabs.appendChild(b);
    });
  }

  function switchFile(name) {
    if (state.streaming) return;
    if (state.activeFile && editor) {
      state.files[state.activeFile] = editor.getValue();
    }
    state.activeFile = name;
    if (editor) {
      editor.setOption("mode", modeFor(name));
      editor.setValue(state.files[name] || "");
    }
    renderFileTabs();
  }

  /* -------------------------------- preview -------------------------------- */

  function isRenderable() {
    return !!(LANGUAGES[state.language] && LANGUAGES[state.language].renderable);
  }

  function escJs(s) {
    return String(s).replace(/<\/script/gi, "<\\/script");
  }

  function buildPreview() {
    var html = "";
    var css = "";
    var js = "";
    Object.keys(state.files).forEach(function (name) {
      var content = state.files[name];
      var ext = extOf(name);
      if (ext === "html" || ext === "htm") html += content;
      else if (ext === "css") css += content + "\n";
      else if (ext === "js" || ext === "mjs") js += content + "\n";
    });

    var head = "";
    if (state.language === "tailwind") {
      head = '<script src="https://cdn.tailwindcss.com"><\/script>';
    }
    if (!html) html = "";

    return (
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      head +
      "<style>" + css + "</style></head><body>" +
      html +
      "<script>" + escJs(js) + "<\/script>" +
      "</body></html>"
    );
  }

  function refreshPreview() {
    if (!isRenderable()) {
      showPreviewNote(
        "🛠",
        "Live preview isn't available for " + state.language,
        "This language runs server-side or needs a build step. Copy or download the code to run it locally."
      );
      return;
    }
    previewNote.hidden = true;
    studioPreview.srcdoc = buildPreview();
  }

  function showPreviewNote(icon, title, body) {
    studioPreview.srcdoc = "";
    previewNote.innerHTML = "";
    var ic = document.createElement("div");
    ic.className = "note-icon";
    ic.textContent = icon;
    var h = document.createElement("h4");
    h.textContent = title;
    var p = document.createElement("p");
    p.textContent = body;
    previewNote.appendChild(ic);
    previewNote.appendChild(h);
    previewNote.appendChild(p);
    previewNote.hidden = false;
  }

  function switchView(view) {
    codeTabs.forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-view") === view);
    });
    var showPreview = view === "preview";
    editorArea.hidden = showPreview;
    previewArea.hidden = !showPreview;
    if (showPreview) refreshPreview();
  }

  function switchToPreview() {
    switchView("preview");
    var m = document.querySelector('.mobile-tabs button[data-view="preview"]');
    if (m) m.classList.add("active");
  }

  /* ------------------------------- conversation ------------------------------- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function pushUser(text) {
    state.conversation.push({ role: "user", content: text });
    var bubble = el("div", "chat-bubble user", text);
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function pushAssistant(text, isError) {
    state.conversation.push({ role: "assistant", content: text });
    var bubble = el("div", "chat-bubble assistant" + (isError ? " error" : ""));
    bubble.appendChild(el("div", "bubble-label", isError ? "⚠ Error" : "✦ Assistant"));
    bubble.appendChild(el("p", "", text));
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function showThinking() {
    var bubble = el("div", "chat-bubble assistant");
    var label = el("div", "bubble-label", "✦ Assistant");
    var thinking = el("div", "thinking");
    var dots = el("span", "thinking-dots");
    dots.appendChild(el("span"));
    dots.appendChild(el("span"));
    dots.appendChild(el("span"));
    thinking.appendChild(dots);
    thinking.appendChild(document.createTextNode(" Generating…"));
    bubble.appendChild(label);
    bubble.appendChild(thinking);
    bubble.setAttribute("data-thinking", "1");
    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function hideThinking() {
    var t = chatLog.querySelector('[data-thinking="1"]');
    if (t) t.remove();
  }

  /* ------------------------------- AI plumbing ------------------------------- */

  function systemText(language, action) {
    var base =
      "You are a senior software engineer. Generate complete, production-quality " +
      language +
      " code. ALWAYS reply ONLY with valid JSON with exactly two fields: " +
      "{\"files\": {\"filename\": \"full file contents\"}, \"explanation\": \"1-3 sentence summary\"}. " +
      "Rules: file names must use the correct extension for " +
      language +
      "; escape quotes, backslashes and newlines so the JSON is valid; " +
      "do not wrap the JSON in markdown fences; do not use external CDNs or libraries " +
      "except Tailwind CDN when asked; when asked to change existing code, return EVERY file " +
      "in full (never partial snippets or '...'); keep the code clean, correct and complete.";

    if (action === "explain") {
      return (
        "You are a senior software engineer explaining code. Reply ONLY with valid JSON: " +
        "{\"files\": {}, \"explanation\": \"a clear, structured plain-text explanation covering what each part does\"}. " +
        "Do not output code in the explanation."
      );
    }
    if (action === "fix") {
      return base + " The user wants you to FIND AND FIX ERRORS in the current code. Return the corrected files in full and summarize the fixes in the explanation.";
    }
    if (action === "optimize") {
      return base + " The user wants you to OPTIMIZE the current code for performance and quality. Return the improved files in full and summarize the optimizations.";
    }
    if (action === "improve") {
      return base + " The user wants you to IMPROVE the current code (quality, best practices, readability). Return the improved files in full and summarize the improvements.";
    }
    return base;
  }

  function buildMessages(userText, action) {
    var msgs = [];
    msgs.push({ role: "system", content: systemText(state.language, action) });
    state.conversation.slice(-10).forEach(function (m) {
      msgs.push({ role: m.role, content: String(m.content).slice(0, 20000) });
    });
    var codeDump = JSON.stringify(state.files || {});
    var content = "";
    if (userText) content += userText + "\n\n";
    content += "Current code (return ALL files fully updated):\n" + codeDump;
    msgs.push({ role: "user", content: content });
    return msgs;
  }

  function setProvider(p) {
    state.provider = p;
    providerBadge.textContent = p === "backend" ? "secure server AI" : p === "openai" ? "OpenAI" : "free AI";
    providerBadge.className = "provider-badge " + (p === "backend" ? "online" : p === "openai" ? "online" : "free");
  }

  function detectProvider() {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 3000);
    fetch("/api/status", { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error("no");
        return r.json();
      })
      .then(function (d) {
        setProvider(d.key ? "backend" : "free");
      })
      .catch(function () {
        setProvider(localStorage.getItem(LS_KEY) ? "openai" : "free");
      })
      .then(function () {
        clearTimeout(timer);
      });
  }

  function resolveProvider() {
    var sel = modelSelect.value;
    if (sel === "free") return "free";
    if (sel === "openai") return localStorage.getItem(LS_KEY) ? "openai" : "free";
    return state.provider;
  }

  function backendCall(messages) {
    var body = JSON.stringify({
      messages: messages,
      model: state.provider === "backend" ? undefined : undefined
    });
    return fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    }).then(function (res) {
      if (res.status === 503) {
        return res.json().then(function (d) {
          if (d && d.error === "no_key") {
            setProvider("free");
            throw new Error("server_has_no_key");
          }
          throw new Error("AI server error");
        });
      }
      if (!res.ok) throw new Error("AI server " + res.status);
      return res.json();
    }).then(function (data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error("empty response");
      return content;
    });
  }

  function openaiCall(messages) {
    var key = localStorage.getItem(LS_KEY);
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.4,
        max_tokens: 4096
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("OpenAI " + res.status);
        return res.json();
      })
      .then(function (data) {
        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error("empty response");
        return content;
      });
  }

  function freeCall(messages) {
    var last = messages[messages.length - 1];
    var sys = messages[0] && messages[0].role === "system" ? messages[0].content : "";
    var body = JSON.stringify({
      prompt: last ? last.content : "",
      system: sys + " Return ONLY valid JSON."
    });
    return fetch(FREE_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    })
      .then(function (res) {
        if (!res.ok) throw new Error("free AI " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data.response) throw new Error("empty response");
        return data.response;
      });
  }

  function callAI(messages) {
    var p = resolveProvider();
    if (p === "backend") {
      return backendCall(messages).catch(function (err) {
        if (err.message === "server_has_no_key") return freeCall(messages);
        throw err;
      });
    }
    if (p === "openai") {
      return openaiCall(messages).catch(function () {
        return freeCall(messages);
      });
    }
    return freeCall(messages);
  }

  /* ------------------------------ response parsing ------------------------------ */

  function tryJson(text) {
    var s = text.indexOf("{");
    var e = text.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch (err) {}
    }
    return null;
  }

  function extractFences(text) {
    var blocks = [];
    var re = /```([a-zA-Z0-9+-]*)\s*\n?([\s\S]*?)```/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      blocks.push({ lang: m[1].toLowerCase(), code: m[2] });
    }
    return blocks;
  }

  function defaultFileName() {
    var list = LANGUAGES[state.language].files;
    return list[0];
  }

  function parseOutput(content, action) {
    var text = String(content || "").trim();
    var data = tryJson(text);

    if (data && data.files && typeof data.files === "object") {
      var files = {};
      Object.keys(data.files).forEach(function (name) {
        var v = data.files[name];
        if (typeof v === "string") files[name] = v;
      });
      if (Object.keys(files).length) {
        return { files: files, explanation: data.explanation || "" };
      }
    }

    var blocks = extractFences(text);
    if (blocks.length) {
      var filesFromBlocks = {};
      blocks.forEach(function (b) {
        var ext = b.lang === "jsx" ? "jsx" : b.lang === "python" || b.lang === "py" ? "py" : b.lang === "typescript" || b.lang === "ts" ? "ts" : b.lang || "";
        var name = ext ? "index." + ext : defaultFileName();
        if (ext === "css") name = "style.css";
        if (ext === "jsx") name = "App.jsx";
        if (ext === "ts") name = "index.ts";
        if (ext === "py") name = "main.py";
        filesFromBlocks[name] = b.code;
      });
      if (Object.keys(filesFromBlocks).length) {
        return { files: filesFromBlocks, explanation: "" };
      }
    }

    if (action === "explain") {
      return { files: state.files, explanation: text };
    }

    var single = {};
    single[defaultFileName()] = text;
    return { files: single, explanation: "" };
  }

  /* ------------------------------ streaming reveal ------------------------------ */

  function streamFiles(files) {
    state.files = files;
    var names = Object.keys(files);
    if (!names.length) return;
    state.activeFile = names[0];
    renderFileTabs();

    if (!editor) return;

    editor.setOption("readOnly", true);
    state.streaming = true;
    streamOverlay.hidden = false;
    streamLabel.textContent = "Streaming code…";
    setStatus("Streaming code…", "busy");

    var content = files[state.activeFile] || "";
    var chunk = 14;
    var i = 0;
    editor.setValue("");

    var timer = window.setInterval(function () {
      i = Math.min(content.length, i + chunk);
      editor.setValue(content.slice(0, i));
      editor.setCursor(editor.lineCount(), 0);
      if (i >= content.length) {
        window.clearInterval(timer);
        finishStream();
      }
    }, 12);

    function finishStream() {
      editor.setOption("readOnly", false);
      state.streaming = false;
      streamOverlay.hidden = true;
      setStatus("Ready");
      if (isRenderable()) refreshPreview();
      scheduleSave();
    }
  }

  function applyFiles(files) {
    if (!files || !Object.keys(files).length) return;
    streamFiles(files);
  }

  /* --------------------------------- actions --------------------------------- */

  function recordGeneration(action, prompt) {
    var usage = getUsage() + 1;
    writeLS(LS_USAGE, usage);
    usageCount.textContent = usage;

    var history = getHistory();
    history.unshift({
      id: Date.now() + "" + Math.floor(Math.random() * 999),
      action: action,
      prompt: prompt,
      language: state.language,
      ts: Date.now(),
      files: state.files
    });
    history = history.slice(0, 20);
    writeLS(LS_HISTORY, history);
    renderHistory();
  }

  function generate(userText, opts) {
    opts = opts || {};
    if (state.busy) return;

    var text = (userText || "").trim();
    if (!opts.skipPush) {
      if (!text) {
        chatInput.focus();
        toast("Describe what you want to build first.");
        return;
      }
      pushUser(text);
    }

    state.busy = true;
    setBusy(true);
    showThinking();

    var messages = buildMessages(text, opts.instruction);
    if (opts.action !== "explain" && !opts.skipPush) {
      state.lastPrompt = text;
    }

    callAI(messages)
      .then(function (content) {
        hideThinking();
        var parsed = parseOutput(content, opts.action);

        if (opts.action === "explain") {
          pushAssistant(parsed.explanation || "Here is an explanation of your code.");
          setBusy(false);
          return;
        }

        if (opts.action && !opts.skipPush) {
          pushAssistant("Applied: " + opts.label + ".");
        }

        applyFiles(parsed.files);
        pushAssistant(parsed.explanation || "Done — your code is ready.");
        recordGeneration(opts.action || "generate", text || opts.label || state.lastPrompt || "prompt");

        if (isRenderable() && Object.keys(parsed.files).length) {
          window.setTimeout(switchToPreview, 900);
        }
        setBusy(false);
      })
      .catch(function (err) {
        hideThinking();
        pushAssistant(
          "Something went wrong: " + err.message + ". Check the console or try again.",
          true
        );
        setBusy(false);
      });
  }

  function sendChat() {
    var text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    chatInput.style.height = "auto";
    generate(text, {});
  }

  function regenerate() {
    if (state.busy) return;
    if (!state.lastPrompt) {
      toast("Nothing to regenerate yet.");
      return;
    }
    generate(state.lastPrompt, { skipPush: true });
  }

  function runAction(action, label, instruction) {
    if (state.busy) return;
    if (!Object.keys(state.files).length) {
      toast("Generate some code first.");
      return;
    }
    generate("", { skipPush: true, action: action, label: label, instruction: instruction });
  }

  /* --------------------------------- projects --------------------------------- */

  function currentProject() {
    return {
      id: state.projectId || "p" + Date.now(),
      name: projectNameEl.value.trim() || "Untitled project",
      language: state.language,
      files: state.files,
      conversation: state.conversation,
      updatedAt: Date.now()
    };
  }

  function saveProject(showToast) {
    if (!Object.keys(state.files).length && !state.conversation.length) return;
    var proj = currentProject();
    state.projectId = proj.id;
    var list = getProjects().filter(function (p) {
      return p.id !== proj.id;
    });
    list.unshift(proj);
    list = list.slice(0, 30);
    writeLS(LS_PROJECTS, list);
    renderProjects();
    if (showToast) toast("Project saved");
  }

  function scheduleSave() {
    clearTimeout(scheduleSave.timer);
    scheduleSave.timer = setTimeout(function () {
      saveProject(false);
    }, 900);
  }

  function openProject(proj) {
    state.projectId = proj.id;
    projectNameEl.value = proj.name || "Untitled project";
    state.language = proj.language || "html";
    languageSelect.value = state.language;
    state.files = proj.files || {};
    state.conversation = proj.conversation || [];
    renderFileTabs();
    chatLog.innerHTML = "";
    if (!state.conversation.length) {
      renderWelcome();
    } else {
      state.conversation.forEach(function (m) {
        if (m.role === "user") {
          var b = el("div", "chat-bubble user", m.content);
          chatLog.appendChild(b);
        } else if (m.role === "assistant") {
          var b2 = el("div", "chat-bubble assistant");
          b2.appendChild(el("div", "bubble-label", "✦ Assistant"));
          b2.appendChild(el("p", "", m.content));
          chatLog.appendChild(b2);
        }
      });
    }
    chatLog.scrollTop = chatLog.scrollHeight;
    if (editor) {
      var names = Object.keys(state.files);
      state.activeFile = names.length ? names[0] : null;
      editor.setValue(state.files[state.activeFile] || "");
      editor.setOption("mode", state.activeFile ? modeFor(state.activeFile) : "htmlmixed");
    }
    renderProjects();
  }

  function deleteProject(id) {
    writeLS(LS_PROJECTS, getProjects().filter(function (p) {
      return p.id !== id;
    }));
    renderProjects();
    toast("Project deleted");
  }

  function renderProjects() {
    projectList.innerHTML = "";
    var list = getProjects();
    var q = (projectSearch.value || "").toLowerCase();
    if (q) list = list.filter(function (p) {
      return (p.name || "").toLowerCase().indexOf(q) !== -1;
    });
    if (!list.length) {
      projectList.appendChild(el("li", "side-empty", q ? "No matches" : "No projects yet"));
      return;
    }
    list.forEach(function (p) {
      var li = document.createElement("li");
      li.className = "side-item" + (p.id === state.projectId ? " active" : "");
      li.setAttribute("role", "button");

      var icon = el("span", "side-item-icon", "▦");
      var body = el("span", "side-item-body");
      body.appendChild(el("span", "side-item-name", p.name || "Untitled"));
      body.appendChild(el("span", "side-item-meta", timeAgo(p.updatedAt) + " · " + (p.language || "html")));

      var del = el("button", "side-item-del", "✕");
      del.type = "button";
      del.title = "Delete project";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteProject(p.id);
      });

      li.appendChild(icon);
      li.appendChild(body);
      li.appendChild(del);
      li.addEventListener("click", function () {
        openProject(p);
        closeSidebar();
      });
      projectList.appendChild(li);
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    var list = getHistory();
    if (!list.length) {
      historyList.appendChild(el("li", "side-empty", "No generations yet"));
      return;
    }
    list.forEach(function (h) {
      var li = document.createElement("li");
      li.className = "side-item";
      li.setAttribute("role", "button");
      var icon = el("span", "side-item-icon", h.action === "generate" ? "⚡" : "↻");
      var body = el("span", "side-item-body");
      body.appendChild(el("span", "side-item-name", h.prompt || h.action || "Generation"));
      body.appendChild(el("span", "side-item-meta", timeAgo(h.ts)));
      li.appendChild(icon);
      li.appendChild(body);
      li.addEventListener("click", function () {
        if (h.files) {
          state.files = h.files;
          state.language = h.language || state.language;
          languageSelect.value = state.language;
          renderFileTabs();
          var names = Object.keys(h.files);
          state.activeFile = names.length ? names[0] : null;
          if (editor) {
            editor.setValue(state.files[state.activeFile] || "");
            editor.setOption("mode", state.activeFile ? modeFor(state.activeFile) : "htmlmixed");
          }
          switchView(isRenderable() ? "preview" : "code");
          toast("Previous generation restored");
          closeSidebar();
        }
      });
      historyList.appendChild(li);
    });
  }

  function timeAgo(ts) {
    if (!ts) return "—";
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  function renderWelcome() {
    var b = el("div", "chat-bubble assistant");
    b.appendChild(el("div", "bubble-label", "✦ Assistant"));
    b.appendChild(
      el("p", "",
        "Describe what you want to build and I'll generate the code. You can follow up with requests like \"now add a pricing section\" and I'll keep the conversation context.")
    );
    chatLog.appendChild(b);
  }

  function newChat() {
    state.projectId = null;
    state.files = {};
    state.conversation = [];
    state.lastPrompt = "";
    state.activeFile = null;
    projectNameEl.value = "Untitled project";
    chatLog.innerHTML = "";
    renderWelcome();
    renderFileTabs();
    if (editor) editor.setValue("");
    switchView("code");
    renderProjects();
    toast("New chat started");
  }

  /* ------------------------------- copy / download ------------------------------- */

  function activeFileContent() {
    return state.activeFile ? state.files[state.activeFile] || "" : "";
  }

  function copyCode() {
    if (!state.activeFile) {
      toast("Nothing to copy");
      return;
    }
    var text = activeFileContent();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Copied " + state.activeFile); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copied " + state.activeFile);
    } catch (e) {
      toast("Copy failed");
    }
    document.body.removeChild(ta);
  }

  function downloadCode() {
    if (!state.activeFile) {
      toast("Nothing to download");
      return;
    }
    var text = activeFileContent();
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = state.activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    toast("Downloaded " + state.activeFile);
  }

  /* ------------------------------ preview actions ------------------------------ */

  function openPreviewTab() {
    var blob = new Blob([buildPreview()], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  function fullscreenPreview() {
    var el = deviceFrame;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () { toast("Fullscreen blocked"); });
    } else {
      toast("Fullscreen not supported");
    }
  }

  function setDevice(device) {
    deviceFrame.className = "device-frame " + device;
    document.querySelectorAll("#device-toggle button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-device") === device);
    });
  }

  /* --------------------------------- sidebar / mobile --------------------------------- */

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;
  }

  function switchMobileView(view) {
    mobileTabs.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });
    chatPanel.hidden = view !== "chat";
    codePanel.hidden = view === "chat";
    if (view === "preview") switchToPreview();
    if (view === "code") switchView("code");
  }

  /* ---------------------------------- wiring ---------------------------------- */

  function autosizeChatInput() {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
  }

  function bindEvents() {
    btnGenerate.addEventListener("click", sendChat);
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
    chatInput.addEventListener("input", autosizeChatInput);

    btnRegenerate.addEventListener("click", regenerate);
    btnImprove.addEventListener("click", function () {
      runAction("improve", "improvement", "Improve the current code: quality, best practices, readability. Return all files in full.");
    });
    btnFix.addEventListener("click", function () {
      runAction("fix", "bug fixes", "Find and fix all errors and bugs in the current code. Return all files in full.");
    });
    btnOptimize.addEventListener("click", function () {
      runAction("optimize", "optimization", "Optimize the current code for performance and quality. Return all files in full.");
    });
    btnExplain.addEventListener("click", function () {
      runAction("explain", "explanation", "Explain the current code in detail.");
    });

    btnCopy.addEventListener("click", copyCode);
    btnDownload.addEventListener("click", downloadCode);

    btnClearChat.addEventListener("click", function () {
      state.conversation = [];
      chatLog.innerHTML = "";
      renderWelcome();
      toast("Chat cleared");
    });

    btnNewChat.addEventListener("click", newChat);
    btnSave.addEventListener("click", function () { saveProject(true); });

    projectNameEl.addEventListener("change", function () {
      saveProject(false);
      renderProjects();
    });

    projectSearch.addEventListener("input", renderProjects);

    languageSelect.addEventListener("change", function () {
      state.language = languageSelect.value;
      scheduleSave();
      toast("Language: " + languageSelect.options[languageSelect.selectedIndex].text);
    });

    codeTabs.forEach(function (t) {
      t.addEventListener("click", function () {
        switchView(t.getAttribute("data-view"));
      });
    });

    document.querySelectorAll("#device-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        setDevice(b.getAttribute("data-device"));
      });
    });

    $("btn-refresh").addEventListener("click", refreshPreview);
    $("btn-open-tab").addEventListener("click", openPreviewTab);
    $("btn-fullscreen").addEventListener("click", fullscreenPreview);

    $("sidebar-toggle").addEventListener("click", openSidebar);
    $("sidebar-close").addEventListener("click", closeSidebar);
    sidebarBackdrop.addEventListener("click", closeSidebar);

    mobileTabs.forEach(function (b) {
      b.addEventListener("click", function () {
        switchMobileView(b.getAttribute("data-view"));
      });
    });

    window.addEventListener("beforeunload", function () {
      saveProject(false);
    });
  }

  /* ----------------------------------- init ----------------------------------- */

  function init() {
    initEditor();
    bindEvents();
    detectProvider();
    usageCount.textContent = getUsage();
    renderProjects();
    renderHistory();
    renderWelcome();
    renderFileTabs();
    setDevice("desktop");
  }

  init();
})();
