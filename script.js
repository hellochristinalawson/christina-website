const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");

// Mobile menu
const setMenu = (open) => {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
document.querySelectorAll(".nav__links a").forEach((link) =>
  link.addEventListener("click", () => setMenu(false))
);
document.addEventListener("click", (e) => {
  if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    toggle.focus();
  }
});

// Nav border once the page scrolls
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mark the menu link for the section currently in view
const sectionLinks = [...document.querySelectorAll('.nav__links a[href^="#"]')];
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  // Every section, so links clear while passing a section that has no menu entry
  document.querySelectorAll("main section").forEach((section) => spy.observe(section));
}

// Who I work with: the pill titles become tabs; the chosen pill opens as a panel beneath them
const pills = document.querySelector(".pills");
if (pills) {
  const panels = [...pills.querySelectorAll(".pill")];
  const tablist = document.createElement("div");
  tablist.className = "who__tabs";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Who I work with");

  const tabs = panels.map((panel, n) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "who__tab";
    tab.id = "who-tab-" + n;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "who-panel-" + n);
    const icon = panel.querySelector(".pill__icon").cloneNode(true);
    icon.removeAttribute("class");
    tab.append(icon, panel.querySelector("h3").textContent);
    panel.id = "who-panel-" + n;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    tablist.append(tab);
    return tab;
  });

  const select = (index, focus) => {
    tabs.forEach((tab, n) => {
      const on = n === index;
      tab.setAttribute("aria-selected", on);
      tab.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
    });
    // Point the panel's caret at the middle of the chosen tab
    const tab = tabs[index].getBoundingClientRect();
    const panel = panels[index].getBoundingClientRect();
    panels[index].style.setProperty("--caret-x", tab.left + tab.width / 2 - panel.left + "px");
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, n) => tab.addEventListener("click", () => select(n)));
  tablist.addEventListener("keydown", (e) => {
    const current = tabs.indexOf(document.activeElement);
    const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select((keys[e.key] + tabs.length) % tabs.length, true);
  });

  pills.before(tablist);
  pills.classList.add("is-enhanced");
  document.querySelector(".who__hint").hidden = false;
  select(0);
  window.addEventListener("resize", () => select(tabs.findIndex((t) => t.tabIndex === 0)));
}

// PRISM: tiles become a picker; the chosen step's description shows in one panel
const prism = document.querySelector("[data-prism]");
if (prism) {
  const tiles = [...prism.querySelectorAll(".prism__tile")];
  const detail = prism.querySelector(".prism__detail");
  const show = (tile) => {
    tiles.forEach((t) => t.setAttribute("aria-pressed", t === tile));
    detail.innerHTML = "";
    const word = document.createElement("strong");
    word.textContent = tile.querySelector("strong").textContent;
    detail.append(word, " ", tile.querySelector(".prism__desc").textContent);
    detail.classList.remove("is-changing");
    void detail.offsetWidth; // restart the fade
    detail.classList.add("is-changing");
  };
  tiles.forEach((tile) => {
    // The letter is aria-hidden and the word is hidden on phones, so name the button outright
    tile.setAttribute("aria-label", tile.querySelector("strong").textContent);
    tile.addEventListener("click", () => show(tile));
  });
  prism.classList.add("is-enhanced");
  detail.hidden = false;
  show(tiles[0]);
}

// Human Design: centres light up once on arrival, then on tap
const bodygraph = document.querySelector(".bodygraph");
if (bodygraph) {
  bodygraph.querySelectorAll(".bodygraph__centre").forEach((centre) =>
    centre.addEventListener("click", () => centre.classList.toggle("is-on"))
  );
  if ("IntersectionObserver" in window) {
    const wake = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        bodygraph.classList.add("is-awake");
        wake.disconnect();
      },
      { threshold: 0.5 }
    );
    wake.observe(bodygraph);
  }
}

// Pricing cards: while side by side, give each part the same height in every card so the text lines up.
// Cards still size on their own, so opening "What you'll receive" only grows that card.
const plans = document.querySelector(".plans");
if (plans) {
  const cards = [...plans.querySelectorAll(".plan")];
  const parts = ["h3", ".plan__pricing", ".plan__meta", ".plan__desc"];
  const sideBySide = window.matchMedia("(min-width: 961px)");
  const level = () => {
    parts.forEach((part) => {
      const els = cards.map((card) => card.querySelector(part));
      els.forEach((el) => (el.style.minHeight = ""));
      if (!sideBySide.matches) return;
      const tallest = Math.max(...els.map((el) => el.getBoundingClientRect().height));
      els.forEach((el) => (el.style.minHeight = tallest + "px"));
    });
  };
  level();
  document.fonts.ready.then(level);
  sideBySide.addEventListener("change", level);
  window.addEventListener("resize", level);
}

document.getElementById("year").textContent = new Date().getFullYear();
