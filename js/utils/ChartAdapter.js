/**
 * This utility file acts as an adapter between our MVC structure
 * and the existing investment-chart.js functionality.
 * It exposes the necessary global functions that the investment-chart.js
 * file expects to find in the window object.
 */

import dbService from '../services/DatabaseService.js';
import investmentController from '../controllers/InvestmentController.js';
import landController from '../controllers/LandController.js';
import transactionController from '../controllers/TransactionController.js';

// Initialize the chart
window.initInvestmentChart = async function() {
    // This function will be implemented inside investment-chart.js
    console.log('Chart initialization requested');
};

// Update the date range for the chart
window.updateDateRange = function(startDate, endDate) {
    // This function will be implemented inside investment-chart.js
    console.log('Chart date range update requested', startDate, endDate);
};

// Expose database service for chart operations
window.dbService = dbService;

// Export controllers for use in chart
window.controllers = {
    investmentController,
    landController,
    transactionController
}; 