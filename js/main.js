// Tab functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Tab functionality is now handled in investment-chart.js
    
    // Set up accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    // Initialize toggle icons based on initial state
    accordionHeaders.forEach(header => {
        const content = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        // Set initial icon state
        if (content.classList.contains('active')) {
            toggleIcon.textContent = '↑'; // Up arrow for open accordion
        } else {
            toggleIcon.textContent = '→'; // Right arrow for closed accordion
        }
        
        header.addEventListener('click', function() {
            // Toggle active class on the header
            this.classList.toggle('active');
            
            // Toggle active class on the content
            const content = this.nextElementSibling;
            content.classList.toggle('active');
            
            // Update the toggle icon - correct way
            const toggleIcon = this.querySelector('.toggle-icon');
            if (content.classList.contains('active')) {
                toggleIcon.textContent = '↑'; // Up arrow when open
            } else {
                toggleIcon.textContent = '→'; // Right arrow when closed
            }
        });
    });
    
    // Set up sub-accordion functionality
    const subAccordionHeaders = document.querySelectorAll('.sub-accordion-header');
    
    // Initialize toggle icons based on initial state
    subAccordionHeaders.forEach(header => {
        const content = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        // Set initial icon state
        if (content.classList.contains('active')) {
            toggleIcon.textContent = '↑'; // Up arrow for open accordion
        } else {
            toggleIcon.textContent = '→'; // Right arrow for closed accordion
        }
        
        header.addEventListener('click', function() {
            // Toggle active class on the header
            this.classList.toggle('active');
            
            // Toggle active class on the content
            const content = this.nextElementSibling;
            content.classList.toggle('active');
            
            // Update the toggle icon
            const toggleIcon = this.querySelector('.toggle-icon');
            if (content.classList.contains('active')) {
                toggleIcon.textContent = '↑'; // Up arrow when open
            } else {
                toggleIcon.textContent = '→'; // Right arrow when closed
            }
        });
    });
    
    // Initialize the database before loading data
    await initDatabase();
    
    // Load opening balances from database and update input fields
    try {
        const investmentOpeningBalance = await loadSetting('openingBalance', 50000);
        const cashflowOpeningBalance = await loadSetting('cashflowOpeningBalance', 50000);
        
        // Update investment opening balance input
        const investmentBalanceInput = document.getElementById('opening-balance');
        if (investmentBalanceInput) {
            investmentBalanceInput.value = investmentOpeningBalance;
        }
        
        // Update cashflow opening balance input
        const cashflowBalanceInput = document.getElementById('cashflow-opening-balance');
        if (cashflowBalanceInput) {
            cashflowBalanceInput.value = cashflowOpeningBalance;
        }
        
        console.log('Opening balances loaded from database');
    } catch (error) {
        console.error('Error loading opening balances:', error);
    }

    // Initial data load
    await Promise.all([
        loadInvestments(),
        loadLands(),
        loadRecurringPayments(),
        loadNonRecurringPayments(),
        loadInvoices(),
        loadSupplierPayments()
    ]);
});

// IndexedDB configuration
const DB_NAME = 'investmentTracker';
const DB_VERSION = 3; // Increased version for schema update to include settings store
const STORES = {
    investments: 'investments',
    lands: 'lands',
    transactions: 'transactions',
    recurringPayments: 'recurringPayments',
    nonRecurringPayments: 'nonRecurringPayments',
    invoices: 'invoices',
    supplierPayments: 'supplierPayments',
    settings: 'settings' // New store for configuration data
};

let db;

