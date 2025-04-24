const router = require('express').Router();
const pool = require('../db/config');

// Get all lands
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lands ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new land
router.post('/', async (req, res) => {
    const { land_name, size_sqm, price_per_sqm, debt_percentage } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO lands (land_name, size_sqm, price_per_sqm, debt_percentage) VALUES ($1, $2, $3, $4) RETURNING *',
            [land_name, size_sqm, price_per_sqm, debt_percentage]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update land
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { land_name, size_sqm, price_per_sqm, debt_percentage } = req.body;
    try {
        const result = await pool.query(
            'UPDATE lands SET land_name = $1, size_sqm = $2, price_per_sqm = $3, debt_percentage = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [land_name, size_sqm, price_per_sqm, debt_percentage, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete land
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM lands WHERE id = $1', [id]);
        res.json({ message: 'Land deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;