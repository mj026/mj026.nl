const toast = (message: string) => {
  const element = document.createElement("div");
  element.id = "element";
  element.innerText = message;
  element.classList.add("toast");

  document.body.appendChild(element);

  // Fade-in
  setTimeout(() => {
    element.classList.toggle("opacity-100");
  }, 10);

  //Fade-out
  setTimeout(() => {
    element.classList.toggle("opacity-100");
  }, 2000);

  // // Delete element
  setTimeout(() => {
    document.body.removeChild(element);
  }, 3000);
};

export default toast;
