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
    var
