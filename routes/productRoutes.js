// routes/productRoutes.js
const express = require('express');
const router = express.Router();

// Import sub-routes
const newProducts = require('./product/new');
const popularProducts = require('./product/popular');
const wearablesProducts = require('./product/wearables');

// Use them under /api/products/new and /api/products/popular
router.use('/new', newProducts);
router.use('/popular', popularProducts);
router.use('/wearables', wearablesProducts);

module.exports = router;
