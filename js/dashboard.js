/**
 * FinSim - Dashboard Management System
 * Handles real-time user data and UI updates
 */

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userAccounts = [];
        this.recentTransactions = [];
        this.isInitialized = false;
    }

    /**
     * Initialize dashboard manager
     */
    async init() {
        try {
            console.log('🚀 Initializing Dashboard Manager...');
            
            // Validate dependencies
            if (!authManager || !dataManager) {
                throw new Error('Required dependencies not available');
            }

            await this.loadUserData();
            await this.loadUserAccounts();
            await this.loadRecentTransactions();
            await this.updateUI();
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ Dashboard Manager initialized successfully');

        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    }

    /**
     * Load current user data from auth system
     */
    async loadUserData() {
        try {
            this.currentUser = authManager.getCurrentUser();
            
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            console.log('👤 User data loaded:', this.currentUser.email);
            
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            throw error;
        }
    }

    /**
     * Load user's accounts from data manager
     */
    async loadUserAccounts() {
        try {
            if (!this.currentUser) {
                throw new Error('No user data available');
            }

            this.userAccounts = dataManager.getAccountsByUserId(this.currentUser.id);
            console.log('💰 User accounts loaded:', this.userAccounts.length);
            
        } catch (error) {
            console.error('❌ Failed to load user accounts:', error);
            this.userAccounts = [];
        }
    }

    /**
     * Load recent transactions for the user
     */
    async loadRecentTransactions() {
        try {
            if (!this.currentUser) {
                throw new Error('No user data available');
            }

            this.recentTransactions = dataManager.getRecentTransactions(this.currentUser.id, 5);
            console.log('📊 Recent transactions loaded:', this.recentTransactions.length);
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.recentTransactions = [];
        }
    }

    /**
     * Update all UI elements with real user data
     */
    async updateUI() {
        try {
            await this.updateUserProfile();
            await this.updateAccountCards();
            await this.updateDashboardStats();
            await this.updateRecentTransactions();
            await this.updateSidebar();
            await this.updateDashboardHeader(); // ADDED: Fix welcome message
        } catch (error) {
            console.error('❌ UI update failed:', error);
        }
    }

    /**
     * Update user profile section (avatar, name, etc.)
     */
    async updateUserProfile() {
        const userAvatar = document.querySelector('.user-avatar');
        const userName = document.querySelector('.user-info h4');
        const userEmail = document.querySelector('.user-info p');

        if (userAvatar) {
            userAvatar.textContent = this.getUserInitials();
        }

        if (userName) {
            userName.textContent = this.currentUser.firstName + ' ' + this.currentUser.lastName;
        }

        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }
    }

    /**
     * Update dashboard header with personalized welcome message
     */
    async updateDashboardHeader() {
        const dashboardHeader = document.querySelector('.dashboard-header p');
        
        if (dashboardHeader && this.currentUser) {
            const firstName = this.currentUser.firstName || 'User';
            const currentTime = this.getTimeBasedGreeting();
            
            dashboardHeader.textContent = 
                `${currentTime}, ${firstName}! Here's your financial overview.`;
        }
    }

    /**
     * Get time-appropriate greeting
     */
    getTimeBasedGreeting() {
        const hour = new Date().getHours();
        
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }

    /**
     * Update account cards with real account data
     */
    async updateAccountCards() {
        const accountCards = document.querySelectorAll('.account-card');
        
        this.userAccounts.forEach((account, index) => {
            if (accountCards[index]) {
                const balanceElement = accountCards[index].querySelector('.balance-amount');
                const accountNumberElement = accountCards[index].querySelector('.account-number');
                const accountTypeElement = accountCards[index].querySelector('.account-type');

                if (balanceElement) {
                    balanceElement.textContent = account.formatBalance();
                }

                if (accountNumberElement) {
                    accountNumberElement.textContent = account.maskedAccountNumber;
                }

                if (accountTypeElement) {
                    // Capitalize first letter of account type
                    accountTypeElement.textContent = account.type.charAt(0).toUpperCase() + account.type.slice(1);
                }
            }
        });
    }

    /**
     * Update dashboard statistics with real data
     */
    async updateDashboardStats() {
        const totalBalanceElement = document.querySelector('.stat-amount');
        const monthlyIncomeElement = document.querySelectorAll('.stat-amount')[1];
        const monthlyExpensesElement = document.querySelectorAll('.stat-amount')[2];

        if (totalBalanceElement) {
            const totalBalance = this.userAccounts.reduce((total, account) => total + account.balance, 0);
            totalBalanceElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalBalance);
        }

        // You can implement more sophisticated calculations for income/expenses
        // For now, using placeholder calculations
        if (monthlyIncomeElement) {
            monthlyIncomeElement.textContent = '$4,250.00'; // Will be calculated from transactions
        }

        if (monthlyExpensesElement) {
            monthlyExpensesElement.textContent = '$2,875.50'; // Will be calculated from transactions
        }
    }

    /**
     * Update recent transactions list
     */
    async updateRecentTransactions() {
        const transactionList = document.querySelector('.transaction-list');
        
        if (!transactionList) return;

        // Clear existing placeholder transactions
        transactionList.innerHTML = '';

        this.recentTransactions.forEach(transaction => {
            const transactionItem = this.createTransactionElement(transaction);
            transactionList.appendChild(transactionItem);
        });

        // If no transactions, show empty state
        if (this.recentTransactions.length === 0) {
            transactionList.innerHTML = '<div class="empty-state">No recent transactions</div>';
        }
    }

    /**
     * Create transaction list item element
     */
    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
        const isIncome = transaction.type === 'deposit';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountSign = isIncome ? '+' : '-';

        div.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon">${this.getTransactionIcon(transaction.category)}</div>
                <div>
                    <p class="transaction-desc">${transaction.description}</p>
                    <p class="transaction-date">${transaction.displayDate}</p>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(transaction.amount)}
            </div>
        `;

        return div;
    }

    /**
     * Get appropriate icon for transaction category
     */
    getTransactionIcon(category) {
        const icons = {
            'shopping': '🛒',
            'salary': '💰',
            'rent': '🏠',
            'transfer': '🔄',
            'food': '🍽️',
            'entertainment': '🎬',
            'transport': '🚗',
            'general': '💳'
        };
        
        return icons[category] || '💳';
    }

    /**
     * Update sidebar with user data
     */
    async updateSidebar() {
        // Sidebar is already updated by updateUserProfile()
        // Add any sidebar-specific updates here if needed
    }

    /**
     * Get user initials for avatar
     */
    getUserInitials() {
        if (!this.currentUser) return 'US';
        
        const first = this.currentUser.firstName ? this.currentUser.firstName[0] : '';
        const last = this.currentUser.lastName ? this.currentUser.lastName[0] : '';
        
        return (first + last).toUpperCase() || 'US';
    }

    /**
     * Setup event listeners for real-time updates
     */
    setupEventListeners() {
        // Listen for account updates
        // Listen for transaction updates
        // You can expand this for real-time features
        
        console.log('🎯 Dashboard event listeners setup');
    }

    /**
     * Refresh all dashboard data
     */
    async refreshData() {
        try {
            await this.loadUserData();
            await this.loadUserAccounts();
            await this.loadRecentTransactions();
            await this.updateUI();
            
            console.log('🔄 Dashboard data refreshed');
            
        } catch (error) {
            console.error('❌ Dashboard refresh failed:', error);
        }
    }

    /**
     * Get dashboard status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            user: this.currentUser ? {
                name: this.currentUser.firstName + ' ' + this.currentUser.lastName,
                email: this.currentUser.email,
                accounts: this.userAccounts.length
            } : null,
            accounts: this.userAccounts.length,
            transactions: this.recentTransactions.length
        };
    }
}

// Create and initialize dashboard manager
const dashboardManager = new DashboardManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboardManager.init();
    });
} else {
    dashboardManager.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dashboardManager;
}