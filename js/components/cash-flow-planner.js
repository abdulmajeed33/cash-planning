/**
 * Cash Flow Planner Component
 * Handles cash flow planning dashboard functionality
 */

class CashFlowPlanner {
    constructor() {
        this.openingBalance = 50000000;
        this.startDate = '2025-06-01';
        this.endDate = '2025-08-31';
        this.monthlyData = new Map();
        this.cashFlowData = {
            capital: { inflows: {}, outflows: {} },
            operational: { inflows: {}, outflows: {} }
        };
        
        this.init();
    }

    /**
     * Initialize the Cash Flow Planner component
     */
    init() {
        console.log('Initializing Cash Flow Planner...');
        
        // Initialize data
        this.loadDataFromStorage();
        
        // Set up event listeners
        this.initializeEventListeners();
        
        // Initial render
        this.updateCalculations();
        this.renderTable();
        
        console.log('Cash Flow Planner initialized successfully');
    }

    initializeEventListeners() {
        // Opening balance input
        const balanceInput = document.getElementById('opening-balance');
        const applyBalanceBtn = document.getElementById('apply-balance');
        
        if (balanceInput && applyBalanceBtn) {
            // Real-time update on input
            balanceInput.addEventListener('input', () => {
                this.handleBalanceInput();
            });
            
            // Apply button click
            applyBalanceBtn.addEventListener('click', () => {
                this.applyOpeningBalance();
            });
        }
        
        // Date range inputs
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const applyDatesBtn = document.getElementById('apply-dates');
        
        if (startDateInput && endDateInput && applyDatesBtn) {
            // Real-time date validation
            startDateInput.addEventListener('change', () => {
                this.handleDateRangeInput();
            });
            
            endDateInput.addEventListener('change', () => {
                this.handleDateRangeInput();
            });
            
            // Apply dates button click
            applyDatesBtn.addEventListener('click', () => {
                this.applyDateRange();
            });
        }

        // Listen for section changes
        document.addEventListener('sectionChanged', (event) => {
            this.handleSectionChange(event.detail.sectionId);
        });

        // Initialize with default values
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
    }

    handleBalanceInput() {
        const balanceInput = document.getElementById('opening-balance');
        const card = document.querySelector('.opening-balance-card');
        
        // Visual feedback
        card.classList.add('active');
        
        // Remove active state after a short delay
        setTimeout(() => {
            card.classList.remove('active');
        }, 300);
        
        // Validate input
        const value = parseFloat(balanceInput.value);
        if (isNaN(value) || value < 0) {
            card.classList.add('error');
            setTimeout(() => {
                card.classList.remove('error');
            }, 2000);
        }
    }

    applyOpeningBalance() {
        const balanceInput = document.getElementById('opening-balance');
        const value = parseFloat(balanceInput.value);
        
        if (isNaN(value) || value < 0) {
            this.showError('Please enter a valid opening balance (≥ 0)');
            return;
        }
        
        this.openingBalance = value;
        this.updateCalculations();
        this.renderTable();
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
        this.showSuccess('Opening balance updated successfully');
    }

    handleDateRangeInput() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const card = document.querySelector('.date-range-card');
        
        // Visual feedback
        card.classList.add('active');
        setTimeout(() => {
            card.classList.remove('active');
        }, 300);
        
