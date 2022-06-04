const multer = require("multer");
const sharp = require("sharp");

const AppError = require("../utils/AppError");
const User = require("../models/user-model");
const catchAsync = require("../utils/catch-async");
const factory = require("./handler-factory");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },

//   filename: (req, file, cb) => {
//     // user-userId-currentTimestamp.extension
//     const extension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();

// test if the uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError(400, "File is not an image! Please upload only images."),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPhoto = upload.single("photo");

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // When we decide to save the image into memory, the filename will not get set
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObject = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(400, "Not allowed to update password!"));
  }

  // const user = await User.findById(req.user._id);
  // await user.save();

  // 2. Filtered out unwanted fields that are not allowed to be updated
  const filteredBody = filterObject(req.body, "name", "email");

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 3. Update user document
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined! Please use /signup instead",
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do NOT update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
