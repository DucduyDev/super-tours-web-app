/* eslint-disable */

import "@babel/polyfill";
import { displayMap } from "./map-box";
import { login, signUp, logout } from "./login";
import { updateUser } from "./update-user";

const mapElement = document.getElementById("map");

const loginForm = document.querySelector(".form--login");
const signUpForm = document.querySelector(".form--signUp");

const userDataForm = document.querySelector(".form-user-data");
const btnData = document.getElementById("btn--data");

const userPasswordForm = document.querySelector(".form-user-password");
const btnPassword = document.getElementById("btn--password");

const logoutBtn = document.querySelector(".nav__el--logout");

if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations);
  displayMap(locations);
}

// Login
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    login(email, password);
  });
}

// Sign up
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    signUp(name, email, password, passwordConfirm);
  });
}

// Log out
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Update user's email, name
if (userDataForm) {
  userDataForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    btnData.textContent = "Updating ...";

    const form = new FormData();
    
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    await updateUser(form, "data");

    location.reload(true);

    btnData.textContent = "Save settings";
  });
}

// Update user's password
if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    btnPassword.textContent = "Updating ...";

    const currentPassword = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    await updateUser(
      { currentPassword, password, passwordConfirm },
      "password"
    );

    btnPassword.textContent = "Save password";

    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}
