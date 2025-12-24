const config = require('../config');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.env === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    // Production error response
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    // Programming or unknown errors
    console.error('ERROR:', err);
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong!'
    });
};

const notFound = (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
};

// Handle specific error types
const handleSequelizeValidationError = (err) => {
    const errors = err.errors.map(e => e.message);
    return new AppError(`Validation error: ${errors.join('. ')}`, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
    const field = err.errors[0]?.path || 'field';
    return new AppError(`${field} already exists.`, 400);
};

const globalErrorHandler = (err, req, res, next) => {
    // Handle Sequelize errors
    if (err.name === 'SequelizeValidationError') {
        err = handleSequelizeValidationError(err);
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
        err = handleSequelizeUniqueConstraintError(err);
    }

    errorHandler(err, req, res, next);
};

module.exports = { AppError, globalErrorHandler, notFound };



