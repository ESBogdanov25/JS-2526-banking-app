/**
 * FinSim - LocalStorage Management System
 * Handles all data storage and retrieval operations
 */

class StorageManager {
    constructor() {
        this.prefix = 'finsim_'; // Prevent conflicts with other apps
        this.init();
    }

    /**
     * Initialize storage - create empty datasets if they don't exist
     */
    init() {
        const requiredStores = [
            'users',
            'accounts', 
            'transactions',
            'currentUser'
        ];

        requiredStores.forEach(store => {
            if (!this.get(store)) {
                this.set(store, store === 'currentUser' ? null : []);
            }
        });

        console.log('💰 FinSim Storage Initialized');
    }

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Data to store
     */
    set(key, value) {
        try {
            const storageKey = this.prefix + key;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(storageKey, serializedValue);
            return true;
        } catch (error) {
            console.error('❌ Storage Error (set):', error);
            return false;
        }
    }

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     */
    get(key, defaultValue = null) {
        try {
            const storageKey = this.prefix + key;
            const item = localStorage.getItem(storageKey);
            
            if (item === null) {
                return defaultValue;
            }

            return JSON.parse(item);
        } catch (error) {
            console.error('❌ Storage Error (get):', error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            const storageKey = this.prefix + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('❌ Storage Error (remove):', error);
            return false;
        }
    }

    /**
     * Clear all FinSim data from localStorage
     */
    clearAll() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            
            this.init(); // Re-initialize empty structure
            console.log('🗑️ All FinSim data cleared');
            return true;
        } catch (error) {
            console.error('❌ Storage Error (clearAll):', error);
            return false;
        }
    }

    /**
     * Get all storage keys (for debugging)
     */
    getAllKeys() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    }

    /**
     * Check if storage is available
     */
    isStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('❌ localStorage not available');
            return false;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
}