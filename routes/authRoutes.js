const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise'); // Using promise version
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Apply to all auth routes
router.use(authLimiter);

// Helper function to validate password complexity
function validatePasswordComplexity(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars,
        requirements: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChars
        }
    };
}

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password are required',
            code: 'MISSING_CREDENTIALS'
        });
    }

    // Basic input validation
    if (!validator.isEmail(email.trim())) {
        return res.status(400).json({ 
            error: 'Please enter a valid email address',
            code: 'INVALID_EMAIL'
        });
    }

    try {
        // Check if user exists and get login attempts
        const [users] = await pool.query(
            `SELECT user.*, 
             (SELECT COUNT(*) FROM login_attempts 
              WHERE user_id = user.user_id AND 
              attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)) AS recent_attempts
             FROM user WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const user = users[0];

        // Check if account is locked
        if (user.recent_attempts >= 5) {
            return res.status(429).json({
                error: 'Account temporarily locked due to too many attempts. Please try again later.',
                code: 'ACCOUNT_LOCKED'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) {
            // Record failed attempt
            await pool.query(
                'INSERT INTO login_attempts (user_id, attempt_time, successful) VALUES (?, NOW(), 0)',
                [user.user_id]
            );

            return res.status(401).json({ 
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Clear failed attempts on successful login
        await pool.query(
            'DELETE FROM login_attempts WHERE user_id = ?',
            [user.user_id]
        );

        // Generate token with appropriate expiration
        const expiresIn = rememberMe ? '7d' : '2h';
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                email: user.email,
                role: user.role_id 
            },
            process.env.JWT_SECRET || 'bunbun_secret',
            { expiresIn }
        );

        res.json({
            token,
            user: {
                id: user.user_id,
                fname: user.fname,
                lname: user.lname,
                email: user.email,
                role: user.role_id
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Server error during login',
            code: 'SERVER_ERROR'
        });
    }
});

// SIGN UP
router.post('/signup', async (req, res) => {
    const { fname, lname, email, password } = req.body;

    if (!fname || !email || !password) {
        return res.status(400).json({
            error: 'First name, email, and password are required',
            code: 'MISSING_FIELDS'
        });
    }

    // Validate email
    if (!validator.isEmail(email.trim())) {
        return res.status(400).json({
            error: 'Please enter a valid email address',
            code: 'INVALID_EMAIL'
        });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(password);
    if (!passwordCheck.valid) {
        return res.status(400).json({
            error: 'Password does not meet complexity requirements',
            code: 'WEAK_PASSWORD',
            requirements: passwordCheck.requirements
        });
    }

    try {
        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM user WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Email already registered',
                code: 'EMAIL_EXISTS'
            });
        }

        // Hash password
        const hashed = await bcrypt.hash(password.trim(), 12);

        // Create user with email verification token
        const verificationToken = jwt.sign(
            { email: email.trim().toLowerCase() },
            process.env.JWT_SECRET || 'bunbun_secret',
            { expiresIn: '1d' }
        );

        const [result] = await pool.query(
            `INSERT INTO user 
            (fname, lname, email, password, address, contact_number, user_img, role_id, status_id, verification_token)
            VALUES (?, ?, ?, ?, 'N/A', '0000', '', 2, 1, ?)`,
            [fname.trim(), lname?.trim(), email.trim().toLowerCase(), hashed, verificationToken]
        );

        // Send verification email
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
        
        await transporter.sendMail({
            from: `"BunBun Threads" <${process.env.EMAIL_USER}>`,
            to: email.trim().toLowerCase(),
            subject: 'Verify Your Email Address',
            html: `Please click <a href="${verificationUrl}">here</a> to verify your email address.`
        });

        res.status(201).json({
            message: 'Account created successfully. Please check your email to verify your account.',
            userId: result.insertId
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({
            error: 'Account creation failed',
            code: 'CREATION_FAILED'
        });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'Email is required',
            code: 'MISSING_EMAIL'
        });
    }

    try {
        const [users] = await pool.query(
            'SELECT * FROM user WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            // Don't reveal whether email exists
            return res.json({
                message: 'If an account exists with this email, a password reset link has been sent'
            });
        }

        const user = users[0];
        const resetToken = jwt.sign(
            { userId: user.user_id },
            process.env.JWT_SECRET || 'bunbun_secret',
            { expiresIn: '1h' }
        );

        // Store reset token in database
        await pool.query(
            'UPDATE user SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE user_id = ?',
            [resetToken, user.user_id]
        );

        // Send reset email
        const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
        
        await transporter.sendMail({
            from: `"BunBun Threads" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `Please click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.`
        });

        res.json({
            message: 'Password reset instructions sent to your email'
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            error: 'Failed to process password reset',
            code: 'RESET_FAILED'
        });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            error: 'Token and new password are required',
            code: 'MISSING_DATA'
        });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(newPassword);
    if (!passwordCheck.valid) {
        return res.status(400).json({
            error: 'Password does not meet complexity requirements',
            code: 'WEAK_PASSWORD',
            requirements: passwordCheck.requirements
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bunbun_secret');

        // Check if token exists in database and isn't expired
        const [users] = await pool.query(
            'SELECT * FROM user WHERE user_id = ? AND reset_token = ? AND reset_token_expires > NOW()',
            [decoded.userId, token]
        );

        if (users.length === 0) {
            return res.status(400).json({
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        const user = users[0];
        const hashed = await bcrypt.hash(newPassword.trim(), 12);

        // Update password and clear reset token
        await pool.query(
            'UPDATE user SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?',
            [hashed, user.user_id]
        );

        res.json({
            message: 'Password reset successfully'
        });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(400).json({
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
});

module.exports = router;
