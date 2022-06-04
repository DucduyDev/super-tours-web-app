const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

// My modules
const AppError = require("./utils/AppError");

const errorHandler = require("./controllers/errors-controller");

const tourRouter = require("./routes/tour-routes");

const userRouter = require("./routes/user-routes");

const reviewRouter = require("./routes/review-routes");

const viewRouter = require("./routes/view-routes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARE

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
app.use(helmet());

// Morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request, 100 requests / 1 hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization, to clean all the data that comes into the app from malicious code

// Against NoSQL query injection
app.use(mongoSanitize());

// Against XSS
app.use(xss());

// Prevent HTTP parameter pollution
app.use(
  hpp({
    whitelist: [
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "duration",
      "price",
    ],
  })
);

// Routes
app.use("/", viewRouter);

app.use("/api/v1/tours", tourRouter);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
