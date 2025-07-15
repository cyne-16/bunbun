const express = require('express');
const path = require('path');
const app = express();



app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/api/test/:id', (req, res) => {
    console.log("🛠️ test route hit", req.params.id);
    res.json({ test: 'ok', id: req.params.id });
});






// Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
