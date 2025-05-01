import dbService from '../services/DatabaseService.js';
import Investment from '../models/Investment.js';

class InvestmentController {
    constructor() {
        this.STORE_NAME = 'investments';
    }

    async getAllInvestments() {
        try {
            const investments = await dbService.getAll(this.STORE_NAME);
            return investments.map(inv => new Investment(inv));
        } catch (error) {
            console.error('Error loading investments:', error);
            throw error;
        }
    }

    async getInvestmentById(id) {
        try {
            const investment = await dbService.getById(this.STORE_NAME, id);
            return investment ? new Investment(investment) : null;
        } catch (error) {
            console.error(`Error loading investment with ID ${id}:`, error);
            throw error;
        }
    }

    async addInvestment(formData) {
        try {
            // Calculate fields
            const size = parseFloat(formData.size);
            const sharePercentage = parseFloat(formData.share_percentage);
            const debtPercentage = parseFloat(formData.debt_percentage);
            
            const investmentAmount = Investment.calculateInvestmentAmount(size, sharePercentage);
            const debtAmount = Investment.calculateDebtAmount(investmentAmount, debtPercentage);
            const cashInvestment = Investment.calculateCashInvestment(investmentAmount, debtAmount);
            
            const investment = new Investment({
                name: formData.name,
                size: size.toString(),
                share_percentage: sharePercentage.toString(),
                investment_amount: investmentAmount.toString(),
                debt_percentage: debtPercentage.toString(),
                debt_amount: debtAmount.toString(),
                cash_investment: cashInvestment.toString(),
                date_added: new Date().toISOString()
            });
            
            const id = await dbService.add(this.STORE_NAME, investment.toJSON());
            investment.id = id;
            return investment;
        } catch (error) {
            console.error('Error adding investment:', error);
            throw error;
        }
    }

    async updateInvestment(id, formData) {
        try {
            // Get the existing investment to preserve the date_added
            const existingInvestment = await this.getInvestmentById(id);
            if (!existingInvestment) {
                throw new Error(`Investment with ID ${id} not found`);
            }
            
            // Calculate fields
            const size = parseFloat(formData.size);
            const sharePercentage = parseFloat(formData.share_percentage);
            const debtPercentage = parseFloat(formData.debt_percentage);
            
            const investmentAmount = Investment.calculateInvestmentAmount(size, sharePercentage);
            const debtAmount = Investment.calculateDebtAmount(investmentAmount, debtPercentage);
            const cashInvestment = Investment.calculateCashInvestment(investmentAmount, debtAmount);
            
            const updatedInvestment = new Investment({
                id: id,
                name: formData.name,
                size: size.toString(),
                share_percentage: sharePercentage.toString(),
                investment_amount: investmentAmount.toString(),
                debt_percentage: debtPercentage.toString(),
                debt_amount: debtAmount.toString(),
                cash_investment: cashInvestment.toString(),
                date_added: existingInvestment.date_added // Preserve original date
            });
            
            await dbService.update(this.STORE_NAME, updatedInvestment.toJSON());
            return updatedInvestment;
        } catch (error) {
            console.error(`Error updating investment with ID ${id}:`, error);
            throw error;
        }
    }

    async deleteInvestment(id) {
        try {
            await dbService.delete(this.STORE_NAME, id);
        } catch (error) {
            console.error(`Error deleting investment with ID ${id}:`, error);
            throw error;
        }
    }
}

// Singleton instance
const investmentController = new InvestmentController();
export default investmentController; 