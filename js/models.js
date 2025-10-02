/**
 * FinSim - Data Models with IBAN Support
 * Enhanced with professional banking features
 */

class User {
    constructor(userData) {
        this.id = userData.id || this.generateId();
        this.email = userData.email;
        this.password = userData.password;
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
        this.role = userData.role || 'user';
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
        this.iban = accountData.iban || this.generateIBAN(); // NEW: IBAN support
        this.type = accountData.type || 'checking';
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
        return 'FIN' + Date.now().toString().substr(-8) + Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    /**
     * Generate professional IBAN format
     * Format: FS00 XXXX XXXX XXXX XXXX XXXX
     */
    generateIBAN() {
        const countryCode = 'FS'; // FinSim country code
        const checkDigits = '00'; // Simplified check digits for demo
        const bankCode = 'FINS'; // Bank identifier
        const branchCode = '0010'; // Branch code
        const accountNumber = Math.random().toString().substr(2, 12).padStart(12, '0');
        
        return `${countryCode}${checkDigits} ${bankCode}${branchCode} ${accountNumber.match(/.{1,4}/g).join(' ')}`;
    }

    /**
     * Validate IBAN format
     */
    static isValidIBAN(iban) {
        if (!iban || typeof iban !== 'string') return false;
        
        // Basic IBAN format validation
        const ibanRegex = /^FS[0-9]{2} FINS[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}$/;
        return ibanRegex.test(iban.trim());
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
     * Get masked IBAN for display
     */
    get maskedIBAN() {
        const parts = this.iban.split(' ');
        if (parts.length >= 6) {
            return `FS** **** **** **** **** ${parts[5]}`;
        }
        return this.iban;
    }

    /**
     * Check if account has sufficient funds
     */
    hasSufficientFunds(amount) {
        return this.balance >= amount;
    }

    /**
     * Deposit money into account
     */
    deposit(amount) {
        if (amount <= 0) throw new Error('Deposit amount must be positive');
        this.balance += amount;
        return this.balance;
    }

    /**
     * Withdraw money from account
     */
    withdraw(amount) {
        if (amount <= 0) throw new Error('Withdrawal amount must be positive');
        if (!this.hasSufficientFunds(amount)) {
            throw new Error('Insufficient funds');
        }
        this.balance -= amount;
        return this.balance;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            accountNumber: this.accountNumber,
            iban: this.iban, // NEW: Include IBAN in serialization
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
        this.recipientIBAN = transactionData.recipientIBAN || null; // NEW: Recipient IBAN
        this.recipientName = transactionData.recipientName || null; // NEW: Recipient name
        this.type = transactionData.type; // 'deposit', 'withdrawal', 'transfer'
        this.amount = transactionData.amount;
        this.description = transactionData.description || '';
        this.category = transactionData.category || 'general';
        this.status = transactionData.status || 'completed';
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
            recipientIBAN: this.recipientIBAN, // NEW: Include recipient IBAN
            recipientName: this.recipientName, // NEW: Include recipient name
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
 * Data Manager - Enhanced with IBAN and transfer operations
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

    getAccountByIBAN(iban) {
        console.log('🔍 getAccountByIBAN called with:', iban);
        console.log('IBAN type:', typeof iban);
        console.log('IBAN length:', iban.length);
        
        const accounts = this.storage.get('accounts', []);
        console.log('📊 Total accounts in storage:', accounts.length);
        
        // Log all accounts and their IBANs
        accounts.forEach((account, index) => {
            console.log(`Account ${index}:`, {
                id: account.id,
                iban: account.iban,
                ibanType: typeof account.iban,
                ibanLength: account.iban ? account.iban.length : 'NO IBAN'
            });
        });
        
        const accountData = accounts.find(account => {
            const accountIBAN = account.iban ? account.iban.replace(/\s/g, '') : '';
            const searchIBAN = iban ? iban.replace(/\s/g, '') : '';
            const match = accountIBAN === searchIBAN;
            
            console.log('🔍 Comparing:', {
                accountIBAN: accountIBAN,
                searchIBAN: searchIBAN, 
                match: match
            });
            
            return match;
        });
        
        console.log('✅ Lookup result:', accountData ? 'FOUND' : 'NOT FOUND');
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

    async processTransfer(fromAccountId, toAccountIdentifier, amount, description = '') {
        try {
            // Validate from account
            const fromAccount = this.getAccountById(fromAccountId);
            if (!fromAccount) {
                throw new Error('Sender account not found');
            }

            // Validate sufficient funds
            if (!fromAccount.hasSufficientFunds(amount)) {
                throw new Error('Insufficient funds');
            }

            let toAccount;

            // Check if toAccountIdentifier is an account ID (internal transfer) or IBAN (external transfer)
            if (toAccountIdentifier.startsWith('acc_')) {
                // It's an account ID - internal transfer between own accounts
                toAccount = this.getAccountById(toAccountIdentifier);
            } else {
                // It's an IBAN - external transfer to another user
                toAccount = this.getAccountByIBAN(toAccountIdentifier);
            }

            if (!toAccount) {
                throw new Error('Recipient account not found');
            }

            if (!toAccount.isActive) {
                throw new Error('Recipient account is inactive');
            }

            // Prevent transfer to same account
            if (fromAccount.id === toAccount.id) {
                throw new Error('Cannot transfer to the same account');
            }

            // Process transfer
            fromAccount.withdraw(amount);
            toAccount.deposit(amount);

            // Update accounts in storage
            this.updateAccountBalance(fromAccount.id, fromAccount.balance);
            this.updateAccountBalance(toAccount.id, toAccount.balance);

            // Create transaction records
            const senderTransaction = this.createTransaction({
                accountId: fromAccount.id,
                recipientIBAN: toAccount.iban,
                recipientName: this.getUserById(toAccount.userId)?.fullName || 'Unknown',
                type: 'transfer',
                amount: amount,
                description: description || `Transfer to ${toAccount.maskedIBAN}`,
                category: 'transfer',
                status: 'completed'
            });

            const recipientTransaction = this.createTransaction({
                accountId: toAccount.id,
                recipientIBAN: fromAccount.iban,
                recipientName: this.getUserById(fromAccount.userId)?.fullName || 'Unknown',
                type: 'deposit',
                amount: amount,
                description: description || `Transfer from ${fromAccount.maskedIBAN}`,
                category: 'transfer',
                status: 'completed'
            });

            return {
                success: true,
                senderTransaction: senderTransaction,
                recipientTransaction: recipientTransaction,
                newSenderBalance: fromAccount.balance,
                newRecipientBalance: toAccount.balance
            };

        } catch (error) {
            console.error('❌ Transfer failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
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