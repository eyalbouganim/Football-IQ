const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

const register = async (req, res, next) => {
    try {
        const { username, email, password, favoriteTeam } = req.body;

        // Check if user already exists
        let existingUser = await User.findByUsername(username.toLowerCase());
        if (existingUser) {
            return next(new AppError('Username already exists', 400));
        }
        existingUser = await User.findByEmail(email.toLowerCase());
        if (existingUser) {
            return next(new AppError('Email already exists', 400));
        }

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            favoriteTeam
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Find user by username or email
        let user = await User.findByUsername(username.toLowerCase());
        if (!user) {
            user = await User.findByEmail(username.toLowerCase());
        }

        if (!user) {
            return next(new AppError('Invalid credentials', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Account is deactivated', 401));
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return next(new AppError('Invalid credentials', 401));
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { favoriteTeam, email } = req.body;
        const user = req.user;
        const updateData = {};

        if (email && email.toLowerCase() !== user.email) {
            const existingEmail = await User.findByEmail(email.toLowerCase());
            if (existingEmail) {
                return next(new AppError('Email already in use', 400));
            }
            updateData.email = email.toLowerCase();
        }

        if (favoriteTeam !== undefined) {
            updateData.favoriteTeam = favoriteTeam;
        }

        const updatedUser = await User.update(user.id, updateData);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return next(new AppError('Current password is incorrect', 400));
        }

        if (newPassword.length < 8) {
            return next(new AppError('New password must be at least 8 characters', 400));
        }

        await User.update(user.id, { password: newPassword });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
