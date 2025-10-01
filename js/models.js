/**
 * FinSim - Data Models
 * Defines the core data structures for the banking system
 */

class User {
    constructor(userData) {
        this.id = userData.id || this.generateId();
        this.email = userData.email;
        this.password = userData.password; // Will be hashed later
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
        this.role = userData.role || 'user'; // 'user' or 'admin'
        this.createdAt = userData.createdAt || new Date().toISOString();
        this.lastLogin = userData.lastLogin || null;
        this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    get initials() {
        return (this.firstName[0] + this.lastName[0]).toUpperCase();
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            isActive: this.isActive
        };
    }
}

class Account {
    constructor(accountData) {
        this.id = accountData.id || this.generateId();
        this.userId = accountData.userId;
        this.accountNumber = accountData.accountNumber || this.generateAccountNumber();
        this.type = accountData.type || 'checking'; // 'checking', 'savings', 'investment'
        this.balance = accountData.balance || 0;
        this.currency = accountData.currency || 'USD';
        this.createdAt = accountData.createdAt || new Date().toISOString();
        this.isActive = accountData.isActive !== undefined ? accountData.isActive : true;
        this.overdraftProtection = accountData.overdraftProtection || false;
    }

    generateId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAccountNumber() {
        // Generate a realistic-looking account number
        return 'FIN' + Date.now().toString().substr(-8) + Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    /**
     * Format balance for display
     */
    formatBalance() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(this.balance);
    }

    /**
     * Get masked account number for display
     */
    get maskedAccountNumber() {
        return '****' + this.accountNumber.slice(-4);
    }

    /**
     * Check if account has sufficient funds
     */
    hasSufficientFunds(amount) {
        return this.balance >= amount;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            accountNumber: this.accountNumber,
            type: this.type,
            balance: this.balance,
            currency: this.currency,
            createdAt: this.createdAt,
            isActive: this.isActive,
            overdraftProtection: this.overdraftProtection
        };
    }
}

class Transaction {
    constructor(transactionData) {
        this.id = transactionData.id || this.generateId();
        this.accountId = transactionData.accountId;
        this.type = transactionData.type; // 'deposit', 'withdrawal', 'transfer'
        this.amount = transactionData.amount;
        this.description = transactionData.description || '';
        this.category = transactionData.category || 'general';
        this.status = transactionData.status || 'completed'; // 'pending', 'completed', 'failed'
        this.timestamp = transactionData.timestamp || new Date().toISOString();
        this.recipientAccountId = transactionData.recipientAccountId || null;
        this.fraudAlerts = transactionData.fraudAlerts || [];
        this.reference = transactionData.reference || this.generateReference();
    }

    generateId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateReference() {
        return 'REF' + Date.now().toString().substr(-10) + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    /**
     * Format amount with sign based on transaction type
     */
    get formattedAmount() {
        const sign = this.type === 'deposit' ? '+' : '-';
        return sign + new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(this.amount);
    }

    /**
     * Check if transaction is income
     */
    get isIncome() {
        return this.type === 'deposit';
    }

    /**
     * Check if transaction is expense
     */
    get isExpense() {
        return this.type === 'withdrawal' || this.type === 'transfer';
    }

    /**
     * Get human-readable date
     */
    get displayDate() {
        const date = new Date(this.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    toJSON() {
        return {
            id: this.id,
            accountId: this.accountId,
            type: this.type,
            amount: this.amount,
            description: this.description,
            category: this.category,
            status: this.status,
            timestamp: this.timestamp,
            recipientAccountId: this.recipientAccountId,
            fraudAlerts: this.fraudAlerts,
            reference: this.reference
        };
    }
}

/**
 * Data Manager - Handles operations on our data models
 */
class DataManager {
    constructor() {
        this.storage = storage;
    }

    // User Methods
    createUser(userData) {
        const user = new User(userData);
        const users = this.storage.get('users', []);
        users.push(user.toJSON());
        this.storage.set('users', users);
        return user;
    }

    getUserById(id) {
        const users = this.storage.get('users', []);
        const userData = users.find(user => user.id === id);
        return userData ? new User(userData) : null;
    }

    getUserByEmail(email) {
        const users = this.storage.get('users', []);
        const userData = users.find(user => user.email === email);
        return userData ? new User(userData) : null;
    }

    updateUser(userId, updates) {
        const users = this.storage.get('users', []);
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.storage.set('users', users);
            return new User(users[userIndex]);
        }
        return null;
    }

    // Account Methods
    createAccount(accountData) {
        const account = new Account(accountData);
        const accounts = this.storage.get('accounts', []);
        accounts.push(account.toJSON());
        this.storage.set('accounts', accounts);
        return account;
    }

    getAccountsByUserId(userId) {
        const accounts = this.storage.get('accounts', []);
        return accounts
            .filter(account => account.userId === userId && account.isActive)
            .map(accountData => new Account(accountData));
    }

    getAccountById(id) {
        const accounts = this.storage.get('accounts', []);
        const accountData = accounts.find(account => account.id === id);
        return accountData ? new Account(accountData) : null;
    }

    updateAccountBalance(accountId, newBalance) {
        const accounts = this.storage.get('accounts', []);
        const accountIndex = accounts.findIndex(account => account.id === accountId);
        
        if (accountIndex !== -1) {
            accounts[accountIndex].balance = newBalance;
            this.storage.set('accounts', accounts);
            return new Account(accounts[accountIndex]);
        }
        return null;
    }

    // Transaction Methods
    createTransaction(transactionData) {
        const transaction = new Transaction(transactionData);
        const transactions = this.storage.get('transactions', []);
        transactions.push(transaction.toJSON());
        this.storage.set('transactions', transactions);
        return transaction;
    }

    getTransactionsByAccountId(accountId, limit = 50) {
        const transactions = this.storage.get('transactions', []);
        return transactions
            .filter(txn => txn.accountId === accountId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)
            .map(txnData => new Transaction(txnData));
    }

    getUserTransactions(userId) {
        const userAccounts = this.getAccountsByUserId(userId);
        const accountIds = userAccounts.map(acc => acc.id);
        const transactions = this.storage.get('transactions', []);
        
        return transactions
            .filter(txn => accountIds.includes(txn.accountId))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(txnData => new Transaction(txnData));
    }

    // Utility Methods
    getTotalBalance(userId) {
        const accounts = this.getAccountsByUserId(userId);
        return accounts.reduce((total, account) => total + account.balance, 0);
    }

    getRecentTransactions(userId, limit = 10) {
        const transactions = this.getUserTransactions(userId);
        return transactions.slice(0, limit);
    }
}

// Create global data manager instance
const dataManager = new DataManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { User, Account, Transaction, dataManager };
}