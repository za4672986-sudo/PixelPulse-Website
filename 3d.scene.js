(function () {
  "use strict";

  if (!window.THREE) return;

  var mqMobile = window.matchMedia("(max-width: 640px)");
  var mqTablet = window.matchMedia("(max-width: 1024px)");
  var mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqPointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  var isMobile = mqMobile.matches;
  var isTablet = mqTablet.matches;
  var reduceMotion = mqReduced.matches;
  var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : isTablet ? 1.5 : 2);

  var heroEl = document.getElementById("hero-3d");
  var cardEls = Array.prototype.slice.call(document.querySelectorAll(".service-3d"));

  if (isMobile) cardEls = [];

  var jobs = [];
  var running = !reduceMotion;
  var pageHidden = document.hidden;

  function makeRenderer(container) {
    var renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);
    return renderer;
  }

  function resizeJob(job) {
    var w = job.container.clientWidth || 1;
    var h = job.container.clientHeight || 1;
    job.camera.aspect = w / h;
    job.camera.updateProjectionMatrix();
    job.renderer.setSize(w, h);
  }

  function watchVisibility(job, el) {
    job.visible = true;
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      job.visible = entries[0].isIntersecting;
    }, { rootMargin: "120px" });
    io.observe(el);
  }

  function initHero() {
    if (!heroEl) return;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 9;
    var renderer = makeRenderer(heroEl);

    var group = new THREE.Group();
    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, isMobile ? 0 : 1),
      new THREE.MeshStandardMaterial({
        color: 0x7c5cff,
        metalness: 0.85,
        roughness: 0.22,
        transparent: true,
        opacity: 0.95
      })
    );
    var wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.9, 1),
      new THREE.MeshBasicMaterial({
        color: 0x8f6bff,
        wireframe: true,
        transparent: true,
        opacity: 0.32
      })
    );
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x7c5cff,
        transparent: true,
        opacity: 0.05,
        depthWrite: false
      })
    );
    group.add(core, wire, halo);
    group.position.x = isMobile ? 0 : 1.7;
    scene.add(group);

    var orbCount = isMobile ? 50 : isTablet ? 90 : 160;
    var positions = new Float32Array(orbCount * 3);
    for (var i = 0; i < orbCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    var orbGeo = new THREE.BufferGeometry();
    orbGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var orbs = new THREE.Points(orbGeo, new THREE.PointsMaterial({
      color: 0xa78bff,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    scene.add(orbs);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);
    var pinkLight = new THREE.PointLight(0xff5c8a, 0.9, 20);
    pinkLight.position.set(-5, -3, 3);
    scene.add(pinkLight);

    var mouse = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    if (mqPointer.matches && !reduceMotion) {
      window.addEventListener("mousemove", function (e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      });
    }

    var job = {
      type: "hero",
      container: heroEl,
      scene: scene,
      camera: camera,
      renderer: renderer,
      group: group,
      orbs: orbs,
      mouse: mouse,
      target: target
    };
    jobs.push(job);
    watchVisibility(job, heroEl);
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resizeJob(job); }).observe(heroEl);
    }
    resizeJob(job);
  }

  var SHAPES = {
    icosa: function () { return new THREE.IcosahedronGeometry(1.15, 0); },
    octa: function () { return new THREE.OctahedronGeometry(1.2, 0); },
    torus: function () { return new THREE.TorusGeometry(0.9, 0.34, 10, 22); },
    knot: function () { return new THREE.TorusKnotGeometry(0.7, 0.26, 90, 12); }
  };

  var SPEEDS = {
    icosa: 0.5,
    octa: 0.45,
    torus: 0.6,
    knot: 0.35
  };

  function initCard(el) {
    var shape = el.getAttribute("data-shape") || "icosa";
    var makeGeo = SHAPES[shape] || SHAPES.icosa;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.5;
    var renderer = makeRenderer(el);

    var wire = new THREE.Mesh(makeGeo(), new THREE.MeshBasicMaterial({
      color: 0x9d7bff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    }));
    var solid = new THREE.Mesh(makeGeo(), new THREE.MeshStandardMaterial({
      color: 0x7c5cff,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.28
    }));
    solid.scale.setScalar(0.55);
    scene.add(wire, solid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dirLight = new THREE.DirectionalLight(0xff5c8a, 0.8);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    var job = {
      type: "card",
      container: el,
      scene: scene,
      camera: camera,
      renderer: renderer,
      mesh: wire,
      speed: SPEEDS[shape] || 0.5
    };
    jobs.push(job);
    watchVisibility(job, el);
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resizeJob(job); }).observe(el);
    }
    resizeJob(job);
  }

  function animate() {
    if (running && !pageHidden) {
      var t = Date.now() / 1000;
      for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        if (!job.visible) continue;
        if (job.type === "hero") {
          job.group.rotation.y = t * 0.25;
          job.group.rotation.x = Math.sin(t * 0.4) * 0.12;
          job.group.position.y = Math.sin(t * 0.6) * 0.25;
          job.target.x += (job.mouse.x * 0.35 - job.target.x) * 0.05;
          job.target.y += (-job.mouse.y * 0.25 - job.target.y) * 0.05;
          job.group.rotation.z = job.target.x * 0.4;
          job.group.rotation.x += job.target.y;
          job.orbs.rotation.y = t * 0.05;
          job.orbs.position.y = Math.sin(t * 0.3) * 0.4;
        } else {
          job.mesh.rotation.y = t * job.speed;
          job.mesh.rotation.x = Math.sin(t * job.speed * 0.7) * 0.25;
          job.mesh.position.y = Math.sin(t * 0.8) * 0.12;
        }
        job.renderer.render(job.scene, job.camera);
      }
    }
    requestAnimationFrame(animate);
  }

  initHero();
  cardEls.forEach(initCard);

  document.addEventListener("visibilitychange", function () {
    pageHidden = document.hidden;
  });

  if (reduceMotion) {
    for (var k = 0; k < jobs.length; k++) {
      jobs[k].renderer.render(jobs[k].scene, jobs[k].camera);
    }
    return;
  }

  requestAnimationFrame(animate);
})();
