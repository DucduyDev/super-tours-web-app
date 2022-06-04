/* eslint-disabled */

export const hideAlert = () => {
  const element = document.querySelector(".alert");
  if (element) {
    element.remove();
  }
};

// type: success or error
export const showAlert = (type, message) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.body.insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, 5000);
};
