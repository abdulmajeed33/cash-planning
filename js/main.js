// Import controllers
import investmentController from './controllers/InvestmentController.js';
import landController from './controllers/LandController.js';
import transactionController from './controllers/TransactionController.js';

// Import views
import investmentView from './views/InvestmentView.js';
import landView from './views/LandView.js';
import chartView from './views/ChartView.js';

// Import service
import dbService from './services/DatabaseService.js';

// Main application initialization
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the database
    await dbService.init();
    
    // Initial data load
    await Promise.all([
        loadInvestments(),
        loadLands()
    ]);

    // Set up event handlers
    setupEventHandlers();
});

// Load investment data
async function loadInvestments() {
    try {
        const investments = await investmentController.getAllInvestments();
        investmentView.displayInvestments(investments);
    } catch (error) {
        console.error('Error loading investments:', error);
    }
}

// Load land data
async function loadLands() {
    try {
        const lands = await landController.getAllLands();
        landView.displayLands(lands);
    } catch (error) {
        console.error('Error loading lands:', error);
    }
}

// Set up all event handlers
function setupEventHandlers() {
    // Investment handlers
    investmentView.bindAddInvestment(async (id, formData) => {
        try {
            if (id) {
                // Update existing investment
                await investmentController.updateInvestment(id, formData);
            } else {
                // Add new investment
                await investmentController.addInvestment(formData);
            }
            investmentView.resetInvestmentForm();
            await loadInvestments();
            
            // Reload chart data if available
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        } catch (error) {
            console.error('Error managing investment:', error);
            alert('Failed to save investment. Please try again.');
        }
    });

    investmentView.bindEditInvestment(async (id) => {
        try {
            const investment = await investmentController.getInvestmentById(id);
            if (investment) {
                investmentView.populateInvestmentForm(investment);
            }
        } catch (error) {
            console.error(`Error editing investment with ID ${id}:`, error);
        }
    });

    investmentView.bindDeleteInvestment(async (id) => {
        try {
            await investmentController.deleteInvestment(id);
            await loadInvestments();
            
            // Reload chart data if available
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        } catch (error) {
            console.error(`Error deleting investment with ID ${id}:`, error);
        }
    });

    // Land handlers
    landView.bindAddLand(async (id, formData) => {
        try {
            if (id) {
                // Update existing land
                await landController.updateLand(id, formData);
            } else {
                // Add new land
                await landController.addLand(formData);
            }
            landView.resetLandForm();
            await loadLands();
            
            // Reload chart data if available
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        } catch (error) {
            console.error('Error managing land:', error);
            alert('Failed to save land. Please try again.');
        }
    });

    landView.bindEditLand(async (id) => {
        try {
            const land = await landController.getLandById(id);
            if (land) {
                landView.populateLandForm(land);
            }
        } catch (error) {
            console.error(`Error editing land with ID ${id}:`, error);
        }
    });

    landView.bindDeleteLand(async (id) => {
        try {
            await landController.deleteLand(id);
            await loadLands();
            
            // Reload chart data if available
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        } catch (error) {
            console.error(`Error deleting land with ID ${id}:`, error);
        }
    });

    // Chart handlers
    chartView.bindTabSwitching(() => {
        // Initialize investment chart when switching to investment timeline tab
        if (window.initInvestmentChart && typeof window.initInvestmentChart === 'function') {
            window.initInvestmentChart();
        }
    });

    chartView.bindDateRangeUpdate((startDate, endDate) => {
        // Update chart date range
        if (window.updateDateRange && typeof window.updateDateRange === 'function') {
            window.updateDateRange(startDate, endDate);
        }
    });
}