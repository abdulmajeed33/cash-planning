// Tab functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Tab functionality is now handled in investment-chart.js
    
    // Initialize the database before loading data
    await initDatabase();
    
    // Initial data load
    await Promise.all([
        loadInvestments(),
        loadLands()
    ]);
});

// IndexedDB configuration
const DB_NAME = 'investmentTracker';
const DB_VERSION = 1;
const STORES = {
    investments: 'investments',
    lands: 'lands',
    transactions: 'transactions'
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
        const type = e.target.closest('table').id === 'investments-table' ? 'investments' : 'lands';
        
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                // Delete from IndexedDB
                await deleteData(STORES[type], id);
                
                // Reload the data
                type === 'investments' ? loadInvestments() : loadLands();
                
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

// Add event handler for edit buttons (not implemented yet)
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const id = parseInt(e.target.dataset.id);
        const type = e.target.closest('table').id === 'investments-table' ? 'investments' : 'lands';
        
        try {
            // Get the item from IndexedDB
            const db = await openDatabase();
            const transaction = db.transaction([STORES[type]], 'readonly');
            const store = transaction.objectStore(STORES[type]);
            const request = store.get(id);
            
            request.onsuccess = function(event) {
                const item = event.target.result;
                if (item) {
                    // Populate the form with the item's data
                    if (type === 'investments') {
                        populateInvestmentForm(item);
                    } else {
                        populateLandForm(item);
                    }
                } else {
                    console.error(`Item with ID ${id} not found in ${type}`);
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
});

// Helper function to open the database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('investmentTracker', 1);
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