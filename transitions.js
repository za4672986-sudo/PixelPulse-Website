(function () {
  "use strict";

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var preloader = document.getElementById("preloader");
  var countEl = document.getElementById("preloader-count");
  var fillEl = document.getElementById("preloader-fill");

  function cleanup() {
    if (preloader && preloader.parentNode) {
      preloader.parentNode.removeChild(preloader);
    }
    document.body.style.overflow = "";
  }

  function forceReveal() {
    if (!preloader || !preloader.parentNode) return;
    if (!preloader.style.display || preloader.style.display !== "none") {
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
    }
    window.setTimeout(cleanup, 350);
  }

  if (!window.gsap) {
    cleanup();
    return;
  }

  var canScrollTrigger = !!window.ScrollTrigger;
  if (canScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      canScrollTrigger = false;
    }
  }

  /* Safety net: the site must never stay hidden behind the preloader. */
  window.setTimeout(function () {
    if (preloader && preloader.parentNode) forceReveal();
  }, 5000);

  var heroRevealed = false;

  function splitHeroWords() {
    var h1 = document.querySelector(".hero h1");
    if (!h1) return;
    var walker = document.createTreeWalker(
      h1,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          var wrap = document.createElement("span");
          wrap.className = "hw";
          var inner = document.createElement("span");
          inner.className = "hwi";
          inner.textContent = part;
          wrap.appendChild(inner);
          frag.appendChild(wrap);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });

    h1.querySelectorAll(".hwi").forEach(function (inner) {
      if (inner.closest(".gradient-text")) {
        inner.classList.add("hwi-grad");
      }
    });
  }

  function heroReveal() {
    if (heroRevealed) return;
    heroRevealed = true;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".site-header", { y: -24, opacity: 0, duration: 0.6 })
      .from(".eyebrow", { y: 24, opacity: 0, duration: 0.7 }, "-=.35")
      .from(
        ".hero h1 .hwi",
        { yPercent: 120, duration: 0.9, stagger: 0.045 },
        "-=.45"
      )
      .from(".hero-sub", { y: 24, opacity: 0, duration: 0.7 }, "-=.55")
      .from(
        ".hero-actions .btn",
        { y: 18, opacity: 0, stagger: 0.08, duration: 0.5 },
        "-=.5"
      )
      .from(
        ".hero-tech",
        { y: 46, opacity: 0, scale: 0.95, duration: 0.9 },
        "-=.7"
      );
  }

  function runPreloader() {
    if (reducedMotion) {
      if (preloader) preloader.style.display = "none";
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    var obj = { v: 0 };

    gsap.to(obj, {
      v: 100,
      duration: 1.7,
      ease: "power2.inOut",
      onUpdate: function () {
        var n = Math.round(obj.v);
        if (countEl) countEl.textContent = n;
        if (fillEl) fillEl.style.width = n + "%";
      },
      onComplete: function () {
        gsap
          .timeline({ onComplete: cleanup })
          .to(".preloader-inner", {
            yPercent: -40,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in"
          })
          .to(preloader, { yPercent: 100, duration: 0.85, ease: "power4.inOut" }, "-=.1");
        heroReveal();
      }
    });
  }

  function setupScrollReveals() {
    gsap.utils.toArray(".section").forEach(function (section) {
      var head = section.querySelector(".section-head");
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 76%"
        }
      });

      if (head) {
        tl.from(head, { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
      }

      if (section.id === "playground") {
        var pg = section.querySelector(".playground");
        if (pg) {
          tl.from(pg, { y: 44, opacity: 0, duration: 0.9, ease: "power3.out" }, "-=.4");
        }
        return;
      }

      var cards = section.querySelectorAll(".card, .stat");
      if (cards.length) {
        tl.from(cards, { y: 40, opacity: 0, stagger: 0.09, duration: 0.7, ease: "power3.out" }, "-=.4");
      } else if (section.children.length) {
        tl.from(section.children, { y: 36, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" }, "-=.3");
      }
    });
  }

  function setupParallax() {
    var hero = document.querySelector(".hero");
    if (!hero) return;

    gsap.to(".hero-scene", {
      yPercent: 28,
      scale: 1.12,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".hero-inner", {
      yPercent: -12,
      opacity: 0.25,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  }

  function setupNavHighlight() {
    var links = document.querySelectorAll(".nav-links a[href^='#']");
    if (!links.length) return;

    links.forEach(function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: function (self) {
          if (self.isActive) {
            links.forEach(function (l) {
              l.classList.toggle("active", l === link);
            });
          }
        }
      });
    });
  }

  function setupCursor() {
    var dot = document.getElementById("cursor-dot");
    var ring = document.getElementById("cursor-ring");
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !finePointer || !dot || !ring) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    var dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
    var dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
    var ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3.out" });
    var ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3.out" });

    document.addEventListener("mousemove", function (e) {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    });

    var targets = document.querySelectorAll("a, button, input, textarea, select, label, .editor-tab");
    targets.forEach(function (t) {
      t.addEventListener("mouseenter", function () {
        document.body.classList.add("cursor-hover");
      });
      t.addEventListener("mouseleave", function () {
        document.body.classList.remove("cursor-hover");
      });
    });
  }

  function setupTestimonials() {
    var quotes = document.querySelectorAll(".quote");
    var dots = document.querySelectorAll(".q-dot");
    if (!quotes.length || reducedMotion) return;

    var idx = 0;
    var timer = null;

    function show(n) {
      if (n === idx) return;
      gsap.to(quotes[idx], {
        opacity: 0,
        y: -16,
        duration: 0.45,
        ease: "power2.in",
        onComplete: function () {
          quotes[idx].style.visibility = "hidden";
        }
      });
      idx = n;
      quotes[idx].style.visibility = "visible";
      gsap.fromTo(
        quotes[idx],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
      dots.forEach(function (d, i) {
        d.classList.toggle("q-dot-active", i === idx);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show((idx + 1) % quotes.length);
      }, 4500);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    play();
  }

  function setupTilt() {
    var cards = document.querySelectorAll(".work-card");
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!cards.length || reducedMotion || !finePointer) return;

    cards.forEach(function (card) {
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power3.out" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power3.out" });

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 9);
        rx(-py * 9);
      });

      card.addEventListener("mouseleave", function () {
        rx(0);
        ry(0);
      });
    });
  }

  function setupBackTop() {
    var btn = document.getElementById("back-top");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  function setupScrollProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    var setter = gsap.quickSetter(bar, "scaleX");
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      setter(max > 0 ? window.scrollY / max : 0);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  function setupSpotlight() {
    var cards = document.querySelectorAll(".card");
    if (!cards.length) return;
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  function setupMagnetic() {
    var els = document.querySelectorAll(".magnetic");
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!els.length || reducedMotion || !finePointer) return;

    els.forEach(function (el) {
      var x = gsap.quickTo(el, "x", { duration: 0.3, ease: "power3.out" });
      var y = gsap.quickTo(el, "y", { duration: 0.3, ease: "power3.out" });

      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.3);
      });

      el.addEventListener("mouseleave", function () {
        x(0);
        y(0);
      });
    });
  }

  splitHeroWords();

  if (!reducedMotion) {
    try {
      setupCursor();
    } catch (e) {}
    if (canScrollTrigger) {
      try {
        setupScrollReveals();
        setupParallax();
        setupNavHighlight();
      } catch (e) {}
    }
    try {
      setupTestimonials();
      setupTilt();
      setupScrollProgress();
      setupSpotlight();
      setupMagnetic();
    } catch (e) {}
  } else {
    try {
      setupScrollProgress();
    } catch (e) {}
  }

  setupBackTop();

  runPreloader();

  if (canScrollTrigger) {
    window.addEventListener("load", function () {
      try {
        ScrollTrigger.refresh();
      } catch (e) {}
    });
  }
})();
