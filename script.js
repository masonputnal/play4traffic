// --------------------------------------------------
// PLAY4TRAFFIC — GLOBAL UI SCRIPT
// Dark mode toggle + neon hover pulse + scroll lift
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initNeonHover();
  initScrollLift();
});

/* --------------------------------------------------
   DARK MODE TOGGLE
   (Matches .dark-mode styles in your stylesheet)
   Source reference: “.dark-mode { background: #000; color: #e6f7ff; }”
-------------------------------------------------- */
function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  const body = document.body;

  // Load saved preference
  const saved = localStorage.getItem("p4t-theme");
  if (saved === "dark") body.classList.add("dark-mode");
  if (saved === "light") body.classList.remove("dark-mode");

  if (!toggle) return;

  updateToggleLabel(toggle, body.classList.contains("dark-mode"));

  toggle.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("p4t-theme", isDark ? "dark" : "light");
    updateToggleLabel(toggle, isDark);
  });
}

function updateToggleLabel(btn, isDark) {
  btn.textContent = isDark ? "Light Mode" : "Dark Mode";
}

/* --------------------------------------------------
   NEON HOVER PULSE
   Adds .neon-hover class to interactive elements
   Source reference: “.neon-hover:hover { transform: translateY(-2px); … }”
-------------------------------------------------- */
function initNeonHover() {
  const selectors = [
    ".btn",
    ".btn.primary",
    ".btn-buy-credits",
    ".btn-stripe",
    ".neon-logout-btn",
    ".package-card",
    ".dashboard-card",
    ".card",
    ".auth-container"
  ];

  const elements = document.querySelectorAll(selectors.join(","));
  elements.forEach(el => el.classList.add("neon-hover"));
}

/* --------------------------------------------------
   SCROLL LIFT ANIMATION
   Elements gently rise when entering viewport
   Source reference: “.lift-init { opacity: 0; transform: translateY(10px); }”
-------------------------------------------------- */
function initScrollLift() {
  const targets = document.querySelectorAll(
    ".card, .dashboard-card, .package-card, .auth-container, .surf-card"
  );

  if (!("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("lift-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("lift-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach(el => {
    el.classList.add("lift-init");
    observer.observe(el);
  });
}
