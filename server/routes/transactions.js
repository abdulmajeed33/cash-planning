const router = require('express').Router();
const pool = require('../db/config');

// Get all transactions with optional filtering
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT * FROM transactions';
        const params = [];
        let conditions = [];
        
        if (req.query.entity_type) {
            params.push(req.query.entity_type);
            conditions.push(`entity_type = $${params.length}`);
        }
        
        if (req.query.entity_id) {
            params.push(req.query.entity_id);
            conditions.push(`entity_id = $${params.length}`);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY transaction_date ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    const { entity_id, entity_type, transaction_type, amount, transaction_date, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (entity_id, entity_type, transaction_type, amount, transaction_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [entity_id, entity_type, transaction_type, amount, transaction_date, notes]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;