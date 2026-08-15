(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------
     Header — elevated state once the page is scrolled
     ------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  if (header) {
    header.addEventListener("mouseenter", function () {
      header.style.background = "rgba(11, 13, 18, 0.95)";
    });
    header.addEventListener("mouseleave", function () {
      header.style.background = "rgba(11, 13, 18, 0.85)";
    });

    var syncHeader = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", syncHeader, { passive: true });
    syncHeader();
  }

  /* ------------------------------------------------------------------
     About counters
     ------------------------------------------------------------------ */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  var statNums = document.querySelectorAll(".stat-num");
  var statObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  statNums.forEach(function (el) {
    statObserver.observe(el);
  });

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  var toast = document.getElementById("cart-toast");
  var toastTimer = null;

  if (toast) toast.setAttribute("role", "status");

  function showToast(message) {
    if (!toast) return;
    if (message) toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 2200);
  }

  /* ------------------------------------------------------------------
     Cart & login buttons
     ------------------------------------------------------------------ */
  var cart = [];

  document.querySelectorAll("[data-product]").forEach(function (button) {
    button.addEventListener("click", function () {
      cart.push(button.getAttribute("data-product"));
      showToast(button.getAttribute("data-product") + " added to cart");
    });
  });

  document.querySelectorAll(".login-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      showToast(
        button.getAttribute("data-provider") + " sign-in — coming soon"
      );
    });
  });

  /* ------------------------------------------------------------------
     Portfolio — category filters + live count
     ------------------------------------------------------------------ */
  var filterBtns = Array.prototype.slice.call(
    document.querySelectorAll(".filter-btn")
  );
  var workCards = Array.prototype.slice.call(
    document.querySelectorAll("#work-grid .work-card")
  );
  var workCount = document.getElementById("work-count");
  var workEmpty = document.getElementById("work-empty");

  function tagMatches(card, key) {
    if (key === "all") return true;
    var tags = (card.getAttribute("data-tags") || "").trim().split(/\s+/);
    return tags.indexOf(key) !== -1;
  }

  function countFor(key) {
    return key === "all"
      ? workCards.length
      : workCards.filter(function (c) {
          return tagMatches(c, key);
        }).length;
  }

  function applyFilter(key) {
    var shown = 0;
    var delay = 0;

    workCards.forEach(function (card) {
      if (tagMatches(card, key)) {
        card.style.opacity = "";
        card.style.transform = "";
        card.classList.remove("filter-hidden");
        card.classList.remove("filter-shown");
        void card.offsetWidth; /* restart the entrance animation */
        card.style.animationDelay = delay + "ms";
        card.classList.add("filter-shown");
        shown++;
        delay += 45;
      } else {
        card.classList.remove("filter-shown");
        card.classList.add("filter-hidden");
      }
    });

    filterBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-filter") === key;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (workCount) {
      workCount.innerHTML =
        "Showing <strong>" + shown + "</strong> of " + workCards.length + " projects";
    }
    if (workEmpty) {
      workEmpty.classList.toggle("show", shown === 0);
    }
  }

  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-filter"));
      });
    });

    /* Per-category counts on the filter pills */
    filterBtns.forEach(function (btn) {
      var span = btn.querySelector(".filter-count");
      if (span) span.textContent = countFor(btn.getAttribute("data-filter"));
    });

    applyFilter("all");
  }

  /* ------------------------------------------------------------------
     Services data
     ------------------------------------------------------------------ */
  var SERVICES = {
    "ai-web": {
      kicker: "AI Website Development",
      title: "AI Website Development",
      icon: "⌘",
      visual: "sv-ai-web",
      desc: "Production-ready websites built with AI acceleration. We turn your brief into a live, polished site in days — not months.",
      features: ["AI-assisted build pipeline", "Custom design, not templates", "SEO & performance baked in", "CMS, commerce, or marketing sites"],
      benefits: ["Launch weeks faster", "Lower cost than a traditional build", "A clean, maintainable codebase"],
      use: ["Startup landing pages", "Company websites", "E-commerce stores", "Marketing campaign pages"],
      tech: ["Next.js", "React", "Tailwind CSS", "Python", "Vercel / Cloudflare"]
    },
    "ai-code": {
      kicker: "AI Code Generator",
      title: "AI Code Generator",
      icon: "✦",
      visual: "sv-ai-code",
      desc: "Describe it in plain language and get complete, production-quality code across every major stack — write, explain, debug, and optimize in one place.",
      features: ["Natural-language to code", "HTML to React, Python to Tailwind", "Live preview & edit", "Fix and optimize tools"],
      benefits: ["Ship faster with less boilerplate", "Lower barrier to building", "Iterate without context switching"],
      use: ["Rapid prototyping", "Reusable UI components", "Scripts & automations", "Learning & exploration"],
      tech: ["JavaScript", "TypeScript", "React", "Python", "CSS / Tailwind"]
    },
    "web-dev": {
      kicker: "Web Design & Development",
      title: "Web Design & Development",
      icon: "◉",
      visual: "sv-web-dev",
      desc: "Hand-crafted, fast, and accessible websites engineered to convert — from concept to deployment with quality at every step.",
      features: ["Custom, responsive builds", "Accessibility & core web vitals", "CMS and marketing integration", "Ongoing support & hosting"],
      benefits: ["Fast, reliable experiences", "Higher conversion rates", "Easy for your team to manage"],
      use: ["Corporate sites", "Portfolio & studio sites", "Product launches", "Blog / content platforms"],
      tech: ["HTML", "CSS", "JavaScript", "Next.js", "Headless CMS"]
    },
    "uiux": {
      kicker: "UI/UX Design",
      title: "UI/UX Design",
      icon: "◐",
      visual: "sv-uiux",
      desc: "Interfaces people love to use — research-driven, pixel-perfect, and consistent across every screen.",
      features: ["User research & flows", "Wireframes to hi-fi design", "Design systems & tokens", "Interactive prototypes"],
      benefits: ["Higher user retention", "Faster dev handoff", "A consistent brand feel"],
      use: ["SaaS dashboards", "Mobile & web apps", "Feature redesigns", "Design-system builds"],
      tech: ["Figma", "Design Systems", "Prototyping", "UX Research"]
    },
    "ai-auto": {
      kicker: "AI Automation",
      title: "AI Automation",
      icon: "⚙",
      visual: "sv-ai-auto",
      desc: "Replace repetitive work with AI workflows that run your operations on autopilot — support, data, and admin included.",
      features: ["Custom workflow builders", "AI agents & assistants", "CRM / app integrations", "Human-in-the-loop controls"],
      benefits: ["Hours saved every week", "Fewer manual errors", "Scalable operations"],
      use: ["Support triage & replies", "Data entry & reporting", "Lead qualification", "Internal ops pipelines"],
      tech: ["Python", "OpenAI APIs", "Zapier / Make", "SQL", "Webhooks"]
    },
    "branding": {
      kicker: "Branding & Graphic Design",
      title: "Branding & Graphic Design",
      icon: "✦",
      visual: "sv-branding",
      desc: "Logos, identities, and visuals that make your brand unmistakable — and consistent everywhere it shows up.",
      features: ["Logo & identity systems", "Color, type & guidelines", "Marketing & social graphics", "Presentation & collateral"],
      benefits: ["A memorable, ownable brand", "Consistent across channels", "Ready-to-use asset libraries"],
      use: ["Startup launches", "Rebrands", "Product packaging", "Event & campaign kits"],
      tech: ["Brand Strategy", "Illustration", "Typography", "Motion"]
    },
    "creative": {
      kicker: "Creative Digital Solutions",
      title: "Creative Digital Solutions",
      icon: "◇",
      visual: "sv-creative",
      desc: "Interactive experiences, motion, and content systems that make brands stand out in crowded markets.",
      features: ["Interactive web experiences", "Motion & micro-interactions", "Content & campaign systems", "Immersive microsites"],
      benefits: ["Stand out from competitors", "Stronger brand recall", "Shareable, memorable work"],
      use: ["Campaign microsites", "Product demos", "Launch experiences", "Interactive storytelling"],
      tech: ["GSAP", "Three.js", "WebGL", "JavaScript"]
    },
    "custom-ai": {
      kicker: "Custom AI Solutions",
      title: "Custom AI Solutions",
      icon: "◆",
      visual: "sv-custom",
      desc: "Tailored models, agents, and pipelines built around your data and workflows — production-grade and secure.",
      features: ["Fine-tuned models & agents", "RAG over your data", "API & dashboard delivery", "Security & compliance"],
      benefits: ["AI built for your problem", "Private, on your data", "Measurable ROI"],
      use: ["Domain-specific assistants", "Document intelligence", "Predictive tools", "Internal AI products"],
      tech: ["Python", "LangChain", "Vector DBs", "OpenAI / open models", "Docker"]
    }
  };

  /* ------------------------------------------------------------------
     Modals — open/close, focus management and focus trap
     ------------------------------------------------------------------ */
  var serviceModal = document.getElementById("service-modal");
  var loginModal = document.getElementById("login-modal");
  var lastFocused = null;

  function getFocusable(modal) {
    var panel = modal.querySelector(".modal-panel");
    if (!panel) return [];
    return Array.prototype.slice
      .call(
        panel.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
  }

  function openModal(modal) {
    if (!modal || modal.classList.contains("open")) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    window.requestAnimationFrame(function () {
      modal.classList.add("open");
      var first = getFocusable(modal)[0];
      if (first) first.focus();
    });
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    window.setTimeout(function () {
      modal.hidden = true;
      if (lastFocused && lastFocused.focus && document.contains(lastFocused)) {
        lastFocused.focus();
      }
    }, 320);
    document.body.style.overflow = "";
  }

  function fillList(id, items) {
    var ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = "";
    items.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
  }

  function fillChips(id, items) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = "";
    items.forEach(function (text) {
      var span = document.createElement("span");
      span.textContent = text;
      box.appendChild(span);
    });
  }

  function openService(key) {
    var s = SERVICES[key];
    if (!s || !serviceModal) return;
    document.getElementById("modal-title").textContent = s.title;
    document.getElementById("modal-kicker").textContent = s.kicker;
    document.getElementById("modal-desc").textContent = s.desc;
    document.getElementById("modal-icon").textContent = s.icon;
    document.getElementById("modal-visual").className = "modal-visual " + s.visual;
    fillList("modal-features", s.features);
    fillList("modal-benefits", s.benefits);
    fillChips("modal-use", s.use);
    fillChips("modal-tech", s.tech);
    openModal(serviceModal);
  }

  /* Service cards — click, keyboard (Enter / Space) */
  document.querySelectorAll(".service-card").forEach(function (card) {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");

    card.addEventListener("click", function () {
      var key = card.getAttribute("data-service");
      if (key) openService(key);
    });

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var key = card.getAttribute("data-service");
        if (key) openService(key);
      }
    });
  });

  /* Close buttons & backdrops */
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeModal(
        el.getAttribute("data-close") === "login" ? loginModal : serviceModal
      );
    });
  });

  var navLogin = document.getElementById("nav-login");
  if (navLogin) {
    navLogin.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(loginModal);
    });
  }

  var modalCta = document.getElementById("modal-cta");
  if (modalCta) {
    modalCta.addEventListener("click", function () {
      closeModal(serviceModal);
    });
  }

  /* Keyboard: Escape closes modals + mobile nav; Tab is trapped while open */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (navLinks && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      }
      closeModal(serviceModal);
      closeModal(loginModal);
      return;
    }

    if (e.key === "Tab") {
      var activeModal = null;
      if (serviceModal && !serviceModal.hidden) activeModal = serviceModal;
      else if (loginModal && !loginModal.hidden) activeModal = loginModal;

      if (activeModal) {
        var focusables = getFocusable(activeModal);
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  /* ------------------------------------------------------------------
     Contact form — validation, loading state, double-submit guard
     ------------------------------------------------------------------ */
  var form = document.getElementById("contact-form");
  var formStatus = document.getElementById("form-status");

  if (form) {
    var submitBtn = form.querySelector(".btn-send");
    var submitLock = false;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitLock) return;

      var fields = form.querySelectorAll("input, textarea");
      var valid = true;

      fields.forEach(function (field) {
        var isInvalid = !field.checkValidity();
        field.classList.toggle("invalid", isInvalid);
        if (isInvalid) valid = false;
      });

      if (!valid) {
        if (formStatus) {
          formStatus.textContent = "Please fill in all fields correctly.";
          formStatus.className = "form-status error";
        }
        return;
      }

      /* Loading state, then success */
      submitLock = true;
      var originalHtml = submitBtn ? submitBtn.innerHTML : "";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        submitBtn.innerHTML =
          '<span class="spinner" aria-hidden="true"></span> Sending…';
      }

      window.setTimeout(function () {
        submitLock = false;

        if (formStatus) {
          formStatus.textContent = "Thanks! Your message has been sent.";
          formStatus.className = "form-status success";
        }
        form.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("loading");
          submitBtn.innerHTML = originalHtml;
        }
      }, 900);
    });

    form.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        field.classList.remove("invalid");
      });
    });
  }

  /* ------------------------------------------------------------------
     Hero terminal typing
     ------------------------------------------------------------------ */
  var techOutput = document.getElementById("tech-output");
  if (techOutput) {
    var prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    var lines = [
      { text: "$ npm run deploy", cls: "tok-cmd" },
      { text: "✓ compiling modules... done", cls: "tok-ok" },
      { text: "▲ building for production", cls: "tok-info" },
      { text: "✓ bundled in 3.2s", cls: "tok-ok" },
      { text: "✦ launching PixelPulse", cls: "tok-dim" },
      { text: "● 200 OK  https://pixelpulse.app", cls: "tok-link" },
      { text: "▲ build v2.4.1  •  4.2 MB", cls: "tok-dim" },
      { text: "✓ shipped to edge (12 regions)", cls: "tok-ok" }
    ];

    var cursor = document.createElement("span");
    cursor.className = "cursor";

    function renderAll() {
      techOutput.textContent = "";
      lines.forEach(function (line) {
        var div = document.createElement("div");
        var span = document.createElement("span");
        span.className = line.cls;
        span.textContent = line.text;
        div.appendChild(span);
        techOutput.appendChild(div);
      });
      techOutput.appendChild(cursor.cloneNode());
    }

    function typeLine(lineEl, text, cls, onDone) {
      var span = document.createElement("span");
      span.className = cls;
      lineEl.appendChild(span);
      var i = 0;
      var step = function () {
        i++;
        span.textContent = text.slice(0, i);
        if (i < text.length) {
          window.setTimeout(step, 26);
        } else {
          onDone();
        }
      };
      step();
    }

    function runSequence() {
      techOutput.textContent = "";
      var i = 0;
      var next = function () {
        if (i >= lines.length) {
          techOutput.appendChild(cursor.cloneNode());
          window.setTimeout(runSequence, 4800);
          return;
        }
        var div = document.createElement("div");
        techOutput.appendChild(div);
        typeLine(div, lines[i].text, lines[i].cls, function () {
          i++;
          window.setTimeout(next, 330);
        });
      };
      next();
    }

    if (prefersReducedMotion) {
      renderAll();
    } else {
      window.setTimeout(runSequence, 500);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          window.setTimeout(runSequence, 300);
        }
      });
    }
  }
})();
