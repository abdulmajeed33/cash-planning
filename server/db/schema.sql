CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size DECIMAL NOT NULL,
    share_percentage DECIMAL NOT NULL,
    debt_percentage DECIMAL NOT NULL,
    investment_amount DECIMAL GENERATED ALWAYS AS (size * share_percentage / 100) STORED,
    debt_amount DECIMAL GENERATED ALWAYS AS (size * share_percentage / 100 * debt_percentage / 100) STORED,
    cash_investment DECIMAL GENERATED ALWAYS AS (size * share_percentage / 100 * (1 - debt_percentage / 100)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lands (
    id SERIAL PRIMARY KEY,
    land_name VARCHAR(255) NOT NULL,
    size_sqm DECIMAL NOT NULL,
    price_per_sqm DECIMAL NOT NULL,
    debt_percentage DECIMAL NOT NULL,
    value DECIMAL GENERATED ALWAYS AS (size_sqm * price_per_sqm) STORED,
    debt_amount DECIMAL GENERATED ALWAYS AS (size_sqm * price_per_sqm * debt_percentage / 100) STORED,
    cash_injection DECIMAL GENERATED ALWAYS AS (size_sqm * price_per_sqm * (1 - debt_percentage / 100)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('investment', 'land')),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);