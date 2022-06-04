/* eslint-disable */

import axios from "axios";
import { showAlert } from "./alerts";

// type is either: password or data
export const updateUser = async (data, type) => {
  try {
    const endpoint = type === "password" ? "update-password" : "update-me";

    const res = await axios({
      method: "PATCH",
      url: `http://127.0.0.1:3000/api/v1/users/${endpoint}`,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
