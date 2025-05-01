import { formatCurrency, formatPercentage } from '../utils/formatters.js';

class LandView {
    constructor() {
        this.landForm = document.getElementById('land-form');
        this.landsTable = document.getElementById('lands-table').querySelector('tbody');
    }

    bindAddLand(handler) {
        this.landForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                land_name: document.getElementById('land-name').value,
                size_sqm: document.getElementById('land-size').value,
                price_per_sqm: document.getElementById('land-price').value,
                debt_percentage: document.getElementById('land-debt').value
            };
            
            const landIdField = document.querySelector('input[name="land-id"]');
            
            if (landIdField && landIdField.value) {
                // Update existing land
                const id = parseInt(landIdField.value);
                handler(id, formData);
            } else {
                // Add new land
                handler(null, formData);
            }
        });
    }

    bindEditLand(handler) {
        this.landsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                handler(id);
            }
        });
    }

    bindDeleteLand(handler) {
        this.landsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this land?')) {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    handler(id);
                }
            }
        });
    }

    displayLands(lands) {
        this.landsTable.innerHTML = '';
        
        lands.forEach(land => {
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
            this.landsTable.appendChild(tr);
        });
    }

    populateLandForm(land) {
        document.getElementById('land-name').value = land.land_name;
        document.getElementById('land-size').value = land.size_sqm;
        document.getElementById('land-price').value = land.price_per_sqm;
        document.getElementById('land-debt').value = land.debt_percentage;
        
        // Add a hidden field for the land ID
        let landIdField = document.querySelector('input[name="land-id"]');
        if (!landIdField) {
            landIdField = document.createElement('input');
            landIdField.type = 'hidden';
            landIdField.name = 'land-id';
            this.landForm.appendChild(landIdField);
        }
        landIdField.value = land.id;
        
        // Change submit button text
        this.landForm.querySelector('button[type="submit"]').textContent = 'Update Land';
    }

    resetLandForm() {
        this.landForm.reset();
        
        // Remove the land ID field if it exists
        const landIdField = document.querySelector('input[name="land-id"]');
        if (landIdField) {
            landIdField.remove();
        }
        
        // Reset submit button text
        this.landForm.querySelector('button[type="submit"]').textContent = 'Add Land';
    }
}

// Singleton instance
const landView = new LandView();
export default landView; 