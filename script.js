// ===== Mobile menu =====
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector(".nav nav");

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
  toggle.firstElementChild.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.firstElementChild.className = "fa-solid fa-bars";
  }
});

// ===== Active link while scrolling =====
const links = document.querySelectorAll(".nav-links a[href^='#']");
const sections = [...document.querySelectorAll("main section[id]")];

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => spy.observe(s));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Skill bars fill when visible =====
const bars = document.querySelectorAll(".bar div");
const fill = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.level + "%";
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);
bars.forEach((b) => fill.observe(b));

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Binary field that reacts to the mouse =====
(function () {
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("binary");
  const ctx = canvas.getContext("2d");
  const SIZE = 20;      // cell size in px
  const RADIUS = 150;   // mouse influence radius in px
  const mouse = { x: -9999, y: -9999 };
  let w, h, cols, rows, cells, running = false;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = hero.clientWidth;
    h = hero.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = (SIZE - 5) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    cols = Math.ceil(w / SIZE);
    rows = Math.ceil(h / SIZE);
    cells = Array.from({ length: cols * rows }, () => (Math.random() < 0.5 ? "0" : "1"));
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.dataset.theme === "light";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = c * SIZE + SIZE / 2;
        const y = r * SIZE + SIZE / 2;
        const near = Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / RADIUS);

        // digits flip rarely, but flip fast near the cursor
        if (!reduceMotion && Math.random() < 0.002 + near * 0.1) {
          cells[i] = cells[i] === "0" ? "1" : "0";
        }
        ctx.fillStyle = near > 0
          ? (light ? "rgba(188,2,2," : "rgba(255,0,0,") + (0.4 + near * 0.6).toFixed(2) + ")"
          : (light ? "rgba(131,0,0,0.13)" : "rgba(188,2,2,0.2)");
        ctx.fillText(cells[i], x, y);
      }
    }
  }

  function loop() {
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  window.addEventListener("resize", resize);
  // repaint when the theme changes (also covers reduced motion)
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  if (!reduceMotion) {
    // only animate while the hero is on screen
    new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      if (visible && !running) { running = true; loop(); }
      if (!visible) running = false;
    }).observe(hero);
  }
})();

// ===== Pull-cord lamp: switches dark <-> light =====
(function () {
  const root = document.documentElement;
  const stage = document.getElementById("lampStage");
  const svg = document.getElementById("lamp");
  const handle = document.getElementById("cordHandle");
  const line = document.getElementById("cordLine");
  const REST = 364, MAX = 70, TRIGGER = 28;
  let startY = 0, dy = 0, dragging = false;

  const isLight = () => root.dataset.theme === "light";
  const scale = () => svg.getBoundingClientRect().height / 480;
  handle.setAttribute("aria-pressed", isLight());

  function setTheme(light) {
    root.classList.add("theme-fade");
    root.dataset.theme = light ? "light" : "dark";
    handle.setAttribute("aria-pressed", light);
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
    setTimeout(() => root.classList.remove("theme-fade"), 600);
  }

  function pull(y) {
    dy = Math.max(-10, Math.min(MAX, y));
    line.setAttribute("y2", REST + dy);
    handle.setAttribute("transform", "translate(0 " + dy + ")");
  }

  // the cord bounces back like a spring
  function springBack() {
    if (reduceMotion) return pull(0);
    let v = 0;
    (function step() {
      v = (v - dy * 0.2) * 0.8;
      pull(dy + v);
      if (Math.abs(dy) > 0.2 || Math.abs(v) > 0.2) requestAnimationFrame(step); else pull(0);
    })();
  }

  function release(ok) {
    if (!dragging) return;
    dragging = false;
    stage.classList.add("used");
    const tap = dy < 4;
    if (ok && (dy >= TRIGGER || tap)) setTheme(!isLight());
    if (ok && tap) pull(18);
    springBack();
  }

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  handle.addEventListener("pointermove", (e) => { if (dragging) pull((e.clientY - startY) / scale()); });
  handle.addEventListener("pointerup", () => release(true));
  handle.addEventListener("pointercancel", () => release(false));

  handle.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    stage.classList.add("used");
    setTheme(!isLight());
    pull(40);
    springBack();
  });
})();

