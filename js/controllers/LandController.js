import dbService from '../services/DatabaseService.js';
import Land from '../models/Land.js';

class LandController {
    constructor() {
        this.STORE_NAME = 'lands';
    }

    async getAllLands() {
        try {
            const lands = await dbService.getAll(this.STORE_NAME);
            return lands.map(land => new Land(land));
        } catch (error) {
            console.error('Error loading lands:', error);
            throw error;
        }
    }

    async getLandById(id) {
        try {
            const land = await dbService.getById(this.STORE_NAME, id);
            return land ? new Land(land) : null;
        } catch (error) {
            console.error(`Error loading land with ID ${id}:`, error);
            throw error;
        }
    }

    async addLand(formData) {
        try {
            // Calculate fields
            const sizeSqm = parseFloat(formData.size_sqm);
            const pricePerSqm = parseFloat(formData.price_per_sqm);
            const debtPercentage = parseFloat(formData.debt_percentage);
            
            const value = Land.calculateValue(sizeSqm, pricePerSqm);
            const debtAmount = Land.calculateDebtAmount(value, debtPercentage);
            const cashInjection = Land.calculateCashInjection(value, debtAmount);
            
            const land = new Land({
                land_name: formData.land_name,
                size_sqm: sizeSqm.toString(),
                price_per_sqm: pricePerSqm.toString(),
                value: value.toString(),
                debt_percentage: debtPercentage.toString(),
                debt_amount: debtAmount.toString(),
                cash_injection: cashInjection.toString(),
                date_added: new Date().toISOString()
            });
            
            const id = await dbService.add(this.STORE_NAME, land.toJSON());
            land.id = id;
            return land;
        } catch (error) {
            console.error('Error adding land:', error);
            throw error;
        }
    }

    async updateLand(id, formData) {
        try {
            // Get the existing land to preserve the date_added
            const existingLand = await this.getLandById(id);
            if (!existingLand) {
                throw new Error(`Land with ID ${id} not found`);
            }
            
            // Calculate fields
            const sizeSqm = parseFloat(formData.size_sqm);
            const pricePerSqm = parseFloat(formData.price_per_sqm);
            const debtPercentage = parseFloat(formData.debt_percentage);
            
            const value = Land.calculateValue(sizeSqm, pricePerSqm);
            const debtAmount = Land.calculateDebtAmount(value, debtPercentage);
            const cashInjection = Land.calculateCashInjection(value, debtAmount);
            
            const updatedLand = new Land({
                id: id,
                land_name: formData.land_name,
                size_sqm: sizeSqm.toString(),
                price_per_sqm: pricePerSqm.toString(),
                value: value.toString(),
                debt_percentage: debtPercentage.toString(),
                debt_amount: debtAmount.toString(),
                cash_injection: cashInjection.toString(),
                date_added: existingLand.date_added // Preserve original date
            });
            
            await dbService.update(this.STORE_NAME, updatedLand.toJSON());
            return updatedLand;
        } catch (error) {
            console.error(`Error updating land with ID ${id}:`, error);
            throw error;
        }
    }

    async deleteLand(id) {
        try {
            await dbService.delete(this.STORE_NAME, id);
        } catch (error) {
            console.error(`Error deleting land with ID ${id}:`, error);
            throw error;
        }
    }
}

// Singleton instance
const landController = new LandController();
export default landController; 