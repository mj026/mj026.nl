import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import shell from "highlight.js/lib/languages/shell";

hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", shell);

import "highlight.js/styles/github-dark.css";
export const applyHighlight = () => hljs.highlightAll();

document.addEventListener("DOMContentLoaded", () => {
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
      document.documentElement.dataset.theme =
        currentTheme === "dark" ? "light" : "dark";
    };
  }

  hljs.highlightAll();
});
