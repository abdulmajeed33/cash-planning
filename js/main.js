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
        // Add investment to IndexedDB
        await addData(STORES.investments, formData);
        
        // Also add to the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.addInvestment === 'function') {
            await window.investmentChart.addInvestment(formData);
        }
        
        investmentForm.reset();
        loadInvestments();
        
        // Refresh the investment chart if it's visible
        if (document.getElementById('investment-timeline').classList.contains('active')) {
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        }
    } catch (error) {
        console.error('Error adding investment:', error);
        alert('Failed to add investment. Please try again.');
    }
});

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
        // Add land to IndexedDB
        await addData(STORES.lands, formData);
        
        // Also add to the investment chart's data
        if (window.investmentChart && typeof window.investmentChart.addLand === 'function') {
            await window.investmentChart.addLand(formData);
        }
        
        landForm.reset();
        loadLands();
        
        // Refresh the investment chart if it's visible
        if (document.getElementById('investment-timeline').classList.contains('active')) {
            if (window.investmentChart && typeof window.investmentChart.reloadData === 'function') {
                window.investmentChart.reloadData();
            }
        }
    } catch (error) {
        console.error('Error adding land:', error);
        alert('Failed to add land. Please try again.');
    }
});

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
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const id = parseInt(e.target.dataset.id);
        const type = e.target.closest('table').id === 'investments-table' ? 'investments' : 'lands';
        
        alert(`Edit functionality for ${type} with ID ${id} is not implemented yet.`);
    }
});