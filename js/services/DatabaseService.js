class DatabaseService {
    constructor() {
        this.DB_NAME = 'investmentTracker';
        this.DB_VERSION = 1;
        this.STORES = {
            investments: 'investments',
            lands: 'lands',
            transactions: 'transactions'
        };
        this.db = null;
    }

    async init() {
        if (this.db) {
            console.log('Database already initialized, using existing connection');
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = event => {
                console.error('IndexedDB error:', event.target.error);
                reject('Error opening database');
            };
            
            request.onsuccess = event => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = event => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains(this.STORES.investments)) {
                    const investmentsStore = db.createObjectStore(this.STORES.investments, { keyPath: 'id', autoIncrement: true });
                    investmentsStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.lands)) {
                    const landsStore = db.createObjectStore(this.STORES.lands, { keyPath: 'id', autoIncrement: true });
                    landsStore.createIndex('land_name', 'land_name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(this.STORES.transactions)) {
                    const transactionsStore = db.createObjectStore(this.STORES.transactions, { keyPath: 'id', autoIncrement: true });
                    transactionsStore.createIndex('entity_id', 'entity_id', { unique: false });
                    transactionsStore.createIndex('transaction_date', 'transaction_date', { unique: false });
                }
                
                console.log('Database schema created');
            };
        });
    }

    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
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

    async getById(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(id);
            
            request.onsuccess = event => {
                resolve(event.target.result);
            };
            
            request.onerror = event => {
                console.error(`Error getting item from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    async add(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
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

    async update(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
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

    async delete(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
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

    async resetDatabase() {
        return new Promise((resolve, reject) => {
            console.log("Resetting database...");
            
            // Close any open connections
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            
            // Delete the database completely
            const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
            
            deleteRequest.onsuccess = () => {
                console.log("Database deleted successfully");
                
                // Re-initialize the database
                this.init().then(() => {
                    console.log("Database re-initialized after reset");
                    resolve();
                }).catch(err => {
                    console.error("Error re-initializing database:", err);
                    reject(err);
                });
            };
            
            deleteRequest.onerror = (event) => {
                console.error("Error deleting database:", event.target.error);
                reject(event.target.error);
            };
        });
    }
}

// Singleton instance
const dbService = new DatabaseService();
export default dbService; 