// Initialize the database
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = event => {
            console.error('IndexedDB error:', event.target.error);
            reject('Error opening database');
        };
        
        request.onsuccess = event => {
            db = event.target.result;
            console.log('Database initialized successfully in main.js');
            resolve(db);
        };
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains(STORES.investments)) {
                const investmentsStore = db.createObjectStore(STORES.investments, { keyPath: 'id', autoIncrement: true });
                investmentsStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.lands)) {
                const landsStore = db.createObjectStore(STORES.lands, { keyPath: 'id', autoIncrement: true });
                landsStore.createIndex('land_name', 'land_name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.transactions)) {
                const transactionsStore = db.createObjectStore(STORES.transactions, { keyPath: 'id', autoIncrement: true });
                transactionsStore.createIndex('entity_id', 'entity_id', { unique: false });
                transactionsStore.createIndex('transaction_date', 'transaction_date', { unique: false });
            }
            
            // New stores for operational cash flows
            if (!db.objectStoreNames.contains(STORES.recurringPayments)) {
                const recurringPaymentsStore = db.createObjectStore(STORES.recurringPayments, { keyPath: 'id', autoIncrement: true });
                recurringPaymentsStore.createIndex('description', 'description', { unique: false });
                recurringPaymentsStore.createIndex('day_of_month', 'day_of_month', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.nonRecurringPayments)) {
                const nonRecurringPaymentsStore = db.createObjectStore(STORES.nonRecurringPayments, { keyPath: 'id', autoIncrement: true });
                nonRecurringPaymentsStore.createIndex('description', 'description', { unique: false });
                nonRecurringPaymentsStore.createIndex('payment_date', 'payment_date', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.invoices)) {
                const invoicesStore = db.createObjectStore(STORES.invoices, { keyPath: 'id', autoIncrement: true });
                invoicesStore.createIndex('invoice_code', 'invoice_code', { unique: false });
                invoicesStore.createIndex('client_name', 'client_name', { unique: false });
                invoicesStore.createIndex('due_date', 'due_date', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.supplierPayments)) {
                const supplierPaymentsStore = db.createObjectStore(STORES.supplierPayments, { keyPath: 'id', autoIncrement: true });
                supplierPaymentsStore.createIndex('invoice_code', 'invoice_code', { unique: false });
                supplierPaymentsStore.createIndex('supplier_name', 'supplier_name', { unique: false });
                supplierPaymentsStore.createIndex('due_date', 'due_date', { unique: false });
            }
            
            // New store for settings/configuration
            if (!db.objectStoreNames.contains(STORES.settings)) {
                const settingsStore = db.createObjectStore(STORES.settings, { keyPath: 'key' });
                console.log('Settings store created');
            }
            
            console.log('Database schema created in main.js');
        };
    });
}