        // Validate date range
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            card.classList.add('error');
            setTimeout(() => {
                card.classList.remove('error');
            }, 2000);
        }
    }

    applyDateRange() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            this.showError('Start date must be before end date');
            return;
        }
        
        this.startDate = startDate;
        this.endDate = endDate;
        this.updateCalculations();
        this.renderTable();
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
        this.showSuccess('Date range updated successfully');
    }

    /**
     * Load data from localStorage (investments, lands, cash flows)
     */
    loadDataFromStorage() {
        try {
            // Load investment data
            const investments = JSON.parse(localStorage.getItem('investments') || '[]');
            const lands = JSON.parse(localStorage.getItem('lands') || '[]');
            const recurringPayments = JSON.parse(localStorage.getItem('recurringPayments') || '[]');
            const nonRecurringPayments = JSON.parse(localStorage.getItem('nonRecurringPayments') || '[]');
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');

            // Clear existing data
            this.cashFlowData = {
                capital: { inflows: {}, outflows: {} },
                operational: { inflows: {}, outflows: {} }
            };

            // Process capital cash flows (investments and lands)
            this.processCapitalTransactions(investments, lands);
            
            // Process operational cash flows
            this.processOperationalCashFlows(recurringPayments, nonRecurringPayments, invoices, suppliers);
            
        } catch (error) {
            console.error('Error loading data from storage:', error);
        }
    }

    /**
     * Process capital transactions (investments and lands)
     */
    processCapitalTransactions(investments, lands) {
        // Process investments
        investments.forEach(investment => {
            const monthKey = this.getMonthKey(new Date());
            const cashInvestment = parseFloat(investment.cashInvestment) || 0;
            
            if (cashInvestment > 0) {
                this.addCashFlow('capital', 'outflows', monthKey, cashInvestment);
            }
        });

        // Process lands
        lands.forEach(land => {
            const monthKey = this.getMonthKey(new Date());
            const cashInjection = parseFloat(land.cashInjection) || 0;
            
            if (cashInjection > 0) {
                this.addCashFlow('capital', 'outflows', monthKey, cashInjection);
            }
        });
    }

    /**
     * Process operational cash flows
     */
    processOperationalCashFlows(recurring, nonRecurring, invoices, suppliers) {
        // Process recurring payments
        recurring.forEach(payment => {
            const amount = parseFloat(payment.amount) || 0;
            this.distributeRecurringPayment(amount, parseInt(payment.dayOfMonth));
        });

        // Process non-recurring payments
        nonRecurring.forEach(payment => {
            const amount = parseFloat(payment.amount) || 0;
            const monthKey = this.getMonthKey(new Date(payment.paymentDate));
            this.addCashFlow('operational', 'outflows', monthKey, amount);
        });

        // Process invoices (inflows)
        invoices.forEach(invoice => {
            const amount = parseFloat(invoice.amount) || 0;
            const monthKey = this.getMonthKey(new Date(invoice.paymentDueDate));
            this.addCashFlow('operational', 'inflows', monthKey, amount);
        });

        // Process supplier payments (outflows)
        suppliers.forEach(supplier => {
            const amount = parseFloat(supplier.amount) || 0;
            const monthKey = this.getMonthKey(new Date(supplier.paymentDueDate));
            this.addCashFlow('operational', 'outflows', monthKey, amount);
        });
    }

    /**
     * Distribute recurring payments across months in the date range
     */
    distributeRecurringPayment(amount, dayOfMonth) {
        const months = this.getMonthsInRange();
        
        months.forEach(monthKey => {
            this.addCashFlow('operational', 'outflows', monthKey, amount);
        });
    }

    /**
     * Add cash flow to the data structure
     */
    addCashFlow(type, direction, monthKey, amount) {
        if (!this.cashFlowData[type][direction][monthKey]) {
            this.cashFlowData[type][direction][monthKey] = 0;
        }
        this.cashFlowData[type][direction][monthKey] += amount;
    }

    /**
     * Get month key from date
     */
    getMonthKey(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    }

    /**
     * Get formatted month display
     */
    getMonthDisplay(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        }).replace(/(\d+) (\w+) (\d+)/, `${lastDay}-$2-$3`);
    }

    /**
     * Get all months in the current date range
     */
    getMonthsInRange() {
        const months = [];
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        
        while (current <= end) {
            months.push(this.getMonthKey(current));
            current.setMonth(current.getMonth() + 1);
        }
        
        return months;
    }

    /**
     * Update calculations for net cash flow and balances
     */
    updateCalculations() {
        const months = this.getMonthsInRange();
        let runningBalance = this.openingBalance;
        let totalNetFlow = 0;
        let minBalance = this.openingBalance;
        let minBalanceDate = this.startDate;

        // Calculate net flows and balances for each month
        months.forEach(monthKey => {
            const capitalIn = this.cashFlowData.capital.inflows[monthKey] || 0;
            const capitalOut = this.cashFlowData.capital.outflows[monthKey] || 0;
            const operationalIn = this.cashFlowData.operational.inflows[monthKey] || 0;
            const operationalOut = this.cashFlowData.operational.outflows[monthKey] || 0;
            
            const netFlow = (capitalIn + operationalIn) - (capitalOut + operationalOut);
            runningBalance += netFlow;
            totalNetFlow += netFlow;
            
            // Track minimum balance
            if (runningBalance < minBalance) {
                minBalance = runningBalance;
                minBalanceDate = monthKey;
            }
            
            // Store calculated values
            this.monthlyData.set(monthKey, {
                capitalIn,
                capitalOut,
                operationalIn,
                operationalOut,
                netFlow,
                closingBalance: runningBalance
            });
        });

        // Update displays
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
    }

    updateMinimumBalanceDisplay() {
        const balanceAmountEl = document.querySelector('.balance-amount');
        const balanceTextEl = document.querySelector('.balance-text');
        
        if (!balanceAmountEl || !balanceTextEl) return;
        
        // Calculate minimum balance and date
        const minBalanceData = this.calculateMinimumBalance();
        
        // Add updating animation
        balanceAmountEl.classList.add('updating');
        
        // Format and display the minimum balance
        const formattedAmount = this.formatCurrency(minBalanceData.amount);
        balanceAmountEl.textContent = formattedAmount;
        
        // Display the date when minimum occurs
        const dateText = minBalanceData.date ? 
            `Occurs on ${this.formatDate(minBalanceData.date)}` : 
            'No data available for selected period';
        balanceTextEl.textContent = dateText;
        
        // Remove animation after a short delay
        setTimeout(() => {
            balanceAmountEl.classList.remove('updating');
        }, 300);
    }

    updateNetCashFlowDisplay() {
        const flowAmountEl = document.querySelector('.flow-amount');
        const flowTextEl = document.querySelector('.flow-text');
        
        if (!flowAmountEl || !flowTextEl) return;
        
        // Calculate net cash flow
        const netCashFlow = this.calculateNetCashFlow();
        
        // Add updating animation
        flowAmountEl.classList.add('updating');
        
        // Format and display the net cash flow
        const formattedAmount = this.formatCurrency(netCashFlow);
        flowAmountEl.textContent = formattedAmount;
        
        // Update descriptive text
        const isPositive = netCashFlow >= 0;
        const flowDescription = isPositive ? 
            'Positive cash flow for selected period' : 
            'Negative cash flow for selected period';
        flowTextEl.textContent = flowDescription;
        
        // Remove animation after a short delay
        setTimeout(() => {
            flowAmountEl.classList.remove('updating');
        }, 300);
    }

    calculateMinimumBalance() {
        const months = this.getMonthsInRange();
        let minBalance = this.openingBalance;
        let minDate = null;
        let runningBalance = this.openingBalance;
        
        for (const month of months) {
            const monthlyFlow = this.calculateMonthlyFlow(month);
            runningBalance += monthlyFlow;
            
            if (runningBalance < minBalance) {
                minBalance = runningBalance;
                minDate = new Date(month.year, month.month - 1, 1);
            }
        }
        
        return {
            amount: minBalance,
            date: minDate
        };
    }

    calculateNetCashFlow() {
        const months = this.getMonthsInRange();
        let totalFlow = 0;
        
        for (const month of months) {
            totalFlow += this.calculateMonthlyFlow(month);
        }
        
        return totalFlow;
    }

    calculateMonthlyFlow(month) {
        let totalInflows = 0;
        let totalOutflows = 0;
        
        const monthKey = `${month.year}-${String(month.month).padStart(2, '0')}`;
        
        // Iterate through cash flow data structure
        for (const categoryKey in this.cashFlowData) {
            const category = this.cashFlowData[categoryKey];
            
            // Check capital flows
            if (category.capital && category.capital.inflows && category.capital.inflows[monthKey]) {
                totalInflows += category.capital.inflows[monthKey];
            }
            if (category.capital && category.capital.outflows && category.capital.outflows[monthKey]) {
                totalOutflows += category.capital.outflows[monthKey];
            }
            
            // Check operational flows
            if (category.operational && category.operational.inflows && category.operational.inflows[monthKey]) {
                totalInflows += category.operational.inflows[monthKey];
            }
            if (category.operational && category.operational.outflows && category.operational.outflows[monthKey]) {
                totalOutflows += category.operational.outflows[monthKey];
            }
        }
        
        return totalInflows - totalOutflows;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    /**
     * Render the monthly cashflow table
     */
    renderTable() {
        const table = document.getElementById('monthly-cashflow-table');
        if (!table) return;

        const months = this.getMonthsInRange();
        
        // Clear existing dynamic content
        this.clearTableData();
        
        // Generate header
        this.generateTableHeader(months);
        
        // Generate data rows
        this.generateTableRows(months);
    }

    /**
     * Clear existing table data
     */
    clearTableData() {
        const rows = document.querySelectorAll('#monthly-cashflow-table tbody tr');
        rows.forEach(row => {
            // Keep the row-label cell, remove others
            const cells = row.querySelectorAll('td:not(.row-label)');
            cells.forEach(cell => cell.remove());
        });
    }

    /**
     * Generate table header with month columns
     */
    generateTableHeader(months) {
        const headerRow = document.getElementById('table-header');
        if (!headerRow) return;

        // Remove existing month headers
        const existingHeaders = headerRow.querySelectorAll('th:not(.row-label)');
        existingHeaders.forEach(header => header.remove());

        // Add new month headers
        months.forEach(monthKey => {
            const th = document.createElement('th');
            th.textContent = this.getMonthDisplay(monthKey);
            th.className = 'month-header';
            headerRow.appendChild(th);
        });
    }

    /**
     * Generate table rows with data
     */
    generateTableRows(months) {
        const rows = {
            'capital-inflows': document.querySelector('.capital-inflows'),
            'capital-outflows': document.querySelector('.capital-outflows'),
            'total-capital-flow': document.querySelector('.total-capital-flow'),
            'operational-inflows': document.querySelector('.operational-inflows'),
            'operational-outflows': document.querySelector('.operational-outflows'),
            'total-operational-flow': document.querySelector('.total-operational-flow'),
            'net-cash-flow': document.querySelector('.net-cash-flow'),
            'closing-balance': document.querySelector('.closing-balance')
        };

        months.forEach(monthKey => {
            const data = this.monthlyData.get(monthKey) || {
                capitalIn: 0,
                capitalOut: 0,
                operationalIn: 0,
                operationalOut: 0,
                netFlow: 0,
                closingBalance: this.openingBalance
            };

            // Calculate totals for capital and operational flows
            const totalCapitalFlow = data.capitalIn - data.capitalOut;
            const totalOperationalFlow = data.operationalIn - data.operationalOut;

            // Add data cells to each row
            if (rows['capital-inflows']) {
                this.addDataCell(rows['capital-inflows'], data.capitalIn);
            }
            if (rows['capital-outflows']) {
                this.addDataCell(rows['capital-outflows'], -data.capitalOut);
            }
            if (rows['total-capital-flow']) {
                this.addDataCell(rows['total-capital-flow'], totalCapitalFlow);
            }
            if (rows['operational-inflows']) {
                this.addDataCell(rows['operational-inflows'], data.operationalIn);
            }
            if (rows['operational-outflows']) {
                this.addDataCell(rows['operational-outflows'], -data.operationalOut);
            }
            if (rows['total-operational-flow']) {
                this.addDataCell(rows['total-operational-flow'], totalOperationalFlow);
            }
            if (rows['net-cash-flow']) {
                this.addDataCell(rows['net-cash-flow'], data.netFlow);
            }
            if (rows['closing-balance']) {
                this.addDataCell(rows['closing-balance'], data.closingBalance);
            }
        });
    }

    /**
     * Add data cell to table row
     */
    addDataCell(row, value) {
        const td = document.createElement('td');
        td.className = 'data-cell';
        td.textContent = this.formatCurrency(value);
        
        // Add styling based on value
        if (value > 0) {
            td.classList.add('positive-value');
        } else if (value < 0) {
            td.classList.add('negative-value');
        } else {
            td.classList.add('zero-value');
        }
        
        // Add special styling for total rows
        if (row && row.classList.contains('total-capital-flow')) {
            td.classList.add('total-capital-cell');
        } else if (row && row.classList.contains('total-operational-flow')) {
            td.classList.add('total-operational-cell');
        }
        
        row.appendChild(td);
    }

    /**
     * Format currency values
     */
    formatCurrency(value) {
        if (value === 0) return '0';
        
        const formatted = Math.abs(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return value < 0 ? `-${formatted}` : formatted;
    }

    /**
     * Refresh the planner data and display
     */
    refresh() {
        this.loadDataFromStorage();
        this.updateCalculations();
        this.renderTable();
    }

    /**
     * Get current cash flow summary
     */
    getSummary() {
        const months = this.getMonthsInRange();
        let totalCapitalIn = 0;
        let totalCapitalOut = 0;
        let totalOperationalIn = 0;
        let totalOperationalOut = 0;
        
        months.forEach(monthKey => {
            const data = this.monthlyData.get(monthKey);
            if (data) {
                totalCapitalIn += data.capitalIn;
                totalCapitalOut += data.capitalOut;
                totalOperationalIn += data.operationalIn;
                totalOperationalOut += data.operationalOut;
            }
        });
        
        const totalCapitalFlow = totalCapitalIn - totalCapitalOut;
        const totalOperationalFlow = totalOperationalIn - totalOperationalOut;
        
        return {
            capital: {
                inflows: totalCapitalIn,
                outflows: totalCapitalOut,
                net: totalCapitalIn - totalCapitalOut,
                total: totalCapitalFlow
            },
            operational: {
                inflows: totalOperationalIn,
                outflows: totalOperationalOut,
                net: totalOperationalIn - totalOperationalOut,
                total: totalOperationalFlow
            },
            total: {
                net: (totalCapitalIn + totalOperationalIn) - (totalCapitalOut + totalOperationalOut),
                capitalFlow: totalCapitalFlow,
                operationalFlow: totalOperationalFlow
            }
        };
    }

    handleSectionChange(sectionId) {
        if (sectionId === 'cash-flow-planner') {
            // Refresh the display when switching to cash flow planner
            setTimeout(() => {
                this.updateDisplay();
            }, 100);
        }
    }
}

// Initialize Cash Flow Planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize only when the cash flow planner section is active
    document.addEventListener('sectionChanged', (event) => {
        if (event.detail.section === 'cash-flow-planner') {
            if (!window.cashFlowPlanner) {
                window.cashFlowPlanner = new CashFlowPlanner();
            } else {
                window.cashFlowPlanner.refresh();
            }
        }
    });
    
    // Initialize immediately if the section is already active
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'cash-flow-planner') {
        window.cashFlowPlanner = new CashFlowPlanner();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CashFlowPlanner;
} 