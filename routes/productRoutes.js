
const express = require('express');
const router = express.Router();

const newProducts = require('./product/new');
const popularProducts = require('./product/popular');
const wearablesProducts = require('./product/wearables');
const decorProducts = require('./product/decor');
const customProducts = require('./product/custom');


router.use('/new', newProducts);
router.use('/popular', popularProducts);
router.use('/wearables', wearablesProducts);
router.use('/decor', decorProducts);
router.use('/custom', customProducts);


module.exports = router;
