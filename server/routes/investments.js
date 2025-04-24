const router = require('express').Router();
const pool = require('../db/config');

// Get all investments
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM investments ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new investment
router.post('/', async (req, res) => {
    const { name, size, share_percentage, debt_percentage } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO investments (name, size, share_percentage, debt_percentage) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, size, share_percentage, debt_percentage]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update investment
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, size, share_percentage, debt_percentage } = req.body;
    try {
        const result = await pool.query(
            'UPDATE investments SET name = $1, size = $2, share_percentage = $3, debt_percentage = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, size, share_percentage, debt_percentage, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete investment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM investments WHERE id = $1', [id]);
        res.json({ message: 'Investment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;