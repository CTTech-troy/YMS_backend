export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.originalUrl
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Reduce payload size or increase server limit.'
    });
  }

  const status = err.status || err.statusCode || 500;
  console.error(err.stack || err);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
  });
}