// ===== About facts: 3D icon carousel (reads the <ul class="facts"> in the HTML) =====
(function () {
  const list = document.querySelector("ul.facts");
  if (!list) return;
  const facts = [...list.querySelectorAll("li")].map((li) => ({
    icon: li.querySelector("i").className,
    label: li.textContent.trim(),
  }));
  if (!facts.length) return;

  const LAYERS = 14, STEP = 2;   // extrusion depth = LAYERS * STEP px
  let index = 0, busy = false;

  const root = document.createElement("div");
  root.className = "fact-carousel";
  root.setAttribute("role", "group");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Quick facts");
  root.innerHTML =
    '<button class="fact-btn" aria-label="Previous fact"><i class="fa-solid fa-chevron-left"></i></button>' +
    '<div class="fact-stage"><div class="fact-card"><div class="icon3d" aria-hidden="true"></div><p class="fact-label" aria-live="polite"></p></div></div>' +
    '<button class="fact-btn" aria-label="Next fact"><i class="fa-solid fa-chevron-right"></i></button>' +
    '<div class="fact-dots"></div>';

  const [prev, next] = root.querySelectorAll(".fact-btn");
  const stage = root.querySelector(".fact-stage");
  const card = root.querySelector(".fact-card");
  const icon3d = root.querySelector(".icon3d");
  const label = root.querySelector(".fact-label");
  const dotsBox = root.querySelector(".fact-dots");

  const dots = facts.map((f, n) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Fact " + (n + 1));
    b.addEventListener("click", () => goTo(n, n > index ? 1 : -1));
    dotsBox.append(b);
    return b;
  });

  // stack copies of the icon along Z to give it thickness
  function render(i) {
    index = i;
    icon3d.replaceChildren(...Array.from({ length: LAYERS }, (_, n) => {
      const el = document.createElement("i");
      el.className = facts[i].icon + (n === LAYERS - 1 ? " front" : "");
      el.style.setProperty("--z", (n - (LAYERS - 1) / 2) * STEP + "px");
      el.style.setProperty("--t", (n / (LAYERS - 1)).toFixed(3));
      return el;
    }));
    label.textContent = facts[i].label;
    dots.forEach((d, n) => d.setAttribute("aria-current", String(n === i)));
  }

  // flip the card like a coin: turn edge-on, swap, turn back
  function goTo(n, dir) {
    n = (n + facts.length) % facts.length;
    if (busy || n === index) return;
    if (reduceMotion) { render(n); return; }
    busy = true;
    card.animate(
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(" + -90 * dir + "deg)" }],
      { duration: 240, easing: "ease-in", fill: "forwards" }
    ).finished.then(() => {
      render(n);
      return card.animate(
        [{ transform: "rotateY(" + 90 * dir + "deg)" }, { transform: "rotateY(0deg)" }],
        { duration: 300, easing: "ease-out", fill: "forwards" }
      ).finished;
    }).then(() => {
      card.getAnimations().forEach((a) => a.cancel());
      busy = false;
    });
  }

  prev.addEventListener("click", () => goTo(index - 1, -1));
  next.addEventListener("click", () => goTo(index + 1, 1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(index - 1, -1);
    if (e.key === "ArrowRight") goTo(index + 1, 1);
  });

  // swipe / drag sideways on the icon
  let sx = null;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  stage.addEventListener("pointercancel", () => { sx = null; });
  stage.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  render(0);
  list.replaceWith(root);
})();

// ===== About text: written like someone is typing =====
(function () {
  if (reduceMotion) return;
  const target = document.querySelector(".about-text");
  const paras = target ? [...target.querySelectorAll("p")] : [];
  if (!paras.length) return;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const caret = document.createElement("span");
  caret.className = "type-caret";
  caret.setAttribute("aria-hidden", "true");

  // each letter gets its own span (hidden, but it keeps its space so nothing jumps);
  // a hidden copy of the full text stays available for screen readers
  const lines = paras.map((p) => {
    const text = p.textContent.trim();
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    const chars = [...text].map((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      vis.append(s);
      return s;
    });
    p.replaceChildren(sr, vis);
    return chars;
  });
  lines[0][0].before(caret);

  // start when the About section scrolls into view
  new IntersectionObserver(async ([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();
    for (const chars of lines) {
      for (const s of chars) {
        s.classList.add("on");
        s.after(caret);
        const c = s.textContent;
        await wait((c === "." ? 260 : c === "," ? 110 : 0) + 9 + Math.random() * 15);
      }
      await wait(250);
    }
    setTimeout(() => caret.remove(), 2500);
  }, { threshold: 0.25 }).observe(target);
})();
