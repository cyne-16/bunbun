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
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.status(401).send('Invalid email or password');

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(401).send('Invalid email or password');

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, 'bunbun_secret', {
            expiresIn: '2h',
        });

        res.json({ token, user: { fname: user.fname, email: user.email } });
    });
});

// SIGN UP
router.post('/signup', async (req, res) => {
    const { fname, lname, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const checkQuery = 'SELECT * FROM user WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).send('Signup failed');
        }

        if (results.length > 0) return res.status(409).send('Email already used');

        const sql = `
      INSERT INTO user (fname, lname, email, password, address, contact_number, user_img, role_id, status_id)
      VALUES (?, ?, ?, ?, 'N/A', '0000', '', 2, 1)
    `;
        db.query(sql, [fname, lname, email, hashed], (err2, result) => {
            if (err2) {
                console.error("Error inserting user:", err2);
                return res.status(500).send('Signup failed');
            }
            res.send('Account created');
        });
    });
});


module.exports = router;
