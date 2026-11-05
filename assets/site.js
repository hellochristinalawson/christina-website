document.documentElement.classList.add("js");

// Mobile menu
const nav = document.querySelector(".nav");
const menuBtn = document.querySelector(".menu-btn");
if (menuBtn) {
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.textContent = open ? "Close" : "Menu";
  };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  });
}

// Header line once the page scrolls
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Fade things up as they arrive; the home diagram turns into place the same way
const arrivals = document.querySelectorAll(".reveal, .venn");
if ("IntersectionObserver" in window) {
  const seen = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      seen.unobserve(entry.target);
    }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  arrivals.forEach((el) => seen.observe(el));
} else {
  arrivals.forEach((el) => el.classList.add("is-in"));
}

// Home: once the stickers have landed, turn them into a checklist (straight away with reduced motion)
const pc = document.querySelector(".pc");
if (pc) {
  const done = () => pc.classList.add("is-done");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
  else setTimeout(done, 3000);
}

// Pick-one groups: one button pressed at a time
const pickOne = (buttons, show) => {
  const choose = (chosen) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", b === chosen));
    show(chosen);
  };
  buttons.forEach((b) => b.addEventListener("click", () => choose(b)));
  choose(buttons[0]);
};

// Insights: filter the cards by topic
const filters = document.querySelector(".filters");
if (filters) {
  const posts = [...document.querySelectorAll(".post")];
  pickOne([...filters.querySelectorAll("button")], (b) => {
    posts.forEach((p) => (p.hidden = b.dataset.topic !== "all" && p.dataset.topic !== b.dataset.topic));
  });
}

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