// Generic function to get all data from a store
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.getAll();
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            console.error(`Error getting data from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Generic function to add data to a store
function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.add(data);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            console.error(`Error adding data to ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Generic function to update data in a store
function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(data);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            console.error(`Error updating data in ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Generic function to delete data from a store
function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(id);
        
        request.onsuccess = event => {
            resolve();
        };
        
        request.onerror = event => {
            console.error(`Error deleting data from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Utility functions
const formatCurrency = function(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

const formatPercentage = function(value) {
    return `${value}%`;
};

// Investment management
const investmentForm = document.getElementById('investment-form');
const investmentsTable = document.getElementById('investments-table').querySelector('tbody');

async function loadInvestments() {
    try {
        // Get investments from IndexedDB
        const investments = await getAllData(STORES.investments);
        investmentsTable.innerHTML = '';
        investments.forEach(function(investment) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${investment.name}</td>
                <td>${formatCurrency(investment.size)}</td>
                <td>${formatPercentage(investment.share_percentage)}</td>
                <td>${formatPercentage(investment.debt_percentage)}</td>
                <td>${formatCurrency(investment.investment_amount)}</td>
                <td>${formatCurrency(investment.debt_amount)}</td>
                <td>${formatCurrency(investment.cash_investment)}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${investment.id}">Edit</button>
                    <button class="delete-btn" data-id="${investment.id}">Delete</button>
                </td>
            `;
            investmentsTable.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading investments:', error);
    }
}

investmentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    // Calculate investment amount based on size and share percentage
    const size = parseFloat(document.getElementById('inv-size').value);
    const sharePercentage = parseFloat(document.getElementById('inv-share').value);
    const debtPercentage = parseFloat(document.getElementById('inv-debt').value);
    
    const investmentAmount = size * (sharePercentage / 100);
    const debtAmount = investmentAmount * (debtPercentage / 100);
    const cashInvestment = investmentAmount - debtAmount;
    
    const formData = {
        name: document.getElementById('inv-name').value,
        size: size.toString(),
        share_percentage: sharePercentage.toString(),
        investment_amount: investmentAmount.toString(),
        debt_percentage: debtPercentage.toString(),
        debt_amount: debtAmount.toString(),
        cash_investment: cashInvestment.toString()
    };

    try {
        const investmentIdField = document.querySelector('input[name="investment-id"]');
        
        if (investmentIdField && investmentIdField.value) {
            // Update existing investment
            const id = parseInt(investmentIdField.value);
            await updateInvestment(id, formData);
            resetInvestmentForm();
        } else {
            // Add new investment
            // Add date_added field for new investments
            formData.date_added = new Date().toISOString();
            await addData(STORES.investments, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadInvestments();
    } catch (error) {
        console.error('Error managing investment:', error);
        alert('Failed to save investment. Please try again.');
    }
});

// Function to update an existing investment
async function updateInvestment(id, formData) {
    // First get the existing investment to preserve the date_added
    const transaction = db.transaction(STORES.investments, 'readonly');
    const store = transaction.objectStore(STORES.investments);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingInvestment = event.target.result;
            if (existingInvestment) {
                // Preserve the original date_added
                formData.date_added = existingInvestment.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.investments, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Investment with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Land management
const landForm = document.getElementById('land-form');
const landsTable = document.getElementById('lands-table').querySelector('tbody');

async function loadLands() {
    try {
        // Get lands from IndexedDB
        const lands = await getAllData(STORES.lands);
        landsTable.innerHTML = '';
        lands.forEach(function(land) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${land.land_name}</td>
                <td>${land.size_sqm}</td>
                <td>${formatCurrency(land.price_per_sqm)}</td>
                <td>${formatPercentage(land.debt_percentage)}</td>
                <td>${formatCurrency(land.value)}</td>
                <td>${formatCurrency(land.debt_amount)}</td>
                <td>${formatCurrency(land.cash_injection)}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${land.id}">Edit</button>
                    <button class="delete-btn" data-id="${land.id}">Delete</button>
                </td>
            `;
            landsTable.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading lands:', error);
    }
}

landForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    // Calculate values based on inputs
    const sizeSqm = parseFloat(document.getElementById('land-size').value);
    const pricePerSqm = parseFloat(document.getElementById('land-price').value);
    const debtPercentage = parseFloat(document.getElementById('land-debt').value);
    
    const value = sizeSqm * pricePerSqm;
    const debtAmount = value * (debtPercentage / 100);
    const cashInjection = value - debtAmount;
    
    const formData = {
        land_name: document.getElementById('land-name').value,
        size_sqm: sizeSqm.toString(),
        price_per_sqm: pricePerSqm.toString(),
        value: value.toString(),
        debt_percentage: debtPercentage.toString(),
        debt_amount: debtAmount.toString(),
        cash_injection: cashInjection.toString()
    };

    try {
        const landIdField = document.querySelector('input[name="land-id"]');
        
        if (landIdField && landIdField.value) {
            // Update existing land
            const id = parseInt(landIdField.value);
            await updateLand(id, formData);
            resetLandForm();
        } else {
            // Add new land
            // Add date_added field for new lands
            formData.date_added = new Date().toISOString();
            await addData(STORES.lands, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadLands();
    } catch (error) {
        console.error('Error managing land:', error);
        alert('Failed to save land. Please try again.');
    }
});

// Function to update an existing land
async function updateLand(id, formData) {
    // First get the existing land to preserve the date_added
    const transaction = db.transaction(STORES.lands, 'readonly');
    const store = transaction.objectStore(STORES.lands);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingLand = event.target.result;
            if (existingLand) {
                // Preserve the original date_added
                formData.date_added = existingLand.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.lands, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Land with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Delete handlers
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        let storeName;
        
        // Determine which store to use based on the closest table ID
        const tableId = e.target.closest('table').id;
        if (tableId === 'investments-table') {
            storeName = STORES.investments;
        } else if (tableId === 'lands-table') {
            storeName = STORES.lands;
        } else if (tableId === 'recurring-payments-table') {
            storeName = STORES.recurringPayments;
        } else if (tableId === 'nonrecurring-payments-table') {
            storeName = STORES.nonRecurringPayments;
        } else if (tableId === 'invoices-table') {
            storeName = STORES.invoices;
        } else if (tableId === 'suppliers-table') {
            storeName = STORES.supplierPayments;
        }
        
        if (storeName && confirm('Are you sure you want to delete this item?')) {
            try {
                // Delete from IndexedDB
                await deleteData(storeName, id);
                
                // Reload the appropriate data
                if (storeName === STORES.investments) {
                    loadInvestments();
                } else if (storeName === STORES.lands) {
                    loadLands();
                } else if (storeName === STORES.recurringPayments) {
                    loadRecurringPayments();
                } else if (storeName === STORES.nonRecurringPayments) {
                    loadNonRecurringPayments();
                } else if (storeName === STORES.invoices) {
                    loadInvoices();
                } else if (storeName === STORES.supplierPayments) {
                    loadSupplierPayments();
                }
                
                // Refresh the investment chart if it's visible
                if (document.getElementById('investment-timeline').classList.contains('active')) {
                    if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                        window.investmentChart.reloadData();
                    }
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item. Please try again.');
            }
        }
    }
});

// Add event handler for edit buttons
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const id = parseInt(e.target.dataset.id);
        let storeName, populateFunction;
        
        // Determine which store to use based on the closest table ID
        const tableId = e.target.closest('table').id;
        if (tableId === 'investments-table') {
            storeName = STORES.investments;
            populateFunction = populateInvestmentForm;
        } else if (tableId === 'lands-table') {
            storeName = STORES.lands;
            populateFunction = populateLandForm;
        } else if (tableId === 'recurring-payments-table') {
            storeName = STORES.recurringPayments;
            populateFunction = populateRecurringPaymentForm;
        } else if (tableId === 'nonrecurring-payments-table') {
            storeName = STORES.nonRecurringPayments;
            populateFunction = populateNonRecurringPaymentForm;
        } else if (tableId === 'invoices-table') {
            storeName = STORES.invoices;
            populateFunction = populateInvoiceForm;
        } else if (tableId === 'suppliers-table') {
            storeName = STORES.supplierPayments;
            populateFunction = populateSupplierForm;
        }
        
        if (storeName && populateFunction) {
            try {
                // Get the item from IndexedDB
                const db = await openDatabase();
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = function(event) {
                    const item = event.target.result;
                    if (item) {
                        // Populate the form with the item's data
                        populateFunction(item);
                    } else {
                        console.error(`Item with ID ${id} not found in ${storeName}`);
                        alert(`Item not found. Please refresh the page and try again.`);
                    }
                };
                
                request.onerror = function(event) {
                    console.error('Error getting item:', event.target.error);
                    alert('Failed to get item. Please try again.');
                };
            } catch (error) {
                console.error('Error in edit process:', error);
                alert('An error occurred. Please try again.');
            }
        }
    }
});

