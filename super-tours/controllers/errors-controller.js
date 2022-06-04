const AppError = require("../utils/AppError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate filed value: "${err.keyValue.name}". Please use another value!`;
  return new AppError(400, message);
};

const handleJWTError = () => new AppError(401, "Invalid token!");

const handleJWTExpiredError = () =>
  new AppError(401, "Your token has expired!");

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((error) => error.message);
  const message = `Invalid input data! ${errors.join(". ")}`;
  return new AppError(404, message);
};

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // RENDERED WEBSITE
  console.error("ERROR 🙀", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    // Operational error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    //Programming error or other unknown error
    console.error("ERROR 🙀", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  //RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      message: err.message,
    });

    //Programming error or other unknown error
  }
  console.error("ERROR 🙀", err);
  return res.status(500).render("error", {
    title: "Something went wrong!",
    message: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") {
      err = handleCastErrorDB(err);
    } else if (err.code === 11000) {
      err = handleDuplicateFieldsDB(err);
    } else if (err.name === "ValidationError") {
      err = handleValidationErrorDb(err);
    } else if (err.name === "JsonWebTokenError") {
      err = handleJWTError();
    } else if (err.name === "TokenExpiredError") {
      err = handleJWTExpiredError();
    }
    sendErrorProd(err, req, res);
  }
};
