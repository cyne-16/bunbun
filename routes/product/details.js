const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// GET /api/products/details/:id
router.get('/details/:id', (req, res) => {
    const productId = req.params.id;

    const query = `
    SELECT 
      i.item_id,
      i.item_name,
      i.description,
      i.sell_price,
      i.image_url,
      i.image1,
      i.image2,
      i.image3
    FROM item i
    WHERE i.item_id = ?
  `;

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const row = results[0];

        // Map database fields to match frontend expectations
        const product = {
            id: row.item_id,
            name: row.item_name,
            description: row.description,
            price: row.sell_price,
            image_url: row.image_url,
            image1: row.image1,
            image2: row.image2,
            image3: row.image3
        };

        res.json(product);
    });
});

module.exports = router;
