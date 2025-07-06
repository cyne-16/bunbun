const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.get('/', (req, res) => {
    const sql = `
    SELECT 
      i.item_id AS id,
      i.item_name AS name,
      i.description,
      i.sell_price AS price,
      c.description AS category,
      img.img_path AS image_url
    FROM item i
    LEFT JOIN category c ON i.category_id = c.category_id
    LEFT JOIN itemimg img ON i.item_id = img.item_id
    WHERE i.category_id = 1
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.sqlMessage });
        }
        res.json(results);
    });
});

module.exports = router;
