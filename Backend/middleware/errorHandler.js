// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log to console for dev
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error.message = field ? `${field} already exists` : 'Duplicate field value';
    error.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(val => val.message);
    error.message = messages.length > 0 ? messages.join(', ') : 'Validation failed';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired. Please log in again';
    error.statusCode = 401;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    error.message = `File upload error: ${err.message}`;
    error.statusCode = 400;
  }

  // MongoDB server errors
  if (err.name === 'MongoServerError') {
    error.message = 'Database operation failed';
    error.statusCode = 500;
  }

  // Sanitize error messages in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = error.statusCode === 500 && !isDevelopment 
    ? 'Server error' 
    : error.message || 'Server error';

  res.status(error.statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;