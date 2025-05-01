class Transaction {
    constructor(data = {}) {
        this.id = data.id || null;
        this.entity_id = data.entity_id || null;
        this.entity_type = data.entity_type || ''; // 'investment' or 'land'
        this.transaction_type = data.transaction_type || ''; // 'buy' or 'sale'
        this.amount = data.amount || '0';
        this.transaction_date = data.transaction_date || new Date();
        this.notes = data.notes || '';
    }

    // Ensure correct sign convention: buy is negative, sale is positive
    static formatAmount(amount, transactionType) {
        const numAmount = parseFloat(amount);
        if (transactionType === 'buy') {
            return numAmount > 0 ? -Math.abs(numAmount) : numAmount;
        } else if (transactionType === 'sale') {
            return numAmount < 0 ? Math.abs(numAmount) : numAmount;
        }
        return numAmount;
    }

    toJSON() {
        return {
            id: this.id,
            entity_id: this.entity_id,
            entity_type: this.entity_type,
            transaction_type: this.transaction_type,
            amount: this.amount,
            transaction_date: this.transaction_date,
            notes: this.notes
        };
    }
}

export default Transaction; 