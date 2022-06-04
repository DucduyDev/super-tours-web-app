module.exports = (asyncFn) =>
  function (req, res, next) {
    asyncFn(req, res, next).catch((err) => {
      next(err);
    });
  };
