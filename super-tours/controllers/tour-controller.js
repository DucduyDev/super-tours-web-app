const multer = require("multer");
const sharp = require("sharp");

const Tour = require("../models/tour-model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catch-async");
const factory = require("./handler-factory");

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

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // Cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  req.body.imageCover = imageCoverFilename;

  // Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (image, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// upload.single("image");
// upload.array("images", 5);

// exports.checkID = (req, res, next, value) => {
//   console.log(`Tour id is: ${value}`);
//   if (+req.params.id >= tours.length) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid ID",
//     });
//   }
//   next();
// };

exports.aliasTop5 = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  next();
};

// Get all tours
exports.getAllTours = factory.getAll(Tour);

// Get a tour by ID
// const tour = await Tour.findOne({ _id: req.params.id });
exports.getTour = factory.getOne(Tour, { path: "reviews" });

// Create a tour
// const tour = new Tour(req.body);
// tour.save();
exports.createTour = factory.createOne(Tour);

// Update a tour
exports.updateTour = factory.updateOne(Tour);

// Delete a tour
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(year, 1, 1),
          $lte: new Date(year, 12, 31),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTours: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 }, // 1: show - 0: hide
    },
    {
      $sort: { numTours: -1 }, // 1: ascending - -1: descending
    },
    // {
    //   $limit: 6,
    // },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, coords, unit } = req.params;
  const [lat, lng] = coords.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError(400, "Please provide latitude and longitude"));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { coords, unit } = req.params;
  const [lat, lng] = coords.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError(400, "Please provide latitude and longitude"));
  }

  const distances = await Tour.aggregate([
    {
      // requires at least one field contains geospatial index, 1 filed => automatically uses it
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [+lng, +lat],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
