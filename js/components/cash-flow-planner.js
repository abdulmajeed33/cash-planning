/**
 * Cash Flow Planner Component
 * Integrates with the same database as the investment chart
 */

class CashFlowPlanner {
    constructor() {
        // Database configuration (same as investment chart)
        this.DB_NAME = "investmentTracker";
        this.DB_VERSION = 3;
        this.STORES = {
            investments: "investments",
            lands: "lands", 
            transactions: "transactions",
            recurringPayments: "recurringPayments",
            nonRecurringPayments: "nonRecurringPayments",
            invoices: "invoices",
            supplierPayments: "supplierPayments",
            settings: "settings"
        };
        
        // Initialize state
        this.db = null;
        this.openingBalance = 50000; // Default opening balance
        this.startDate = '2025-06-01';
        this.endDate = '2025-08-31';
        this.monthlyData = new Map(); // Initialize the monthly data Map
        
        // Initialize cash flow data structure properly
        this.cashFlowData = {
            capital: {
                inflows: {},
                outflows: {}
            },
            operational: {
                inflows: {},
                outflows: {}
            }
        };
        
        // Data arrays
        this.investments = [];
        this.lands = [];
        this.transactions = [];
        this.recurringPayments = [];
        this.nonRecurringPayments = [];
        this.invoices = [];
        this.supplierPayments = [];
    }

    /**
     * Initialize the component
     */
    async init() {
        console.log('Initializing Cash Flow Planner...');
        
        try {
            // Initialize database connection
            await this.initDatabase();
            
            // Load data from database
            await this.loadDataFromStorage();
            
            // Set up event listeners
            this.initializeEventListeners();
            
            // Perform initial calculations and render
            this.updateCalculations();
            this.renderTable();
            this.updateDisplay();
            
            console.log('Cash Flow Planner initialized successfully');
        } catch (error) {
            console.error('Error initializing Cash Flow Planner:', error);
            this.showError('Failed to initialize Cash Flow Planner');
            
            // Still setup event listeners and render with default data
            this.initializeEventListeners();
            this.updateDisplay();
        }
    }

