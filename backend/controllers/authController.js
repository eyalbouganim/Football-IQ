const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Helper function to generate a JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

const register = async (req, res, next) => {
    try {
        const { username, email, password, favoriteTeam } = req.body;

        // Check if username already exists
        let existingUser = await User.findByUsername(username.toLowerCase());
        if (existingUser) {
            return next(new AppError('Username already exists', 400));
        }
        existingUser = await User.findByEmail(email.toLowerCase());
        // Check if email already exists
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

        // Generate a JWT token for the newly registered user
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
        // Allow login with either username or email
        let user = await User.findByUsername(username.toLowerCase());
        if (!user) {
            user = await User.findByEmail(username.toLowerCase());
        }

        if (!user) {
            return next(new AppError('Invalid credentials', 401));
        }
        // Check if the user account is active

        if (!user.isActive) {
            return next(new AppError('Account is deactivated', 401));
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return next(new AppError('Invalid credentials', 401));
        }
        // Generate a JWT token upon successful login

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
            // The user object is already attached to req.user by the auth middleware
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
        // Prepare an object to hold update data
        const updateData = {};

        // If email is provided and different from current, check for uniqueness
        if (email && email.toLowerCase() !== user.email) {
            const existingEmail = await User.findByEmail(email.toLowerCase());
            if (existingEmail && existingEmail.id !== user.id) { // Ensure it's not the current user's email
                return next(new AppError('Email already in use', 400));
            }
            updateData.email = email.toLowerCase();
        }

        if (favoriteTeam !== undefined) {
            updateData.favoriteTeam = favoriteTeam;
        }
        // Update the user's profile in the database

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

        // Validate the current password before allowing a change
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return next(new AppError('Current password is incorrect', 400));
        }
        // Enforce a minimum length for the new password

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
