const fs = require("fs");
const mongoose = require("mongoose");

const dotenv = require("dotenv");

const Tour = require("../../models/tour-model");
const User = require("../../models/user-model");
const Review = require("../../models/review-model");

dotenv.config({ path: "./config.env" });

const connectionString = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch(() => console.log("Couldn't connect to MongoDB"));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);
const importData = async () => {
  try {
    await Tour.create(tours); // [{}, {}]
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data loaded!");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data deleted!");
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
