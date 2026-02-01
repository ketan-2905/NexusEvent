// Express Error Handling Utility

/**
 * Wraps an async function to catch errors and pass them to Express error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function that catches errors
 */
export const wrapAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom Error Class for Express
 */
export class ExpressError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ExpressError";
  }
}

/**
 * Error handler middleware
 * Handles errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("❌ Error:", err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Prisma errors
  if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate entry. This record already exists.";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }

  // Check if request expects JSON (API requests)
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }

  // For non-API requests, try redirect — but prevent infinite loops
  // if (req.originalUrl.startsWith("/error")) {
  //   // If already on /error, don't redirect again — just respond compactly
  //   return res.status(statusCode).json({
  //     success: false,
  //     error: { message, statusCode },
  //   });
  // }

  // // Safe redirect for normal cases
  // const errorPageUrl = `/error?status=${statusCode}&message=${encodeURIComponent(message)}`;
  // res.redirect(errorPageUrl);

  return res.status(statusCode).json({
    success: false,
    error: { message, statusCode },
  });
};

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ExpressError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
