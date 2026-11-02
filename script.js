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

// ===== Terminal typing effect (hero) =====
const term = document.getElementById("terminal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Edit these lines to match you
const script = [
  { cmd: "whoami", out: "Imad Khoba" },
  { cmd: "cat role.txt", out: "Full-Stack Developer" },
  { cmd: "cat location.txt", out: "Casablanca, Morocco" },
  { cmd: "ls stack/", out: "html  css  javascript  react  firebase" },
  { cmd: "echo $STATUS", out: "available for freelance projects" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTerminal() {
  let html = "";
  const cursor = '<span class="cursor"></span>';

  for (const { cmd, out } of script) {
    const prefix = html + '<span class="prompt">$ </span>';
    if (reduceMotion) {
      html = prefix + esc(cmd) + "\n" + '<span class="out">' + esc(out) + "</span>\n";
      term.innerHTML = html;
      continue;
    }
    for (let i = 1; i <= cmd.length; i++) {
      term.innerHTML = prefix + esc(cmd.slice(0, i)) + cursor;
      await sleep(55 + Math.random() * 45);
    }
    await sleep(250);
    html = prefix + esc(cmd) + "\n" + '<span class="out">' + esc(out) + "</span>\n";
    term.innerHTML = html + cursor;
    await sleep(450);
  }
  term.innerHTML = html + '<span class="prompt">$ </span>' + cursor;
}
runTerminal();

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
