const dateSpan: HTMLElement | null = document.querySelector("#date");

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
    document.documentElement.dataset.theme = event.matches ? "dark" : "light";
  });

const toggleThemeButton: HTMLElement | null = document.querySelector(".btn-dark-mode");

if (toggleThemeButton !== null) {
  toggleThemeButton.onclick = () => {
    const currentTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = currentTheme === "dark" ? "light" : "dark";
    console.log(currentTheme);
  };
}
