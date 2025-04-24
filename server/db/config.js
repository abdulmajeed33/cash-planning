const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_yuz4jtTFvrf0@ep-snowy-art-a4yp188s-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

module.exports = pool;