// Helper function to open the database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function(event) {
            reject(event.target.error);
        };
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
    });
}

// Function to populate the investment form with existing data
function populateInvestmentForm(investment) {
    const form = document.getElementById('investment-form');
    
    document.getElementById('inv-name').value = investment.name;
    document.getElementById('inv-size').value = investment.size;
    document.getElementById('inv-share').value = investment.share_percentage;
    document.getElementById('inv-debt').value = investment.debt_percentage;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="investment-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'investment-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="investment-id"]').value = investment.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Investment';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetInvestmentForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to populate the land form with existing data
function populateLandForm(land) {
    const form = document.getElementById('land-form');
    
    document.getElementById('land-name').value = land.land_name;
    document.getElementById('land-size').value = land.size_sqm;
    document.getElementById('land-price').value = land.price_per_sqm;
    document.getElementById('land-debt').value = land.debt_percentage;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="land-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'land-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="land-id"]').value = land.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Land';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetLandForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to reset the investment form to add mode
function resetInvestmentForm() {
    const form = document.getElementById('investment-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="investment-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Investment';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Function to reset the land form to add mode
function resetLandForm() {
    const form = document.getElementById('land-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="land-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Land';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Helper function to get the last day of a month
function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Recurring Payments Management
const recurringPaymentForm = document.getElementById('recurring-payment-form');
const recurringPaymentsTable = document.getElementById('recurring-payments-table').querySelector('tbody');

async function loadRecurringPayments() {
    try {
        // Get recurring payments from IndexedDB
        const payments = await getAllData(STORES.recurringPayments);
        recurringPaymentsTable.innerHTML = '';
        payments.forEach(function(payment) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment.description}</td>
                <td>${formatCurrency(-Math.abs(payment.amount))}</td>
                <td>${payment.day_of_month}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${payment.id}">Edit</button>
                    <button class="delete-btn" data-id="${payment.id}">Delete</button>
                </td>
            `;
            recurringPaymentsTable.appendChild(tr);
        });
        
        // Set up edit and delete buttons for recurring payments
        recurringPaymentsTable.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                const payment = await getRecurringPaymentById(id);
                populateRecurringPaymentForm(payment);
            });
        });
        
        recurringPaymentsTable.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this recurring payment?')) {
                    const id = parseInt(this.dataset.id);
                    await deleteData(STORES.recurringPayments, id);
                    loadRecurringPayments();
                    
                    // Also update the investment chart's data
                    if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                        window.investmentChart.reloadData();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading recurring payments:', error);
    }
}

recurringPaymentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const amount = parseFloat(document.getElementById('recurring-amount').value);
    const dayOfMonth = parseInt(document.getElementById('recurring-day').value);
    
    const formData = {
        description: document.getElementById('recurring-description').value,
        amount: Math.abs(amount).toString(), // Store as absolute value, will be displayed as negative
        day_of_month: dayOfMonth.toString()
    };

    try {
        const paymentIdField = document.querySelector('input[name="recurring-payment-id"]');
        
        if (paymentIdField && paymentIdField.value) {
            // Update existing payment
            const id = parseInt(paymentIdField.value);
            await updateRecurringPayment(id, formData);
            resetRecurringPaymentForm();
        } else {
            // Add new payment
            formData.date_added = new Date().toISOString();
            await addData(STORES.recurringPayments, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadRecurringPayments();
    } catch (error) {
        console.error('Error managing recurring payment:', error);
        alert('Failed to save recurring payment. Please try again.');
    }
});

// Function to get a recurring payment by ID
async function getRecurringPaymentById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.recurringPayments, 'readonly');
        const store = transaction.objectStore(STORES.recurringPayments);
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Function to update an existing recurring payment
async function updateRecurringPayment(id, formData) {
    // First get the existing payment to preserve the date_added
    const transaction = db.transaction(STORES.recurringPayments, 'readonly');
    const store = transaction.objectStore(STORES.recurringPayments);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingPayment = event.target.result;
            if (existingPayment) {
                // Preserve the original date_added
                formData.date_added = existingPayment.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.recurringPayments, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Recurring payment with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Function to populate the recurring payment form with existing data
function populateRecurringPaymentForm(payment) {
    const form = document.getElementById('recurring-payment-form');
    
    document.getElementById('recurring-description').value = payment.description;
    document.getElementById('recurring-amount').value = payment.amount;
    document.getElementById('recurring-day').value = payment.day_of_month;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="recurring-payment-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'recurring-payment-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="recurring-payment-id"]').value = payment.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Recurring Payment';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetRecurringPaymentForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to reset the recurring payment form to add mode
function resetRecurringPaymentForm() {
    const form = document.getElementById('recurring-payment-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="recurring-payment-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Recurring Payment';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Non-Recurring Payments Management
const nonRecurringPaymentForm = document.getElementById('nonrecurring-payment-form');
const nonRecurringPaymentsTable = document.getElementById('nonrecurring-payments-table').querySelector('tbody');

async function loadNonRecurringPayments() {
    try {
        // Get non-recurring payments from IndexedDB
        const payments = await getAllData(STORES.nonRecurringPayments);
        nonRecurringPaymentsTable.innerHTML = '';
        payments.forEach(function(payment) {
            const formattedDate = new Date(payment.payment_date).toLocaleDateString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment.description}</td>
                <td>${formatCurrency(-Math.abs(payment.amount))}</td>
                <td>${formattedDate}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${payment.id}">Edit</button>
                    <button class="delete-btn" data-id="${payment.id}">Delete</button>
                </td>
            `;
            nonRecurringPaymentsTable.appendChild(tr);
        });
        
        // Set up edit and delete buttons for non-recurring payments
        nonRecurringPaymentsTable.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                const payment = await getNonRecurringPaymentById(id);
                populateNonRecurringPaymentForm(payment);
            });
        });
        
        nonRecurringPaymentsTable.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this payment?')) {
                    const id = parseInt(this.dataset.id);
                    await deleteData(STORES.nonRecurringPayments, id);
                    loadNonRecurringPayments();
                    
                    // Also update the investment chart's data
                    if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                        window.investmentChart.reloadData();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading non-recurring payments:', error);
    }
}

nonRecurringPaymentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const amount = parseFloat(document.getElementById('nonrecurring-amount').value);
    
    const formData = {
        description: document.getElementById('nonrecurring-description').value,
        amount: Math.abs(amount).toString(), // Store as absolute value, will be displayed as negative
        payment_date: document.getElementById('nonrecurring-date').value
    };

    try {
        const paymentIdField = document.querySelector('input[name="nonrecurring-payment-id"]');
        
        if (paymentIdField && paymentIdField.value) {
            // Update existing payment
            const id = parseInt(paymentIdField.value);
            await updateNonRecurringPayment(id, formData);
            resetNonRecurringPaymentForm();
        } else {
            // Add new payment
            formData.date_added = new Date().toISOString();
            await addData(STORES.nonRecurringPayments, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadNonRecurringPayments();
    } catch (error) {
        console.error('Error managing non-recurring payment:', error);
        alert('Failed to save payment. Please try again.');
    }
});

// Function to get a non-recurring payment by ID
async function getNonRecurringPaymentById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.nonRecurringPayments, 'readonly');
        const store = transaction.objectStore(STORES.nonRecurringPayments);
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Function to update an existing non-recurring payment
async function updateNonRecurringPayment(id, formData) {
    // First get the existing payment to preserve the date_added
    const transaction = db.transaction(STORES.nonRecurringPayments, 'readonly');
    const store = transaction.objectStore(STORES.nonRecurringPayments);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingPayment = event.target.result;
            if (existingPayment) {
                // Preserve the original date_added
                formData.date_added = existingPayment.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.nonRecurringPayments, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Non-recurring payment with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Function to populate the non-recurring payment form with existing data
function populateNonRecurringPaymentForm(payment) {
    const form = document.getElementById('nonrecurring-payment-form');
    
    document.getElementById('nonrecurring-description').value = payment.description;
    document.getElementById('nonrecurring-amount').value = payment.amount;
    document.getElementById('nonrecurring-date').value = payment.payment_date;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="nonrecurring-payment-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'nonrecurring-payment-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="nonrecurring-payment-id"]').value = payment.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Payment';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetNonRecurringPaymentForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to reset the non-recurring payment form to add mode
function resetNonRecurringPaymentForm() {
    const form = document.getElementById('nonrecurring-payment-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="nonrecurring-payment-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Payment';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Invoice Collection Management
const invoiceForm = document.getElementById('invoice-form');
const invoicesTable = document.getElementById('invoices-table').querySelector('tbody');

async function loadInvoices() {
    try {
        // Get invoices from IndexedDB
        const invoices = await getAllData(STORES.invoices);
        invoicesTable.innerHTML = '';
        invoices.forEach(function(invoice) {
            const formattedDate = new Date(invoice.due_date).toLocaleDateString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${invoice.invoice_code}</td>
                <td>${invoice.client_name}</td>
                <td>${formatCurrency(invoice.amount)}</td>
                <td>${formattedDate}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${invoice.id}">Edit</button>
                    <button class="delete-btn" data-id="${invoice.id}">Delete</button>
                </td>
            `;
            invoicesTable.appendChild(tr);
        });
        
        // Set up edit and delete buttons for invoices
        invoicesTable.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                const invoice = await getInvoiceById(id);
                populateInvoiceForm(invoice);
            });
        });
        
        invoicesTable.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this invoice?')) {
                    const id = parseInt(this.dataset.id);
                    await deleteData(STORES.invoices, id);
                    loadInvoices();
                    
                    // Also update the investment chart's data
                    if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                        window.investmentChart.reloadData();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

invoiceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const amount = parseFloat(document.getElementById('invoice-amount').value);
    
    const formData = {
        invoice_code: document.getElementById('invoice-code').value,
        client_name: document.getElementById('invoice-client').value,
        amount: amount.toString(),
        due_date: document.getElementById('invoice-due-date').value
    };

    try {
        const invoiceIdField = document.querySelector('input[name="invoice-id"]');
        
        if (invoiceIdField && invoiceIdField.value) {
            // Update existing invoice
            const id = parseInt(invoiceIdField.value);
            await updateInvoice(id, formData);
            resetInvoiceForm();
        } else {
            // Add new invoice
            formData.date_added = new Date().toISOString();
            await addData(STORES.invoices, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadInvoices();
    } catch (error) {
        console.error('Error managing invoice:', error);
        alert('Failed to save invoice. Please try again.');
    }
});

// Function to get an invoice by ID
async function getInvoiceById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.invoices, 'readonly');
        const store = transaction.objectStore(STORES.invoices);
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Function to update an existing invoice
async function updateInvoice(id, formData) {
    // First get the existing invoice to preserve the date_added
    const transaction = db.transaction(STORES.invoices, 'readonly');
    const store = transaction.objectStore(STORES.invoices);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingInvoice = event.target.result;
            if (existingInvoice) {
                // Preserve the original date_added
                formData.date_added = existingInvoice.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.invoices, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Invoice with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Function to populate the invoice form with existing data
function populateInvoiceForm(invoice) {
    const form = document.getElementById('invoice-form');
    
    document.getElementById('invoice-code').value = invoice.invoice_code;
    document.getElementById('invoice-client').value = invoice.client_name;
    document.getElementById('invoice-amount').value = invoice.amount;
    document.getElementById('invoice-due-date').value = invoice.due_date;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="invoice-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'invoice-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="invoice-id"]').value = invoice.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Invoice';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetInvoiceForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to reset the invoice form to add mode
function resetInvoiceForm() {
    const form = document.getElementById('invoice-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="invoice-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Invoice';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Supplier Payments Management
const supplierForm = document.getElementById('supplier-form');
const suppliersTable = document.getElementById('suppliers-table').querySelector('tbody');

async function loadSupplierPayments() {
    try {
        // Get supplier payments from IndexedDB
        const payments = await getAllData(STORES.supplierPayments);
        suppliersTable.innerHTML = '';
        payments.forEach(function(payment) {
            const formattedDate = new Date(payment.due_date).toLocaleDateString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment.invoice_code}</td>
                <td>${payment.supplier_name}</td>
                <td>${formatCurrency(-Math.abs(payment.amount))}</td>
                <td>${formattedDate}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${payment.id}">Edit</button>
                    <button class="delete-btn" data-id="${payment.id}">Delete</button>
                </td>
            `;
            suppliersTable.appendChild(tr);
        });
        
        // Set up edit and delete buttons for supplier payments
        suppliersTable.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                const payment = await getSupplierPaymentById(id);
                populateSupplierForm(payment);
            });
        });
        
        suppliersTable.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this supplier payment?')) {
                    const id = parseInt(this.dataset.id);
                    await deleteData(STORES.supplierPayments, id);
                    loadSupplierPayments();
                    
                    // Also update the investment chart's data
                    if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                        window.investmentChart.reloadData();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading supplier payments:', error);
    }
}

supplierForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const amount = parseFloat(document.getElementById('supplier-amount').value);
    
    const formData = {
        invoice_code: document.getElementById('supplier-invoice-code').value,
        supplier_name: document.getElementById('supplier-name').value,
        amount: Math.abs(amount).toString(), // Store as absolute value, will be displayed as negative
        due_date: document.getElementById('supplier-due-date').value
    };

    try {
        const supplierIdField = document.querySelector('input[name="supplier-id"]');
        
        if (supplierIdField && supplierIdField.value) {
            // Update existing supplier payment
            const id = parseInt(supplierIdField.value);
            await updateSupplierPayment(id, formData);
            resetSupplierForm();
        } else {
            // Add new supplier payment
            formData.date_added = new Date().toISOString();
            await addData(STORES.supplierPayments, formData);
        }
        
        // Also update the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
            window.investmentChart.reloadData();
        }
        
        loadSupplierPayments();
    } catch (error) {
        console.error('Error managing supplier payment:', error);
        alert('Failed to save supplier payment. Please try again.');
    }
});

