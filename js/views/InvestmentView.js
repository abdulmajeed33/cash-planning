import { formatCurrency, formatPercentage } from '../utils/formatters.js';

class InvestmentView {
    constructor() {
        this.investmentForm = document.getElementById('investment-form');
        this.investmentsTable = document.getElementById('investments-table').querySelector('tbody');
    }

    bindAddInvestment(handler) {
        this.investmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('inv-name').value,
                size: document.getElementById('inv-size').value,
                share_percentage: document.getElementById('inv-share').value,
                debt_percentage: document.getElementById('inv-debt').value
            };
            
            const investmentIdField = document.querySelector('input[name="investment-id"]');
            
            if (investmentIdField && investmentIdField.value) {
                // Update existing investment
                const id = parseInt(investmentIdField.value);
                handler(id, formData);
            } else {
                // Add new investment
                handler(null, formData);
            }
        });
    }

    bindEditInvestment(handler) {
        this.investmentsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = parseInt(e.target.getAttribute('data-id'));
                handler(id);
            }
        });
    }

    bindDeleteInvestment(handler) {
        this.investmentsTable.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this investment?')) {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    handler(id);
                }
            }
        });
    }

    displayInvestments(investments) {
        this.investmentsTable.innerHTML = '';
        
        investments.forEach(investment => {
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
            this.investmentsTable.appendChild(tr);
        });
    }

    populateInvestmentForm(investment) {
        document.getElementById('inv-name').value = investment.name;
        document.getElementById('inv-size').value = investment.size;
        document.getElementById('inv-share').value = investment.share_percentage;
        document.getElementById('inv-debt').value = investment.debt_percentage;
        
        // Add a hidden field for the investment ID
        let investmentIdField = document.querySelector('input[name="investment-id"]');
        if (!investmentIdField) {
            investmentIdField = document.createElement('input');
            investmentIdField.type = 'hidden';
            investmentIdField.name = 'investment-id';
            this.investmentForm.appendChild(investmentIdField);
        }
        investmentIdField.value = investment.id;
        
        // Change submit button text
        this.investmentForm.querySelector('button[type="submit"]').textContent = 'Update Investment';
    }

    resetInvestmentForm() {
        this.investmentForm.reset();
        
        // Remove the investment ID field if it exists
        const investmentIdField = document.querySelector('input[name="investment-id"]');
        if (investmentIdField) {
            investmentIdField.remove();
        }
        
        // Reset submit button text
        this.investmentForm.querySelector('button[type="submit"]').textContent = 'Add Investment';
    }
}

// Singleton instance
const investmentView = new InvestmentView();
export default investmentView; 