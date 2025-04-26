// Tab functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Tab functionality is now handled in investment-chart.js
    
    // Initial data load
    await Promise.all([
        loadInvestments(),
        loadLands()
    ]);
});

// API endpoints
const API = {
    investments: '/api/investments',
    lands: '/api/lands'
};

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
        const response = await fetch(API.investments);
        const investments = await response.json();
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
    const formData = {
        name: document.getElementById('inv-name').value,
        size: parseFloat(document.getElementById('inv-size').value),
        share_percentage: parseFloat(document.getElementById('inv-share').value),
        debt_percentage: parseFloat(document.getElementById('inv-debt').value)
    };

    try {
        const response = await fetch(API.investments, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to add investment');
        }

        investmentForm.reset();
        loadInvestments();
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
        const response = await fetch(API.lands);
        const lands = await response.json();
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
    const formData = {
        land_name: document.getElementById('land-name').value,
        size_sqm: parseFloat(document.getElementById('land-size').value),
        price_per_sqm: parseFloat(document.getElementById('land-price').value),
        debt_percentage: parseFloat(document.getElementById('land-debt').value)
    };

    try {
        const response = await fetch(API.lands, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to add land');
        }

        landForm.reset();
        loadLands();
    } catch (error) {
        console.error('Error adding land:', error);
        alert('Failed to add land. Please try again.');
    }
});

// Delete handlers
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const type = e.target.closest('table').id === 'investments-table' ? 'investments' : 'lands';
        
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await fetch(`${API[type]}/${id}`, { 
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete ${type}`);
                }

                type === 'investments' ? loadInvestments() : loadLands();
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item. Please try again.');
            }
        }
    }
});