class Investment {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.size = data.size || '0';
        this.share_percentage = data.share_percentage || '0';
        this.investment_amount = data.investment_amount || '0';
        this.debt_percentage = data.debt_percentage || '0';
        this.debt_amount = data.debt_amount || '0';
        this.cash_investment = data.cash_investment || '0';
        this.date_added = data.date_added || new Date().toISOString();
    }

    static calculateInvestmentAmount(size, sharePercentage) {
        return size * (sharePercentage / 100);
    }

    static calculateDebtAmount(investmentAmount, debtPercentage) {
        return investmentAmount * (debtPercentage / 100);
    }

    static calculateCashInvestment(investmentAmount, debtAmount) {
        return investmentAmount - debtAmount;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            size: this.size,
            share_percentage: this.share_percentage,
            investment_amount: this.investment_amount,
            debt_percentage: this.debt_percentage,
            debt_amount: this.debt_amount,
            cash_investment: this.cash_investment,
            date_added: this.date_added
        };
    }
}

export default Investment; 