    /**
     * Initialize database connection
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            // Check if database is already available globally
            if (window.db) {
                this.db = window.db;
                console.log("Using existing database connection");
                resolve(this.db);
                return;
            }

            // Check if database is available from main.js
            if (typeof db !== 'undefined' && db) {
                this.db = db;
                window.db = this.db;
                console.log("Using database connection from main.js");
                resolve(this.db);
                return;
            }

            // Create new database connection
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject("Error opening database");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                window.db = this.db; // Make it globally available
                console.log("Database connection established");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                // Database schema should already be created by investment chart
                console.log("Database schema already exists");
            };
        });
    }

    /**
     * Generic function to get all data from a store
     */
    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database not initialized");
                return;
            }

            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Error fetching data from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    initializeEventListeners() {
        // Opening balance input
        const balanceInput = document.getElementById('opening-balance-input');
        const applyBalanceBtn = document.getElementById('apply-balance-btn');
        
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
        const startDateInput = document.getElementById('cf-start-date');
        const endDateInput = document.getElementById('cf-end-date');
        const applyDatesBtn = document.getElementById('apply-dates-btn');
        
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
            const sectionId = event.detail.section || event.detail.sectionId;
            this.handleSectionChange(sectionId);
        });

        // Also listen for the alternative event name for compatibility
        document.addEventListener('sectionChange', (event) => {
            const sectionId = event.detail.section || event.detail.sectionId;
            this.handleSectionChange(sectionId);
        });

        // Setup data change listeners
        this.setupDataChangeListeners();

        // Initialize with default values
        this.updateDisplay();
    }

    updateDisplay() {
        console.log('Updating display cards...');
        
        // Update both display cards
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
        
        console.log('Display cards updated successfully');
    }

    handleBalanceInput() {
        const balanceInput = document.getElementById('opening-balance-input');
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
        const balanceInput = document.getElementById('opening-balance-input');
        const value = parseFloat(balanceInput.value);
        
        if (isNaN(value) || value < 0) {
            this.showError('Please enter a valid opening balance');
            return;
        }
        
        // Update opening balance
        this.openingBalance = value;
        
        console.log('Opening balance applied:', this.openingBalance);
        
        // Update calculations and displays
        this.updateCalculations();
        this.renderTable();
        this.updateDisplay();
        
        this.showSuccess('Opening balance updated successfully');
    }

    handleDateRangeInput() {
        const startDate = document.getElementById('cf-start-date').value;
        const endDate = document.getElementById('cf-end-date').value;
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
        const startDate = document.getElementById('cf-start-date').value;
        const endDate = document.getElementById('cf-end-date').value;
        
        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) >= new Date(endDate)) {
            this.showError('Start date must be before end date');
            return;
        }
        
        // Update date range
        this.startDate = startDate;
        this.endDate = endDate;
        
        console.log('Date range applied:', { startDate: this.startDate, endDate: this.endDate });
        
        // Update calculations and displays
        this.updateCalculations();
        this.renderTable();
        this.updateDisplay();
        
        this.showSuccess('Date range updated successfully');
    }

    /**
     * Load data from IndexedDB storage
     */
    async loadDataFromStorage() {
        console.log('Loading data from storage...');
        
        try {
            // Ensure database is connected before loading data
            if (!this.db) {
                console.log('Database not connected, initializing...');
                await this.initDatabase();
            }
            
            // Double-check that database is now available
            if (!this.db) {
                throw new Error('Database initialization failed');
            }
            
            // Load all data types in parallel
            const [
                investments,
                lands,
                transactions,
                recurringPayments,
                nonRecurringPayments,
                invoices,
                supplierPayments
            ] = await Promise.all([
                this.getAllData(this.STORES.investments),
                this.getAllData(this.STORES.lands),
                this.getAllData(this.STORES.transactions),
                this.getAllData(this.STORES.recurringPayments),
                this.getAllData(this.STORES.nonRecurringPayments),
                this.getAllData(this.STORES.invoices),
                this.getAllData(this.STORES.supplierPayments)
            ]);
            
            // Store data in class properties
            this.investments = investments || [];
            this.lands = lands || [];
            this.transactions = transactions || [];
            this.recurringPayments = recurringPayments || [];
            this.nonRecurringPayments = nonRecurringPayments || [];
            this.invoices = invoices || [];
            this.supplierPayments = supplierPayments || [];
            
            console.log('Data loaded successfully:', {
                investments: this.investments.length,
                lands: this.lands.length,
                transactions: this.transactions.length,
                recurringPayments: this.recurringPayments.length,
                nonRecurringPayments: this.nonRecurringPayments.length,
                invoices: this.invoices.length,
                supplierPayments: this.supplierPayments.length
            });
            
            // Process the loaded data into cash flow format
            this.processCashFlowData();
            
        } catch (error) {
            console.error('Error loading data from storage:', error);
            this.showError('Failed to load data from database');
            throw error;
        }
    }

    /**
     * Process all data into cash flow format
     */
    processCashFlowData() {
        console.log('Processing cash flow data...');
        console.log('Available data:', {
            investments: this.investments.length,
            lands: this.lands.length,
            transactions: this.transactions.length,
            recurringPayments: this.recurringPayments.length,
            nonRecurringPayments: this.nonRecurringPayments.length,
            invoices: this.invoices.length,
            supplierPayments: this.supplierPayments.length
        });
        
        // Initialize cash flow data structure
        this.cashFlowData = {
            capital: {
                inflows: {},
                outflows: {}
            },
            operational: {
                inflows: {},
                outflows: {}
            }
        };
        
        try {
            // Process capital transactions
            this.processCapitalTransactions();
            
            // Process operational cash flows
            this.processOperationalCashFlows();
            
            console.log('Cash flow data processed successfully:', this.cashFlowData);
            
            // Log summary of processed data
            const capitalInflowsCount = Object.keys(this.cashFlowData.capital.inflows).length;
            const capitalOutflowsCount = Object.keys(this.cashFlowData.capital.outflows).length;
            const operationalInflowsCount = Object.keys(this.cashFlowData.operational.inflows).length;
            const operationalOutflowsCount = Object.keys(this.cashFlowData.operational.outflows).length;
            
            console.log('Processed cash flow summary:', {
                capitalInflowsCount,
                capitalOutflowsCount,
                operationalInflowsCount,
                operationalOutflowsCount
            });
            
        } catch (error) {
            console.error('Error processing cash flow data:', error);
            // Ensure we still have a valid structure even if processing fails
            this.cashFlowData = {
                capital: {
                    inflows: {},
                    outflows: {}
                },
                operational: {
                    inflows: {},
                    outflows: {}
                }
            };
        }
    }

    /**
     * Process capital transactions from investments and lands
     */
    processCapitalTransactions() {
        console.log('Processing capital transactions...');
        console.log('Date range:', this.startDate, 'to', this.endDate);
        
        let processedCount = 0;
        
        // Convert start and end dates to Date objects for proper comparison
        const startDate = new Date(this.startDate);
        const endDate = new Date(this.endDate);
        
        this.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.transaction_date);
            
            // Check if transaction is within date range
            if (transactionDate >= startDate && transactionDate <= endDate) {
                console.log('Processing transaction:', transaction);
                
                const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                const amount = Math.abs(parseFloat(transaction.amount) || 0);
                
                console.log('Transaction details:', {
                    date: transactionDate,
                    monthKey,
                    amount,
                    type: transaction.transaction_type
                });
                
                if (transaction.transaction_type === 'buy') {
                    // Capital outflow (buying investment)
                    if (!this.cashFlowData.capital.outflows[monthKey]) {
                        this.cashFlowData.capital.outflows[monthKey] = 0;
                    }
                    this.cashFlowData.capital.outflows[monthKey] += amount;
                    console.log(`Added ${amount} to capital outflows for ${monthKey}`);
                } else if (transaction.transaction_type === 'sale') {
                    // Capital inflow (selling investment)
                    if (!this.cashFlowData.capital.inflows[monthKey]) {
                        this.cashFlowData.capital.inflows[monthKey] = 0;
                    }
                    this.cashFlowData.capital.inflows[monthKey] += amount;
                    console.log(`Added ${amount} to capital inflows for ${monthKey}`);
                }
                
                processedCount++;
            } else {
                console.log('Transaction outside date range:', {
                    date: transactionDate,
                    startDate: startDate,
                    endDate: endDate
                });
            }
        });
        
        console.log(`Processed ${processedCount} capital transactions out of ${this.transactions.length} total transactions`);
    }

    /**
     * Process operational cash flows
     */
    processOperationalCashFlows() {
        // Process recurring payments
        this.processRecurringPayments();
        
        // Process non-recurring payments
        this.nonRecurringPayments.forEach(payment => {
            const date = new Date(payment.payment_date);
            if (this.isDateInRange(date)) {
                const monthKey = this.getMonthKey(date);
                const amount = parseFloat(payment.amount);
                this.addCashFlow('operational', 'outflows', monthKey, amount);
            }
        });
        
        // Process invoices (incoming cash)
        this.invoices.forEach(invoice => {
            const date = new Date(invoice.due_date);
            if (this.isDateInRange(date)) {
                const monthKey = this.getMonthKey(date);
                const amount = parseFloat(invoice.amount);
                this.addCashFlow('operational', 'inflows', monthKey, amount);
            }
        });
        
        // Process supplier payments (outgoing cash)
        this.supplierPayments.forEach(payment => {
            const date = new Date(payment.due_date);
            if (this.isDateInRange(date)) {
                const monthKey = this.getMonthKey(date);
                const amount = parseFloat(payment.amount);
                this.addCashFlow('operational', 'outflows', monthKey, amount);
            }
        });
    }

    /**
     * Process recurring payments for the date range
     */
    processRecurringPayments() {
        this.recurringPayments.forEach(payment => {
            const dayOfMonth = parseInt(payment.day_of_month);
            const amount = parseFloat(payment.amount);
            
            // Generate instances for each month in the date range
            let currentDate = new Date(this.startDate);
            const endDate = new Date(this.endDate);
            
            while (currentDate <= endDate) {
                // Create payment date for this month
                const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
                
                // Handle month-end scenarios
                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                if (dayOfMonth > lastDayOfMonth) {
                    paymentDate.setDate(lastDayOfMonth);
                }
                
                if (paymentDate >= new Date(this.startDate) && paymentDate <= endDate) {
                    const monthKey = this.getMonthKey(paymentDate);
                    this.addCashFlow('operational', 'outflows', monthKey, amount);
                }
                
                // Move to next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        });
    }

    /**
     * Add cash flow entry
     */
    addCashFlow(type, direction, monthKey, amount) {
        if (!this.cashFlowData[type]) {
            this.cashFlowData[type] = { inflows: {}, outflows: {} };
        }
        if (!this.cashFlowData[type][direction]) {
            this.cashFlowData[type][direction] = {};
        }
        if (!this.cashFlowData[type][direction][monthKey]) {
            this.cashFlowData[type][direction][monthKey] = 0;
        }
        
        this.cashFlowData[type][direction][monthKey] += amount;
    }

    /**
     * Check if date is in range
     */
    isDateInRange(date) {
        const startDate = new Date(this.startDate);
        const endDate = new Date(this.endDate);
        return date >= startDate && date <= endDate;
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

        console.log('updateCalculations starting:', {
            openingBalance: this.openingBalance,
            monthsCount: months.length,
            months: months,
            cashFlowData: this.cashFlowData
        });

        // Calculate net flows and balances for each month
        months.forEach(monthKey => {
            // Get actual data from cash flow structure
            const capitalIn = this.cashFlowData.capital.inflows[monthKey] || 0;
            const capitalOut = this.cashFlowData.capital.outflows[monthKey] || 0;
            const operationalIn = this.cashFlowData.operational.inflows[monthKey] || 0;
            const operationalOut = this.cashFlowData.operational.outflows[monthKey] || 0;
            
            // Calculate net flow for this month
            const netFlow = (capitalIn + operationalIn) - (capitalOut + operationalOut);
            runningBalance += netFlow;
            totalNetFlow += netFlow;
            
            console.log(`updateCalculations - Month ${monthKey}:`, {
                capitalIn, capitalOut, operationalIn, operationalOut,
                netFlow, runningBalance, totalNetFlow
            });
            
            // Track minimum balance
            if (runningBalance < minBalance) {
                minBalance = runningBalance;
                minBalanceDate = monthKey;
            }
            
            // Store calculated values in monthlyData Map
            this.monthlyData.set(monthKey, {
                capitalIn: capitalIn,
                capitalOut: capitalOut,
                operationalIn: operationalIn,
                operationalOut: operationalOut,
                netFlow: netFlow,
                closingBalance: runningBalance
            });
        });

        console.log('updateCalculations completed:', {
            totalNetFlow,
            finalBalance: runningBalance,
            minBalance,
            minBalanceDate,
            monthlyDataSize: this.monthlyData.size
        });

        // Update displays
        this.updateMinimumBalanceDisplay();
        this.updateNetCashFlowDisplay();
    }

    updateMinimumBalanceDisplay() {
        const balanceAmountEl = document.querySelector('.balance-amount');
        const balanceTextEl = document.querySelector('.balance-text');
        
        if (!balanceAmountEl || !balanceTextEl) {
            console.log('Balance display elements not found');
            return;
        }
        
        // Calculate minimum balance and date
        const minBalanceData = this.calculateMinimumBalance();
        
        // Add updating animation
        balanceAmountEl.classList.add('updating');
        
        // Format and display the minimum balance
        const formattedAmount = this.formatCurrency(minBalanceData.amount);
        balanceAmountEl.textContent = formattedAmount;
        
        // Display the date when minimum occurs
        let dateText;
        if (minBalanceData.date) {
            const formattedDate = minBalanceData.date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            dateText = `Occurs on ${formattedDate}`;
        } else {
            dateText = 'No data available for selected period';
        }
        balanceTextEl.textContent = dateText;
        
        // Remove animation after a short delay
        setTimeout(() => {
            balanceAmountEl.classList.remove('updating');
        }, 300);
        
        console.log('Minimum Balance updated:', {
            amount: minBalanceData.amount,
            formatted: formattedAmount,
            date: minBalanceData.date ? minBalanceData.date.toISOString() : 'No date',
            dateText: dateText
        });
    }

    updateNetCashFlowDisplay() {
        const flowAmountEl = document.querySelector('.flow-amount');
        const flowTextEl = document.querySelector('.flow-text');
        
        if (!flowAmountEl || !flowTextEl) return;
        
        // Calculate net cash flow for the selected period
        const netCashFlow = this.calculateNetCashFlow();
        
        // Add updating animation
        flowAmountEl.classList.add('updating');
        
        // Format and display the net cash flow
        const formattedAmount = this.formatCurrency(netCashFlow);
        flowAmountEl.textContent = formattedAmount;
        
        // Format dates for display
        const startDate = new Date(this.startDate);
        const endDate = new Date(this.endDate);
        const formattedStartDate = startDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const formattedEndDate = endDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        // Update descriptive text with period information
        const flowDescription = `Net Cash Flow between ${formattedStartDate} and ${formattedEndDate}`;
        flowTextEl.textContent = flowDescription;
        
        // Remove animation after a short delay
        setTimeout(() => {
            flowAmountEl.classList.remove('updating');
        }, 300);
        
        console.log('Net Cash Flow updated:', {
            amount: netCashFlow,
            formatted: formattedAmount,
            period: `${formattedStartDate} to ${formattedEndDate}`
        });
    }

    calculateMinimumBalance() {
        const months = this.getMonthsInRange();
        let minBalance = this.openingBalance;
        let minDate = new Date(this.startDate);
        let runningBalance = this.openingBalance;
        
        console.log('Calculating minimum balance:', {
            openingBalance: this.openingBalance,
            monthsCount: months.length,
            dateRange: `${this.startDate} to ${this.endDate}`,
            cashFlowData: this.cashFlowData
        });
        
        // If no months in range, return opening balance
        if (months.length === 0) {
            console.log('No months in date range, returning opening balance');
            return {
                amount: minBalance,
                date: minDate
            };
        }
        
        // Track minimum including opening balance
        console.log(`Initial balance: ${runningBalance} (will be considered as minimum)`);
        
        // Iterate through each month to find minimum
        months.forEach((monthKey, index) => {
            // Get cash flow data for this month
            const capitalIn = this.cashFlowData.capital.inflows[monthKey] || 0;
            const capitalOut = this.cashFlowData.capital.outflows[monthKey] || 0;
            const operationalIn = this.cashFlowData.operational.inflows[monthKey] || 0;
            const operationalOut = this.cashFlowData.operational.outflows[monthKey] || 0;
            
            const monthlyFlow = (capitalIn + operationalIn) - (capitalOut + operationalOut);
            
            // Update running balance
            runningBalance += monthlyFlow;
            
            console.log(`Month ${monthKey} (${index + 1}/${months.length}):`, {
                capitalIn, 
                capitalOut, 
                operationalIn, 
                operationalOut,
                monthlyFlow, 
                runningBalance, 
                currentMin: minBalance,
                isNewMinimum: runningBalance < minBalance
            });
            
            // Check if this is the new minimum
            if (runningBalance < minBalance) {
                minBalance = runningBalance;
                // Parse month key to create date (end of month)
                const [year, month] = monthKey.split('-').map(Number);
                minDate = new Date(year, month - 1, new Date(year, month, 0).getDate()); // Last day of month
                console.log(`New minimum found: ${minBalance} on ${minDate.toDateString()}`);
            }
        });
        
        console.log('Final minimum balance calculation result:', {
            amount: minBalance,
            date: minDate.toDateString(),
            wasOpeningBalanceMinimum: minBalance === this.openingBalance
        });
        
        return {
            amount: minBalance,
            date: minDate
        };
    }

    calculateNetCashFlow() {
        const months = this.getMonthsInRange();
        let totalFlow = 0;
        
        console.log('Calculating net cash flow:', {
            monthsCount: months.length,
            cashFlowData: this.cashFlowData
        });
        
        months.forEach(monthKey => {
            const capitalIn = this.cashFlowData.capital.inflows[monthKey] || 0;
            const capitalOut = this.cashFlowData.capital.outflows[monthKey] || 0;
            const operationalIn = this.cashFlowData.operational.inflows[monthKey] || 0;
            const operationalOut = this.cashFlowData.operational.outflows[monthKey] || 0;
            
            const monthlyFlow = (capitalIn + operationalIn) - (capitalOut + operationalOut);
            totalFlow += monthlyFlow;
            
            console.log(`Month ${monthKey} cash flow:`, {
                capitalIn, capitalOut, operationalIn, operationalOut,
                monthlyFlow, totalFlow
            });
        });
        
        console.log('Total net cash flow calculated:', totalFlow);
        return totalFlow;
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
        } else if (row && row.classList.contains('net-cash-flow')) {
            td.classList.add('net-cash-flow-cell');
        } else if (row && row.classList.contains('closing-balance')) {
            td.classList.add('closing-balance-cell');
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

    async handleSectionChange(sectionId) {
        if (sectionId === 'cash-flow-planner') {
            console.log('Cash Flow Planner section activated');
            try {
                // Ensure database is connected
                if (!this.db) {
                    console.log('Database not connected, initializing...');
                    await this.initDatabase();
                }
                
                // Refresh data and display
                console.log('Refreshing data for Cash Flow Planner...');
                await this.refreshData();
                
                console.log('Cash Flow Planner section activation completed successfully');
            } catch (error) {
                console.error('Error activating Cash Flow Planner:', error);
                this.showError('Failed to load Cash Flow Planner data');
            }
        }
    }

    /**
     * Refresh data from database
     */
    async refreshData() {
        console.log('Refreshing Cash Flow Planner data...');
        
        try {
            // Ensure database connection is available
            if (!this.db) {
                console.log('Database connection not found, attempting to reconnect...');
                await this.initDatabase();
            }
            
            // Load data from storage
            await this.loadDataFromStorage();
            
            // Update calculations
            this.updateCalculations();
            
            // Re-render the table
            this.renderTable();
            
            // Update display cards
            this.updateDisplay();
            
            console.log('Cash Flow Planner data refreshed successfully');
            
        } catch (error) {
            console.error('Error refreshing Cash Flow Planner data:', error);
            this.showError('Failed to refresh cash flow data. Please try again.');
        }
    }

    /**
     * Listen for data changes from other components
     */
    setupDataChangeListeners() {
        // Listen for database changes
        document.addEventListener('dataUpdated', async () => {
            console.log('Data updated, refreshing cash flow planner');
            await this.refreshData();
        });

        // Listen for form submissions from the data entry section
        const forms = ['investment-form', 'land-form', 'recurring-payment-form', 
                      'nonrecurring-payment-form', 'invoice-form', 'supplier-form'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', async () => {
                    // Small delay to ensure data is saved first
                    setTimeout(async () => {
                        await this.refreshData();
                    }, 500);
                });
            }
        });
    }
}

// Initialize Cash Flow Planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize only when the cash flow planner section is active
    document.addEventListener('sectionChanged', async (event) => {
        if (event.detail.section === 'cash-flow-planner') {
            if (!window.cashFlowPlanner) {
                console.log('Creating new Cash Flow Planner instance');
                window.cashFlowPlanner = new CashFlowPlanner();
                await window.cashFlowPlanner.init();
            } else {
                console.log('Refreshing existing Cash Flow Planner instance');
                await window.cashFlowPlanner.refreshData();
            }
        }
    });
    
    // Initialize immediately if the section is already active
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'cash-flow-planner') {
        console.log('Cash Flow Planner section is already active, initializing immediately');
        window.cashFlowPlanner = new CashFlowPlanner();
        window.cashFlowPlanner.init();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CashFlowPlanner;
} 