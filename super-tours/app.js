const express = require("express");
const morgan = require("morgan");

// My modules
const tourRouter = require("./routes/tour-routes");
const userRouter = require("./routes/user-routes");

const app = express();

// Logging
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
