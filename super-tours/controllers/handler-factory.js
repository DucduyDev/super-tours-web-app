const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/AppError");

exports.deleteOne = (model) =>
  catchAsync(async (req, res, next) => {
    const document = await model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError(404, "No document found with that ID"));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(404, "No document found with that ID");
    }

    res.status(200).json({
      status: "success",
      data: {
        data: document,
      },
    });
  });

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    const document = await model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: document,
      },
    });
  });

exports.getOne = (model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = model.findById(req.params.id);

    if (populateOptions) query = query.populate(populateOptions);

    const document = await query;

    if (!document) {
      return next(new AppError(404, "No document found with that ID"));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: document,
      },
    });
  });
