(function () {
  "use strict";

  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
      });
    });
  }

  var header = document.querySelector(".site-header");
  if (header) {
    header.addEventListener("mouseenter", function () {
      header.style.background = "rgba(11, 13, 18, 0.95)";
    });
    header.addEventListener("mouseleave", function () {
      header.style.background = "rgba(11, 13, 18, 0.85)";
    });
  }

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

  var toast = document.getElementById("cart-toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    if (message) toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 2200);
  }

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

  var form = document.getElementById("contact-form");
  var formStatus = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

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

      if (formStatus) {
        formStatus.textContent = "Thanks! Your message has been sent.";
        formStatus.className = "form-status success";
      }
      form.reset();
    });

    form.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        field.classList.remove("invalid");
      });
    });
  }

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
