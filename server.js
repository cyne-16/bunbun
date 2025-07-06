const express = require('express');
const path = require('path');
const app = express();
const productRoutes = require('./routes/productRoutes');

// Serve static files (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Required to parse JSON request bodies

// Use product routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


// Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
