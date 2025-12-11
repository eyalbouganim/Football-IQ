const { AppError } = require('./errorHandler');

const validateRegistration = (req, res, next) => {
    const { username, email, password, favoriteTeam } = req.body;
    const errors = [];

    // Username validation
    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please provide a valid email address');
    }

    // Password validation
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Favorite team validation (optional but if provided must be reasonable)
    if (favoriteTeam && favoriteTeam.length > 100) {
        errors.push('Favorite team name is too long');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username || username.trim().length === 0) {
        errors.push('Username is required');
    }

    if (!password || password.length === 0) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }

    next();
};

const validateAnswer = (req, res, next) => {
    const { questionId, answer } = req.body;
    const errors = [];

    if (!questionId) {
        errors.push('Question ID is required');
    }

    if (answer === undefined || answer === null || answer.toString().trim() === '') {
        errors.push('Answer is required');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }

    next();
};

module.exports = { validateRegistration, validateLogin, validateAnswer };

