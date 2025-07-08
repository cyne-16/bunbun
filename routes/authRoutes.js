// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('📩 Login attempt with:', email, password);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [results] = await db.promise().query(
            'SELECT * FROM user WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        console.log('🧾 Query result:', results);

        if (results.length === 0) {
            console.log('❌ No user found for this email');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        console.log('🔐 Stored hash:', user.password);

        const isMatch = await bcrypt.compare(password.trim(), user.password);
        console.log('🔍 Password match:', isMatch);

        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET || 'bunbun_secret',
            { expiresIn: '2h' }
        );

        console.log('✅ Login successful');
        res.json({
            token,
            user: {
                id: user.user_id,
                fname: user.fname,
                lname: user.lname,
                email: user.email
            }
        });

    } catch (err) {
        console.error('🔥 Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// SIGN UP
router.post('/signup', async (req, res) => {
    const { fname, lname, email, password } = req.body;

    if (!fname || !email || !password) {
        return res.status(400).json({
            error: 'Required fields missing'
        });
    }

    try {
        // Check if user exists
        const [existing] = await db.promise().query(
            'SELECT * FROM user WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }

        const hashed = await bcrypt.hash(password.trim(), 10);


        const [result] = await db.promise().query(
            `INSERT INTO user 
            (fname, lname, email, password, address, contact_number, user_img, role_id, status_id)
            VALUES (?, ?, ?, ?, 'N/A', '0000', '', 2, 1)`,
            [fname.trim(), lname?.trim(), email.trim().toLowerCase(), hashed]
        );

        res.status(201).json({
            message: 'Account created successfully',
            userId: result.insertId
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({
            error: 'Account creation failed'
        });
    }
});

module.exports = router;
