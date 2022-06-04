const { promisify } = require("util");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");

const User = require("../models/user-model");
const AppError = require("../utils/AppError");
const Email = require("../utils/email");
const catchAsync = require("../utils/catch-async");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // Client will delete the cookie after it has expired
    httpOnly: true, // The cookie cannot be accessed of modified (XSS)
    sameSite: "none",
    secure: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true; // The cookie will only be sent on an encrypted connection (HTTPS)
  }

  res.cookie("jwt", token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// sign up
exports.signup = catchAsync(async (req, res, next) => {
  // 1. Get user's info from request
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  const email = new Email(user, url);
  await email.sendWelcome();
  // 2. Send token (log in)
  sendToken(user, 201, res);
});

// log in
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError(400, "Please provide email and password!"));
  }

  // 2. Check if user exists and password is correct
  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError(401, "Incorrect email or password"));
  }

  // 3. If everything is ok, send token (JWT) back to the client
  sendToken(user, 200, res);
});

// log out
exports.logout = (req, res) => {
  res.cookie("jwt", "logged out", {
    expires: new Date(Date.now() + 10 * 1000),
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({
    status: "success",
  });
};

// Check there is a logged in user
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.isPasswordChanged(decodedPayload.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Authentication
exports.protectRoute = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(401, "You are not logged in! Please log in and try again")
    );
  }

  // 2. Verification token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if user still exists
  const user = await User.findById(decodedPayload.id);
  if (!user) {
    return next(new AppError(401, "The user does not exists!"));
  }

  // 4. Check if user changed password after the token was issued
  const isChanged = user.isPasswordChanged(decodedPayload.iat);

  if (isChanged) {
    return next(
      new AppError(
        401,
        "User has recently changed password, please log in again"
      )
    );
  }
  req.user = user;
  res.locals.user = user;

  next();
});

// Authorization
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You do not have permission to perform this action!")
      );
    }
    next();
  };
};

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError(404, "There is no user with that email address"));

  // 2. Generate the random reset token
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it back to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;

  try {
    const email = new Email(user, resetURL);
    await email.sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(500, "There was an error sending the mail"));
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2. If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError(400, "Token is invalid or has expired"));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property
  // document middleware

  // 4. Log the user in, send JWT
  sendToken(user, 200, res);
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  /* Why don't use findByIdAndUpdate()
      - Validation and PRE SAVE middleware is not going to work (ONLY save and CREATE)
  */

  // 2. Check if POSTed current password is correct
  if (!(await user.checkPassword(req.body.currentPassword, user.password)))
    return next(
      new AppError(400, "Password is not correct, please try again!")
    );

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4. Log user in, send JWT
  sendToken(user, 200, res);
});
