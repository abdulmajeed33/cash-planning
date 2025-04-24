const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/investments', require('./routes/investments'));
app.use('/api/lands', require('./routes/lands'));
app.use('/api/transactions', require('./routes/transactions'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});