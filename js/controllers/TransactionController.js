import dbService from '../services/DatabaseService.js';
import Transaction from '../models/Transaction.js';

class TransactionController {
    constructor() {
        this.STORE_NAME = 'transactions';
    }

    async getAllTransactions() {
        try {
            const transactions = await dbService.getAll(this.STORE_NAME);
            return transactions.map(tx => {
                // Ensure transaction_date is a Date object
                if (tx.transaction_date && !(tx.transaction_date instanceof Date)) {
                    tx.transaction_date = new Date(tx.transaction_date);
                }
                return new Transaction(tx);
            });
        } catch (error) {
            console.error('Error loading transactions:', error);
            throw error;
        }
    }

    async getTransactionById(id) {
        try {
            const transaction = await dbService.getById(this.STORE_NAME, id);
            if (transaction) {
                // Ensure transaction_date is a Date object
                if (transaction.transaction_date && !(transaction.transaction_date instanceof Date)) {
                    transaction.transaction_date = new Date(transaction.transaction_date);
                }
                return new Transaction(transaction);
            }
            return null;
        } catch (error) {
            console.error(`Error loading transaction with ID ${id}:`, error);
            throw error;
        }
    }

    async addTransaction(formData) {
        try {
            // Format amount according to transaction type
            const amount = Transaction.formatAmount(
                formData.amount,
                formData.transaction_type
            );
            
            const transaction = new Transaction({
                entity_id: parseInt(formData.entity_id),
                entity_type: formData.entity_type,
                transaction_type: formData.transaction_type,
                amount: amount.toString(),
                transaction_date: new Date(formData.transaction_date),
                notes: formData.notes || ''
            });
            
            const id = await dbService.add(this.STORE_NAME, transaction.toJSON());
            transaction.id = id;
            return transaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    async updateTransaction(id, formData) {
        try {
            // Format amount according to transaction type
            const amount = Transaction.formatAmount(
                formData.amount,
                formData.transaction_type
            );
            
            const transaction = new Transaction({
                id: id,
                entity_id: parseInt(formData.entity_id),
                entity_type: formData.entity_type,
                transaction_type: formData.transaction_type,
                amount: amount.toString(),
                transaction_date: new Date(formData.transaction_date),
                notes: formData.notes || ''
            });
            
            await dbService.update(this.STORE_NAME, transaction.toJSON());
            return transaction;
        } catch (error) {
            console.error(`Error updating transaction with ID ${id}:`, error);
            throw error;
        }
    }

    async deleteTransaction(id) {
        try {
            await dbService.delete(this.STORE_NAME, id);
        } catch (error) {
            console.error(`Error deleting transaction with ID ${id}:`, error);
            throw error;
        }
    }

    // Get transactions within a date range
    async getTransactionsInRange(startDate, endDate) {
        try {
            const allTransactions = await this.getAllTransactions();
            return allTransactions.filter(tx => {
                const txDate = new Date(tx.transaction_date);
                return txDate >= startDate && txDate <= endDate;
            });
        } catch (error) {
            console.error('Error getting transactions in range:', error);
            throw error;
        }
    }

    // Get transactions for a specific entity
    async getTransactionsByEntityId(entityId, entityType) {
        try {
            const allTransactions = await this.getAllTransactions();
            return allTransactions.filter(tx => 
                tx.entity_id === entityId && tx.entity_type === entityType
            );
        } catch (error) {
            console.error(`Error getting transactions for entity ${entityId}:`, error);
            throw error;
        }
    }
}

// Singleton instance
const transactionController = new TransactionController();
export default transactionController; 