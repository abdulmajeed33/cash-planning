class Land {
    constructor(data = {}) {
        this.id = data.id || null;
        this.land_name = data.land_name || '';
        this.size_sqm = data.size_sqm || '0';
        this.price_per_sqm = data.price_per_sqm || '0';
        this.value = data.value || '0';
        this.debt_percentage = data.debt_percentage || '0';
        this.debt_amount = data.debt_amount || '0';
        this.cash_injection = data.cash_injection || '0';
        this.date_added = data.date_added || new Date().toISOString();
    }

    static calculateValue(sizeSqm, pricePerSqm) {
        return sizeSqm * pricePerSqm;
    }

    static calculateDebtAmount(value, debtPercentage) {
        return value * (debtPercentage / 100);
    }

    static calculateCashInjection(value, debtAmount) {
        return value - debtAmount;
    }

    toJSON() {
        return {
            id: this.id,
            land_name: this.land_name,
            size_sqm: this.size_sqm,
            price_per_sqm: this.price_per_sqm,
            value: this.value,
            debt_percentage: this.debt_percentage,
            debt_amount: this.debt_amount,
            cash_injection: this.cash_injection,
            date_added: this.date_added
        };
    }
}

export default Land; 