const express = require('express');
const path = require('path');
const app = express();

// Serve static files (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// Use product routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
