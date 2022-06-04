/* eslint-disable */

import axios from "axios";

import { hideAlert, showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: "POST",
      url: "http://127.0.0.1:3000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    if (result.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const signUp = async (name, email, password, passwordConfirm) => {
  if (name === "") {
    return showAlert("error", "Name must not be empty!");
  }

  try {
    const result = await axios({
      method: "POST",
      url: "http://127.0.0.1:3000/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    if (result.data.status === "success") {
      showAlert("success", "Your account created successfully!");

      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    console.log(err.response);
    const errorMessage =
      err.response.data.error.code === 11000
        ? "This email has already used!"
        : err.response.data.message;

    showAlert("error", errorMessage);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://127.0.0.1:3000/api/v1/users/logout",
    });
    if (res.data.status === "success") {
      location.reload(true); // force a reload from the server and not from browser cache => otherwise it might simply load the same page from the cache => want a fresh page coming from the server
    }
  } catch (err) {
    showAlert("error", "Error logging out! Try again.");
  }
};