// Function to get a supplier payment by ID
async function getSupplierPaymentById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.supplierPayments, 'readonly');
        const store = transaction.objectStore(STORES.supplierPayments);
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        
        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Function to update an existing supplier payment
async function updateSupplierPayment(id, formData) {
    // First get the existing supplier payment to preserve the date_added
    const transaction = db.transaction(STORES.supplierPayments, 'readonly');
    const store = transaction.objectStore(STORES.supplierPayments);
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = async function(event) {
            const existingPayment = event.target.result;
            if (existingPayment) {
                // Preserve the original date_added
                formData.date_added = existingPayment.date_added;
                // Add the ID to ensure we update the correct record
                formData.id = id;
                
                try {
                    await updateData(STORES.supplierPayments, formData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Supplier payment with ID ${id} not found`));
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Function to populate the supplier form with existing data
function populateSupplierForm(payment) {
    const form = document.getElementById('supplier-form');
    
    document.getElementById('supplier-invoice-code').value = payment.invoice_code;
    document.getElementById('supplier-name').value = payment.supplier_name;
    document.getElementById('supplier-amount').value = payment.amount;
    document.getElementById('supplier-due-date').value = payment.due_date;
    
    // Store the ID in a hidden field for update
    if (!form.querySelector('input[name="supplier-id"]')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.name = 'supplier-id';
        form.appendChild(idField);
    }
    form.querySelector('input[name="supplier-id"]').value = payment.id;
    
    // Change the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Supplier Payment';
    
    // Add a cancel button if not exists
    if (!form.querySelector('button.cancel-edit')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-edit';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = resetSupplierForm;
        submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    }
}

// Function to reset the supplier form to add mode
function resetSupplierForm() {
    const form = document.getElementById('supplier-form');
    form.reset();
    
    // Remove the hidden ID field if it exists
    const idField = form.querySelector('input[name="supplier-id"]');
    if (idField) idField.value = '';
    
    // Reset the submit button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Add Supplier Payment';
    
    // Remove the cancel button
    const cancelButton = form.querySelector('button.cancel-edit');
    if (cancelButton) cancelButton.remove();
}

// Settings management functions
async function saveSetting(key, value) {
    try {
        const settingData = { key: key, value: value, updated: new Date().toISOString() };
        await updateData(STORES.settings, settingData);
        console.log(`Setting saved: ${key} = ${value}`);
    } catch (error) {
        console.error('Error saving setting:', error);
        throw error;
    }
}

async function loadSetting(key, defaultValue = null) {
    try {
        const transaction = db.transaction(STORES.settings, 'readonly');
        const store = transaction.objectStore(STORES.settings);
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            
            request.onsuccess = event => {
                const result = event.target.result;
                if (result) {
                    console.log(`Setting loaded: ${key} = ${result.value}`);
                    resolve(result.value);
                } else {
                    console.log(`Setting not found: ${key}, using default: ${defaultValue}`);
                    resolve(defaultValue);
                }
            };
            
            request.onerror = event => {
                console.error(`Error loading setting ${key}:`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Error loading setting:', error);
        return defaultValue;
    }
}

async function loadAllSettings() {
    try {
        const settings = await getAllData(STORES.settings);
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        console.log('All settings loaded:', settingsObj);
        return settingsObj;
    } catch (error) {
        console.error('Error loading all settings:', error);
        return {};
    }
}