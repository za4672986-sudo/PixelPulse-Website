(function () {
  "use strict";

  var promptEl = document.getElementById("ai-prompt");
  var generateBtn = document.getElementById("ai-generate");
  var settingsToggle = document.getElementById("ai-settings-toggle");
  var settingsEl = document.getElementById("ai-settings");
  var keyEl = document.getElementById("ai-key");
  var saveKeyBtn = document.getElementById("ai-save-key");
  var modeEl = document.getElementById("ai-mode");
  var statusEl = document.getElementById("ai-status");

  var KEY_STORE = "pp_ai_key";

  /* ---------------------------------- templates ---------------------------------- */

  var landing = {
    name: "Landing page",
    keywords: ["landing", "startup", "saas", "product", "business", "coffee", "restaurant", "shop", "app", "software", "company", "services", "agency"],
    html: [
      '<header class="nav"><span class="logo">✦ Aurora</span><nav><a href="#features">Features</a><a class="btn" href="#cta">Get started</a></nav></header>',
      '<section class="hero">',
      '  <p class="pill">New — v2.0 is here</p>',
      '  <h1>Build something people <span class="accent">remember</span></h1>',
      '  <p class="sub">A clean, fast landing page, crafted with care.</p>',
      '  <div class="hero-actions"><a class="btn" href="#cta">Start free</a><a class="btn ghost" href="#features">Learn more</a></div>',
      '</section>',
      '<section id="features" class="features">',
      '  <div class="feature"><span>⚡</span><h3>Fast</h3><p>Loads in a blink.</p></div>',
      '  <div class="feature"><span>🔒</span><h3>Secure</h3><p>Private by default.</p></div>',
      '  <div class="feature"><span>🚀</span><h3>Scalable</h3><p>Grows with you.</p></div>',
      '</section>',
      '<footer class="foot">© 2026 Aurora</footer>'
    ].join("\n"),
    css: [
      ":root{--bg:#0b0d12;--text:#e8eaf0;--accent:#7c5cff;--radius:12px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:var(--fs);line-height:1.6}",
      ".nav{display:flex;justify-content:space-between;align-items:center;padding:20px 32px}",
      ".logo{font-weight:800;font-size:1.2rem}",
      ".nav nav{display:flex;gap:16px;align-items:center}",
      ".nav a{color:var(--text);text-decoration:none}",
      ".btn{background:var(--accent);color:#fff;border-radius:var(--radius);padding:10px 18px;text-decoration:none;display:inline-block}",
      ".btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.3)}",
      ".hero{text-align:center;padding:90px 24px 70px}",
      ".pill{display:inline-block;border:1px solid var(--accent);color:var(--accent);border-radius:999px;padding:4px 14px;font-size:.8rem;margin-bottom:18px}",
      ".hero h1{font-size:2.8rem;margin-bottom:16px}",
      ".accent{color:var(--accent)}",
      ".sub{opacity:.75;margin-bottom:28px}",
      ".hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}",
      ".features{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--gap);padding:0 32px 80px;max-width:900px;margin:0 auto}",
      ".feature{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:24px;text-align:center}",
      ".feature span{font-size:1.6rem}",
      ".feature h3{margin:8px 0 4px}",
      ".feature p{opacity:.7;font-size:.9rem}",
      ".foot{text-align:center;opacity:.5;padding:20px;font-size:.85rem}"
    ].join("\n"),
    js: ""
  };

  var portfolio = {
    name: "Portfolio",
    keywords: ["portfolio", "personal", "resume", "cv", "about", "me", "designer", "photographer", "artist", "freelance"],
    html: [
      '<header class="nav"><span class="logo">J. Doe</span><nav><a href="#work">Work</a><a class="btn" href="#contact">Contact</a></nav></header>',
      '<section class="hero">',
      '  <h1>Hi, I&rsquo;m <span class="accent">Jordan</span>.</h1>',
      '  <p>I design and build delightful digital experiences.</p>',
      '  <div class="chips"><span>Design</span><span>Code</span><span>Motion</span></div>',
      '</section>',
      '<section id="work" class="work"><h2>Selected work</h2>',
      '  <div class="grid">',
      '    <div class="proj"><div class="thumb a">A</div><h3>Nova</h3></div>',
      '    <div class="proj"><div class="thumb b">B</div><h3>Pulse</h3></div>',
      '    <div class="proj"><div class="thumb c">C</div><h3>Orbit</h3></div>',
      '  </div>',
      '</section>'
    ].join("\n"),
    css: [
      ":root{--bg:#f6f3ff;--text:#1a1d29;--accent:#7c5cff;--radius:14px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:var(--fs);line-height:1.6}",
      ".nav{display:flex;justify-content:space-between;align-items:center;padding:20px 32px}",
      ".logo{font-weight:800;font-size:1.2rem}",
      ".nav nav{display:flex;gap:16px;align-items:center}",
      ".nav a{color:var(--text);text-decoration:none}",
      ".btn{background:var(--accent);color:#fff;border-radius:var(--radius);padding:10px 18px;text-decoration:none;display:inline-block}",
      ".btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.3)}",
      ".hero{text-align:center;padding:80px 24px 60px}",
      ".hero h1{font-size:2.6rem;margin-bottom:10px}",
      ".accent{color:var(--accent)}",
      ".hero p{opacity:.75;margin-bottom:20px}",
      ".chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}",
      ".chips span{background:#fff;border:1px solid #e3e0f5;border-radius:999px;padding:6px 16px;font-size:.85rem}",
      ".work{max-width:900px;margin:0 auto;padding:40px 24px 80px}",
      ".work h2{margin-bottom:24px}",
      ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--gap)}",
      ".proj{background:#fff;border:1px solid #e3e0f5;border-radius:var(--radius);padding:14px;box-shadow:0 6px 18px rgba(40,20,90,.06)}",
      ".thumb{height:120px;border-radius:10px;display:grid;place-items:center;font-size:2rem;font-weight:800;color:#fff;margin-bottom:10px}",
      ".thumb.a{background:linear-gradient(135deg,#7c5cff,#4facfe)}",
      ".thumb.b{background:linear-gradient(135deg,#ff5c8a,#ffb86c)}",
      ".thumb.c{background:linear-gradient(135deg,#00d2a7,#4facfe)}",
      ".proj h3{font-size:1rem}"
    ].join("\n"),
    js: ""
  };

  var pricing = {
    name: "Pricing page",
    keywords: ["pricing", "plans", "plan", "subscription", "billing", "pay", "tiers"],
    html: [
      '<section class="wrap">',
      '  <h1>Simple <span class="accent">pricing</span></h1>',
      '  <p class="sub">Start free. Upgrade when you&rsquo;re ready.</p>',
      '  <label class="toggle"><span>Monthly</span><input id="billing" type="checkbox"><i></i><span>Yearly <b>-20%</b></span></label>',
      '  <div class="plans">',
      '    <div class="plan"><h3>Starter</h3><p class="price" data-m="9" data-y="7">$9<span>/mo</span></p><ul><li>1 project</li><li>Community support</li></ul><a class="btn ghost">Choose</a></div>',
      '    <div class="plan popular"><h3>Pro</h3><p class="price" data-m="24" data-y="19">$24<span>/mo</span></p><ul><li>Unlimited projects</li><li>Priority support</li><li>Analytics</li></ul><a class="btn">Choose</a></div>',
      '    <div class="plan"><h3>Team</h3><p class="price" data-m="49" data-y="39">$49<span>/mo</span></p><ul><li>Everything in Pro</li><li>5 seats</li></ul><a class="btn ghost">Choose</a></div>',
      '  </div>',
      '</section>'
    ].join("\n"),
    css: [
      ":root{--bg:#0b0d12;--text:#e8eaf0;--accent:#7c5cff;--radius:14px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:var(--fs);line-height:1.6;display:grid;place-items:center;min-height:100vh;padding:40px 20px}",
      ".wrap{text-align:center;max-width:900px;width:100%}",
      "h1{font-size:2.4rem;margin-bottom:6px}",
      ".accent{color:var(--accent)}",
      ".sub{opacity:.7;margin-bottom:24px}",
      ".toggle{display:inline-flex;align-items:center;gap:10px;margin-bottom:32px;cursor:pointer;font-size:.9rem;opacity:.85}",
      ".toggle input{display:none}",
      ".toggle i{width:44px;height:24px;background:var(--border);border-radius:999px;position:relative;transition:.2s}",
      ".toggle i:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}",
      ".toggle input:checked+i{background:var(--accent)}",
      ".toggle input:checked+i:after{transform:translateX(20px)}",
      ".toggle b{color:var(--accent);font-weight:600}",
      ".plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--gap)}",
      ".plan{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:28px 22px;text-align:left}",
      ".plan.popular{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}",
      ".plan h3{margin-bottom:8px}",
      ".price{font-size:2rem;font-weight:800;margin-bottom:16px}",
      ".price span{font-size:.9rem;font-weight:400;opacity:.6}",
      ".plan ul{list-style:none;margin-bottom:20px;display:grid;gap:8px;font-size:.9rem;opacity:.8}",
      ".plan ul li:before{content:'✓ ';color:var(--accent)}",
      ".btn{display:block;text-align:center;background:var(--accent);color:#fff;border-radius:var(--radius);padding:10px 18px;cursor:pointer}",
      ".btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.3)}"
    ].join("\n"),
    js: [
      "var t = document.getElementById('billing');",
      "var prices = document.querySelectorAll('.price');",
      "t.addEventListener('change', function () {",
      "  prices.forEach(function (p) {",
      "    var key = t.checked ? 'data-y' : 'data-m';",
      "    p.childNodes[0].nodeValue = '$' + p.getAttribute(key) + ' ';",
      "  });",
      "});"
    ].join("\n")
  };

  var todo = {
    name: "Todo app",
    keywords: ["todo", "task", "tasks", "notes", "checklist", "list", "planner"],
    html: [
      '<div class="card">',
      '  <h1>Today&rsquo;s tasks</h1>',
      '  <form id="form"><input id="input" placeholder="Add a task…" autocomplete="off"><button class="btn">Add</button></form>',
      '  <ul id="list"></ul>',
      '  <p class="foot"><span id="left">0 left</span><button id="clear" class="link">Clear done</button></p>',
      '</div>'
    ].join("\n"),
    css: [
      ":root{--bg:#f4f5fb;--text:#1a1d29;--accent:#7c5cff;--radius:14px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:var(--fs);line-height:1.6;display:grid;place-items:center;min-height:100vh;padding:20px}",
      ".card{background:#fff;border:1px solid #e3e5f0;border-radius:var(--radius);padding:26px;width:100%;max-width:420px;box-shadow:0 10px 30px rgba(20,20,40,.08)}",
      "h1{font-size:1.4rem;margin-bottom:18px}",
      "#form{display:flex;gap:10px;margin-bottom:16px}",
      "input{flex:1;border:1px solid #d9dcf0;border-radius:10px;padding:10px 12px;font-size:.95rem;outline:none}",
      "input:focus{border-color:var(--accent)}",
      ".btn{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:10px 16px;cursor:pointer}",
      "#list{list-style:none;display:grid;gap:8px;margin-bottom:16px}",
      "#list li{display:flex;align-items:center;gap:10px;background:#f8f9ff;border:1px solid #eceefc;border-radius:10px;padding:10px 12px}",
      "#list li input{width:16px;height:16px;accent-color:var(--accent)}",
      "#list li.done span{text-decoration:line-through;opacity:.5}",
      "#list li button{margin-left:auto;background:none;border:0;color:#ff5c8a;cursor:pointer;font-size:.85rem}",
      ".foot{display:flex;justify-content:space-between;font-size:.85rem;opacity:.7}",
      ".link{background:none;border:0;color:var(--accent);cursor:pointer}"
    ].join("\n"),
    js: [
      "var form = document.getElementById('form');",
      "var input = document.getElementById('input');",
      "var list = document.getElementById('list');",
      "var left = document.getElementById('left');",
      "function count(){ left.textContent = list.querySelectorAll('li:not(.done)').length + ' left'; }",
      "form.addEventListener('submit', function (e) {",
      "  e.preventDefault();",
      "  var v = input.value.trim();",
      "  if (!v) return;",
      "  var li = document.createElement('li');",
      "  li.innerHTML = '<input type=\"checkbox\"><span></span><button>✕</button>';",
      "  li.querySelector('span').textContent = v;",
      "  li.querySelector('input').addEventListener('change', function(){ li.classList.toggle('done'); count(); });",
      "  li.querySelector('button').addEventListener('click', function(){ li.remove(); count(); });",
      "  list.appendChild(li);",
      "  input.value = '';",
      "  count();",
      "});",
      "document.getElementById('clear').addEventListener('click', function () {",
      "  list.querySelectorAll('li.done').forEach(function (li) { li.remove(); });",
      "  count();",
      "});",
      "count();"
    ].join("\n")
  };

  var calculator = {
    name: "Calculator",
    keywords: ["calculator", "calc", "math", "calculator app"],
    html: [
      '<div class="calc">',
      '  <div class="screen" id="screen">0</div>',
      '  <div class="keys">',
      '    <button data-k="C" class="op">C</button><button data-k="⌫" class="op">⌫</button><button data-k="%" class="op">%</button><button data-k="/" class="op">÷</button>',
      '    <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button data-k="*" class="op">×</button>',
      '    <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button data-k="-" class="op">−</button>',
      '    <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button data-k="+" class="op">+</button>',
      '    <button data-k="0" class="zero">0</button><button data-k=".">.</button><button data-k="=" class="eq">=</button>',
      '  </div>',
      '</div>'
    ].join("\n"),
    css: [
      ":root{--bg:#0b0d12;--text:#e8eaf0;--accent:#7c5cff;--radius:16px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);display:grid;place-items:center;min-height:100vh}",
      ".calc{width:300px;background:#161a24;border:1px solid rgba(255,255,255,.1);border-radius:var(--radius);padding:18px}",
      ".screen{background:#0d0f16;border-radius:12px;padding:20px 16px;font-size:2rem;text-align:right;margin-bottom:14px;overflow:hidden}",
      ".keys{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}",
      "button{font-size:1.2rem;padding:16px 0;border:0;border-radius:10px;background:#222839;color:var(--text);cursor:pointer;transition:.1s}",
      "button:active{transform:scale(.94)}",
      ".op{color:var(--accent);font-weight:700}",
      ".eq{background:var(--accent);color:#fff;grid-row:span 2}",
      ".zero{grid-column:span 2}"
    ].join("\n"),
    js: [
      "var screen = document.getElementById('screen');",
      "var expr = '';",
      "function render(){ screen.textContent = expr || '0'; }",
      "document.querySelectorAll('.keys button').forEach(function (b) {",
      "  b.addEventListener('click', function () {",
      "    var k = b.getAttribute('data-k');",
      "    if (k === 'C') { expr = ''; render(); return; }",
      "    if (k === '⌫') { expr = expr.slice(0, -1); render(); return; }",
      "    if (k === '=') {",
      "      try { expr = String(Function('return (' + expr.replace(/%/g, '/100') + ')')()); }",
      "      catch (e) { expr = 'Error'; }",
      "      render(); return;",
      "    }",
      "    expr += k;",
      "    render();",
      "  });",
      "});"
    ].join("\n")
  };

  var login = {
    name: "Login page",
    keywords: ["login", "signup", "sign up", "register", "auth", "authentication", "account", "password"],
    html: [
      '<div class="card">',
      '  <h1>Welcome back</h1>',
      '  <p class="sub">Sign in to your account</p>',
      '  <form id="form">',
      '    <label>Email<input id="email" type="email" placeholder="you@example.com"></label>',
      '    <label>Password<input id="pass" type="password" placeholder="••••••••"></label>',
      '    <button class="btn">Sign in</button>',
      '    <p class="msg" id="msg"></p>',
      '  </form>',
      '  <p class="alt">No account? <a href="#">Sign up</a></p>',
      '</div>'
    ].join("\n"),
    css: [
      ":root{--bg:#f4f5fb;--text:#1a1d29;--accent:#7c5cff;--radius:14px;--fs:16px;--gap:24px}",
      "*{box-sizing:border-box;margin:0}",
      "body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);display:grid;place-items:center;min-height:100vh;padding:20px}",
      ".card{background:#fff;border:1px solid #e3e5f0;border-radius:var(--radius);padding:34px;width:100%;max-width:380px;box-shadow:0 12px 34px rgba(20,20,40,.1)}",
      "h1{font-size:1.5rem;margin-bottom:4px}",
      ".sub{opacity:.6;margin-bottom:22px}",
      "form{display:grid;gap:14px}",
      "label{display:grid;gap:6px;font-size:.85rem;font-weight:600}",
      "input{border:1px solid #d9dcf0;border-radius:10px;padding:11px 12px;font-size:.95rem;outline:none}",
      "input:focus{border-color:var(--accent)}",
      ".btn{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:12px;font-size:1rem;cursor:pointer}",
      ".msg{margin-top:6px;font-size:.85rem;color:#3ddc97}",
      ".alt{margin-top:18px;font-size:.85rem;opacity:.7;text-align:center}",
      ".alt a{color:var(--accent)}"
    ].join("\n"),
    js: [
      "document.getElementById('form').addEventListener('submit', function (e) {",
      "  e.preventDefault();",
      "  var email = document.getElementById('email').value;",
      "  var pass = document.getElementById('pass').value;",
      "  var msg = document.getElementById('msg');",
      "  if (!email || !pass) { msg.textContent = 'Please fill in both fields.'; msg.style.color = '#ff5c8a'; return; }",
      "  if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { msg.textContent = 'Enter a valid email.'; msg.style.color = '#ff5c8a'; return; }",
      "  msg.textContent = '✓ Signed in (demo)!';",
      "  msg.style.color = '#3ddc97';",
      "});"
    ].join("\n")
  };

  var templates = [landing, portfolio, pricing, todo, calculator, login];

  /* ---------------------------------- helpers ---------------------------------- */

  function setStatus(text, done) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.hidden = false;
    statusEl.classList.toggle("done", !!done);
  }

  function pickTemplate(prompt) {
    var p = prompt.toLowerCase();
    var best = templates[0];
    var bestScore = 0;
    templates.forEach(function (t) {
      var score = 0;
      t.keywords.forEach(function (k) {
        if (p.indexOf(k) !== -1) score += k.length;
      });
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    });
    return best;
  }

  function stripExternalRefs(html) {
    return html
      .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
      .replace(/<script[^>]*src=["'][^"']*["'][^>]*>\s*<\/script>/gi, "");
  }

  function extractBlock(text, lang) {
    var re = new RegExp(
      "```(?:lang\\s*=\\s*[\"']?)?" +
        lang +
        "(?:[\"'])?\\s*\\n([\\s\\S]*?)```",
      "i"
    );
    var m = text.match(re);
    return m ? m[1] : null;
  }

  function parseAI(content) {
    var text = String(content || "").trim();
    var data = null;

    var start = text.indexOf("{");
    if (start !== -1) {
      var candidate = text.slice(start);
      try {
        data = JSON.parse(candidate);
      } catch (e) {}
      if (!data || typeof data.html !== "string") {
        var jsonMatch = text.match(/```json\s*\n?([\s\S]*?)```/i);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[1]);
          } catch (e2) {}
        }
      }
    }

    if (data && typeof data.html === "string") {
      data.html = stripExternalRefs(data.html);
      return data;
    }

    var html = extractBlock(text, "html");
    var css = extractBlock(text, "css");
    var js = extractBlock(text, "js") || extractBlock(text, "javascript");
    if (html || css || js) {
      return {
        html: stripExternalRefs(html || ""),
        css: css || "",
        js: js || ""
      };
    }

    var wholeDoc = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    if (wholeDoc) {
      var full = wholeDoc[0];
      var style = full.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      var script = full.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      var body = full
        .replace(/<style[^>]*>[\s\S]*?<\/style>/i, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
      var bodyStart = body.search(/<body[^>]*>/i);
      var bodyEnd = body.lastIndexOf("</body>");
      var inner = body;
      if (bodyStart !== -1 && bodyEnd !== -1) {
        inner = body.slice(bodyStart, bodyEnd);
        inner = inner.replace(/<body[^>]*>/i, "");
      }
      return {
        html: stripExternalRefs(inner),
        css: (style ? style[1] : "") || "",
        js: (script ? script[1] : "") || ""
      };
    }

    return null;
  }

  function apply(result, sourceName) {
    if (window.Playground) {
      window.Playground.setCode(result);
    }
    setStatus("✦ Generated " + sourceName + " — code is ready in the editors.", true);
  }

  /* ---------------------------------- offline ---------------------------------- */

  function offlineGenerate(prompt) {
    setStatus("✦ Thinking…");
    setTimeout(function () {
      var t = pickTemplate(prompt || "landing");
      apply(
        { html: t.html, css: t.css, js: t.js },
        t.name + " (offline template)"
      );
    }, 700);
  }

  /* ----------------------------------- online ----------------------------------- */

  var FREE_AI_URL = "https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate";

  var CODE_SYSTEM =
    "You are a senior front-end engineer. Build a complete standalone website " +
    "in vanilla HTML, CSS and JavaScript. ALWAYS output ONLY valid JSON with " +
    "exactly three string fields: {\"html\":\"...\",\"css\":\"...\",\"js\":\"...\"}. " +
    "Rules: 1) Put ALL CSS in the \"css\" field, never inside the html. " +
    "2) Escape quotes, backslashes and newlines so the JSON is valid. " +
    "3) Do not wrap the JSON in markdown code fences. " +
    "4) The css must start with :root{--bg;--text;--accent;--radius;--fs;--gap} " +
    "and use these CSS variables throughout the design. " +
    "5) Self-contained: no external CDNs, fonts or libraries. " +
    "6) Complete but concise. The js must not throw errors on load.";

  function onlineGenerate(prompt) {
    var key = localStorage.getItem(KEY_STORE);
    if (key) return openaiGenerate(prompt);
    return freeGenerate(prompt);
  }

  function freeGenerate(prompt) {
    setStatus("✦ Free AI is writing your code…");
    fetch(FREE_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Generate a website. User request: " + prompt,
        system: CODE_SYSTEM
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("AI " + res.status);
        return res.json();
      })
      .then(function (data) {
        var content = data.response;
        if (!content) throw new Error("empty response");
        var parsed = parseAI(content);
        if (!parsed) throw new Error("unparseable response");
        apply(parsed, "with free AI");
      })
      .catch(function (err) {
        setStatus(
          "✦ Free AI failed (" + err.message + ") — using offline template"
        );
        setTimeout(function () {
          offlineGenerate(prompt);
        }, 700);
      });
  }

  function openaiGenerate(prompt) {
    var base = "https://api.openai.com/v1/chat/completions";
    var model = "gpt-4o-mini";
    var key = localStorage.getItem(KEY_STORE);

    setStatus("✦ OpenAI is writing your code…");
    fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: CODE_SYSTEM },
          { role: "user", content: "Generate a website. User request: " + prompt }
        ],
        temperature: 0.4
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("API " + res.status);
        return res.json();
      })
      .then(function (data) {
        var content =
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content;
        if (!content) throw new Error("empty response");
        var parsed = parseAI(content);
        if (!parsed) throw new Error("unparseable response");
        apply(parsed, "with OpenAI");
      })
      .catch(function (err) {
        setStatus(
          "✦ OpenAI failed (" + err.message + ") — using offline template"
        );
        setTimeout(function () {
          offlineGenerate(prompt);
        }, 700);
      });
  }

  /* ------------------------------------ UI ------------------------------------ */

  function refreshMode() {
    var hasKey = !!localStorage.getItem(KEY_STORE);
    if (!modeEl) return;
    modeEl.textContent = hasKey
      ? "OpenAI mode (higher quality)"
      : "free AI mode — no key needed";
    modeEl.classList.toggle("online", hasKey);
  }

  function generate() {
    var prompt = (promptEl && promptEl.value.trim()) || "";
    if (!prompt) {
      promptEl.focus();
      return;
    }
    onlineGenerate(prompt);
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generate);
  }
  if (promptEl) {
    promptEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") generate();
    });
  }
  if (settingsToggle) {
    settingsToggle.addEventListener("click", function () {
      settingsEl.hidden = !settingsEl.hidden;
    });
  }
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener("click", function () {
      var key = (keyEl && keyEl.value.trim()) || "";
      if (key) {
        localStorage.setItem(KEY_STORE, key);
        keyEl.value = "";
        setStatus("✦ API key saved — AI generation enabled.", true);
      } else {
        localStorage.removeItem(KEY_STORE);
        setStatus("✦ API key removed — using offline mode.", true);
      }
      refreshMode();
    });
  }

  refreshMode();
})();
