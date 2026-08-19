const notFound = (req, res, next) => {
  res.status(404).json({ detail: `Not Found - ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    detail: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFound,
  errorHandler
};
