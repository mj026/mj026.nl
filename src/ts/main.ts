const dateSpan = document.querySelector<HTMLElement>("#date");

if (dateSpan !== null) {
  dateSpan.innerText = new Date().getFullYear().toString();
}

if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
  document.documentElement.dataset.theme = "dark";
} else {
  document.documentElement.dataset.theme = "light";
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    // Change to dark / light when the OS UI changes to dark / ligh
    document.documentElement.dataset.theme = event.matches ? "dark" : "light";
  });

const toggleThemeButton = document.querySelector<HTMLElement>(".btn-dark-mode");

if (toggleThemeButton !== null) {
  toggleThemeButton.onclick = () => {
    const currentTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = currentTheme === "dark" ? "light" : "dark";
  };
}
