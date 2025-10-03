/**
 * FinSim - Dashboard Management System
 * Handles real-time user data, transfers, and IBAN validation
 */

/**
 * Transactions Manager - Handles transactions display, filtering, and search
 * Best Practice: Single responsibility pattern
 */
class TransactionsManager {
    constructor() {
        this.currentUser = null;
        this.allTransactions = [];
        this.filteredTransactions = [];
        this.currentFilters = {
            account: 'all',
            type: 'all', 
            category: 'all',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        this.pagination = {
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,
            totalTransactions: 0
        };
        this.isInitialized = false;
    }

    /**
     * Initialize transactions manager
     */
    async init() {
        try {
            console.log('🚀 Initializing Transactions Manager...');
            
            this.currentUser = authManager.getCurrentUser();
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            await this.loadTransactions();
            await this.setupFilters();
            await this.renderTransactions();
            this.setupEventListeners();
            this.setupPagination();

            this.isInitialized = true;
            console.log('✅ Transactions Manager initialized');

        } catch (error) {
            console.error('❌ Transactions init failed:', error);
        }
    }

    /**
     * Load all user transactions from data manager
     */
    async loadTransactions() {
        try {
            this.allTransactions = dataManager.getUserTransactions(this.currentUser.id);
            this.filteredTransactions = [...this.allTransactions];
            console.log('📊 Loaded transactions:', this.allTransactions.length);
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.allTransactions = [];
            this.filteredTransactions = [];
        }
    }

    /**
     * Render transactions to the page with pagination
     */
    async renderTransactions() {
        const transactionsList = document.querySelector('.transactions-list');
        if (!transactionsList) return;

        // Clear existing content except header
        const header = transactionsList.querySelector('.transaction-header');
        transactionsList.innerHTML = '';
        if (header) {
            transactionsList.appendChild(header);
        }

        // Calculate pagination
        this.calculatePagination();
        
        // Get transactions for current page
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);

        if (pageTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters or make your first transaction!</p>
                </div>
            `;
            this.renderPagination();
            return;
        }

        pageTransactions.forEach(transaction => {
            const transactionElement = this.createTransactionElement(transaction);
            transactionsList.appendChild(transactionElement);
        });

        this.renderPagination();
    }

    /**
     * Create individual transaction element
     */
    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-row';
        
        const isIncome = transaction.type === 'deposit';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountSign = isIncome ? '+' : '-';

        div.innerHTML = `
            <div class="transaction-desc">
                <div class="transaction-icon">${this.getTransactionIcon(transaction.category)}</div>
                <div>
                    <p class="desc-main">${transaction.description}</p>
                    <p class="desc-sub">${transaction.recipientName || ''} ${transaction.recipientIBAN ? `(${transaction.recipientIBAN})` : ''}</p>
                </div>
            </div>
            <div class="transaction-date">
                <p>${transaction.displayDate}</p>
                <p>${new Date(transaction.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(transaction.amount)}
            </div>
            <div class="transaction-status ${transaction.status}">${transaction.status}</div>
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
     * Setup filter dropdowns with real account data and transaction types
     */
    async setupFilters() {
        console.log('🔧 Setting up transaction filters...');
        
        // Account filter (first dropdown)
        const accountFilter = document.querySelectorAll('.filter-select')[0];
        // Type filter (second dropdown) 
        const typeFilter = document.querySelectorAll('.filter-select')[1];
        // Date inputs
        const dateFromInput = document.querySelectorAll('.filter-select')[2];
        const dateToInput = document.querySelectorAll('.filter-select')[3];
        
        // Setup account filter
        if (accountFilter) {
            accountFilter.innerHTML = '<option value="all">All Accounts</option>';

            // Get user's accounts
            const userAccounts = dataManager.getAccountsByUserId(this.currentUser.id);
            
            // Add account options to filter
            userAccounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${this.getAccountTypeDisplay(account.type)} (${account.maskedAccountNumber})`;
                accountFilter.appendChild(option);
            });

            console.log('✅ Account filter populated with', userAccounts.length, 'accounts');
        }

        // Setup type filter
        if (typeFilter) {
            typeFilter.innerHTML = `
                <option value="all">All Transactions</option>
                <option value="transfer">Transfers</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
            `;
            console.log('✅ Type filter populated');
        }

        // Setup date inputs with placeholder text
        if (dateFromInput) {
            dateFromInput.placeholder = 'From Date';
            console.log('✅ From Date input setup');
        }
        
        if (dateToInput) {
            dateToInput.placeholder = 'To Date';
            console.log('✅ To Date input setup');
        }
    }

    /**
     * Setup event listeners for filters, search, and pagination
     */
    setupEventListeners() {
        console.log('🎯 Setting up transaction event listeners...');
        
        // Account filter (first dropdown)
        const accountFilter = document.querySelectorAll('.filter-select')[0];
        if (accountFilter) {
            accountFilter.addEventListener('change', (e) => {
                this.handleFilterChange('account', e.target.value);
            });
        }
        
        // Type filter (second dropdown)
        const typeFilter = document.querySelectorAll('.filter-select')[1];
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.handleFilterChange('type', e.target.value);
            });
        }
        
        // Date filters
        const dateFromInput = document.querySelectorAll('.filter-select')[2];
        const dateToInput = document.querySelectorAll('.filter-select')[3];
        
        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                this.handleFilterChange('dateFrom', e.target.value);
            });
        }
        
        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                this.handleFilterChange('dateTo', e.target.value);
            });
        }
        
        // Search functionality
        this.setupSearch();
        
        console.log('✅ Transaction event listeners setup complete');
    }

    /**
     * Setup search functionality with debouncing
     */
    setupSearch() {
        // Create search input if it doesn't exist
        let searchInput = document.querySelector('.transactions-search');
        
        if (!searchInput) {
            const searchContainer = document.querySelector('.transactions-controls');
            if (searchContainer) {
                searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.className = 'transactions-search';
                searchInput.placeholder = 'Search transactions...';
                searchContainer.appendChild(searchInput);
            }
        }

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleFilterChange('search', e.target.value);
            }, 300));
            
            console.log('✅ Search functionality setup');
        }
    }

    /**
     * Setup pagination controls
     */
    setupPagination() {
        console.log('🔢 Setting up pagination...');
        // Pagination controls will be rendered dynamically
    }

    /**
     * Apply all active filters to transactions
     */
    applyFilters() {
        this.filteredTransactions = this.allTransactions.filter(transaction => {
            // Account filter
            if (this.currentFilters.account !== 'all') {
                if (transaction.accountId !== this.currentFilters.account) {
                    return false;
                }
            }
            
            // Type filter
            if (this.currentFilters.type !== 'all') {
                if (transaction.type !== this.currentFilters.type) {
                    return false;
                }
            }
            
            // Date range filter
            const transactionDate = new Date(transaction.timestamp);
            
            // From date filter
            if (this.currentFilters.dateFrom) {
                const fromDate = new Date(this.currentFilters.dateFrom);
                fromDate.setHours(0, 0, 0, 0); // Start of day
                
                if (transactionDate < fromDate) {
                    return false;
                }
            }
            
            // To date filter
            if (this.currentFilters.dateTo) {
                const toDate = new Date(this.currentFilters.dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                
                if (transactionDate > toDate) {
                    return false;
                }
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const searchableFields = [
                    transaction.description,
                    transaction.recipientName,
                    transaction.recipientIBAN,
                    transaction.amount.toString(),
                    transaction.category
                ].filter(field => field).map(field => field.toLowerCase());
                
                const matchesSearch = searchableFields.some(field => 
                    field.includes(searchTerm)
                );
                
                if (!matchesSearch) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Reset to first page when filters change
        this.pagination.currentPage = 1;
        this.renderTransactions();
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(filterType, value) {
        this.currentFilters[filterType] = value;
        this.applyFilters();
        
        console.log('🔍 Filter updated:', filterType, value);
        console.log('📊 Showing', this.filteredTransactions.length, 'transactions');
    }

    /**
     * Calculate pagination values
     */
    calculatePagination() {
        this.pagination.totalTransactions = this.filteredTransactions.length;
        this.pagination.totalPages = Math.ceil(this.pagination.totalTransactions / this.pagination.pageSize);
        
        // Ensure current page is valid
        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
        }
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        let paginationContainer = document.querySelector('.pagination');
        
        if (!paginationContainer) {
            const transactionsContainer = document.querySelector('.transactions-list').parentElement;
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination';
            transactionsContainer.appendChild(paginationContainer);
        }

        if (this.pagination.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = `pagination-btn ${this.pagination.currentPage === 1 ? 'disabled' : ''}`;
        prevButton.textContent = 'Previous';
        prevButton.disabled = this.pagination.currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (this.pagination.currentPage > 1) {
                this.pagination.currentPage--;
                this.renderTransactions();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Page numbers
        const startPage = Math.max(1, this.pagination.currentPage - 2);
        const endPage = Math.min(this.pagination.totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-btn ${i === this.pagination.currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                this.pagination.currentPage = i;
                this.renderTransactions();
            });
            paginationContainer.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = `pagination-btn ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}`;
        nextButton.textContent = 'Next';
        nextButton.disabled = this.pagination.currentPage === this.pagination.totalPages;
        nextButton.addEventListener('click', () => {
            if (this.pagination.currentPage < this.pagination.totalPages) {
                this.pagination.currentPage++;
                this.renderTransactions();
            }
        });
        paginationContainer.appendChild(nextButton);

        // Page info
        const pageInfo = document.createElement('div');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Page ${this.pagination.currentPage} of ${this.pagination.totalPages} (${this.pagination.totalTransactions} transactions)`;
        paginationContainer.appendChild(pageInfo);
    }

    /**
     * Utility method for debouncing
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get display name for account type (same as DashboardManager)
     */
    getAccountTypeDisplay(type) {
        const types = {
            'checking': 'Checking Account',
            'savings': 'Savings Account', 
            'investment': 'Investment Account'
        };
        return types[type] || type;
    }

    /**
     * Refresh transactions data
     */
    async refresh() {
        await this.loadTransactions();
        this.pagination.currentPage = 1;
        await this.renderTransactions();
    }
}

/**
 * Main Dashboard Manager - Handles core dashboard functionality
 */
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userAccounts = [];
        this.recentTransactions = [];
        this.isInitialized = false;
        this.transactionsManager = new TransactionsManager();
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
            this.setupTransferForm();

            // Initialize transactions manager if on transactions page
            if (this.getCurrentPage() === 'transactions') {
                await this.transactionsManager.init();
            }

            this.isInitialized = true;
            console.log('✅ Dashboard Manager initialized successfully');

        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    }

    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('/dashboard/dashboard.html')) return 'dashboard';
        if (path.includes('/dashboard/accounts.html')) return 'accounts';
        if (path.includes('/dashboard/transfer.html')) return 'transfer';
        if (path.includes('/dashboard/transactions.html')) return 'transactions';
        return 'unknown';
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
            await this.updateDashboardHeader();
            await this.updateTransferForm();
            
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
     * Update transfer form with real account data
     */
    async updateTransferForm() {
        await this.populateAccountDropdowns();
        await this.updateMyAccountsIBANs();
        await this.updateRecentTransfersList();
    }

    /**
     * Populate account dropdowns in transfer form
     */
    async populateAccountDropdowns() {
        const fromAccountSelect = document.getElementById('fromAccount');
        const toAccountSelect = document.getElementById('toAccount');
        
        if (!fromAccountSelect || !toAccountSelect) return;

        // Clear existing options (keep first option)
        while (fromAccountSelect.children.length > 1) {
            fromAccountSelect.removeChild(fromAccountSelect.lastChild);
        }
        while (toAccountSelect.children.length > 1) {
            toAccountSelect.removeChild(toAccountSelect.lastChild);
        }

        // Add user's accounts to dropdowns
        this.userAccounts.forEach(account => {
            const optionFrom = document.createElement('option');
            optionFrom.value = account.id;
            optionFrom.textContent = `${this.getAccountTypeDisplay(account.type)} (${account.maskedAccountNumber}) - ${account.formatBalance()}`;
            fromAccountSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = account.id;
            optionTo.textContent = `My ${this.getAccountTypeDisplay(account.type)} (${account.maskedAccountNumber})`;
            toAccountSelect.appendChild(optionTo);
        });

        // Add "Another User" option to To Account dropdown
        const anotherUserOption = document.createElement('option');
        anotherUserOption.value = 'external';
        anotherUserOption.textContent = 'Another User';
        toAccountSelect.appendChild(anotherUserOption);
    }

    /**
     * Get display name for account type
     */
    getAccountTypeDisplay(type) {
        const types = {
            'checking': 'Checking Account',
            'savings': 'Savings Account',
            'investment': 'Investment Account'
        };
        return types[type] || type;
    }

    /**
     * Update "My Accounts & IBANs" section
     */
    async updateMyAccountsIBANs() {
        const accountIbanList = document.getElementById('accountIbanList');
        if (!accountIbanList) return;

        accountIbanList.innerHTML = '';

        this.userAccounts.forEach(account => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-iban-item';
            accountItem.innerHTML = `
                <div class="account-iban-info">
                    <strong>${this.getAccountTypeDisplay(account.type)}</strong>
                    <span class="iban-number">${account.iban}</span>
                </div>
                <div class="account-balance-small">${account.formatBalance()}</div>
            `;
            accountIbanList.appendChild(accountItem);
        });
    }

    /**
     * Update recent transfers list with real data
     */
    async updateRecentTransfersList() {
        const recentTransfersList = document.getElementById('recentTransfersList');
        if (!recentTransfersList) return;

        // Get recent transfer transactions
        const transferTransactions = this.recentTransactions.filter(
            txn => txn.type === 'transfer' || txn.type === 'deposit'
        ).slice(0, 3);

        recentTransfersList.innerHTML = '';

        if (transferTransactions.length === 0) {
            recentTransfersList.innerHTML = '<div class="empty-state">No recent transfers</div>';
            return;
        }

        transferTransactions.forEach(transaction => {
            const transferItem = document.createElement('div');
            transferItem.className = 'transfer-item';
            
            const isOutgoing = transaction.type === 'transfer';
            const description = isOutgoing 
                ? `To ${transaction.recipientName || 'Unknown'}`
                : `From ${transaction.recipientName || 'Unknown'}`;

            transferItem.innerHTML = `
                <div class="transfer-details">
                    <p>${description}</p>
                    <small>${transaction.displayDate}</small>
                </div>
                <div class="transfer-amount ${isOutgoing ? 'negative' : 'positive'}">
                    ${isOutgoing ? '-' : '+'}${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    }).format(transaction.amount)}
                </div>
            `;
            recentTransfersList.appendChild(transferItem);
        });
    }

    /**
     * Setup transfer form event listeners
     */
    setupTransferForm() {
        console.log('🔧 Setting up transfer form...');
        
        const toAccountSelect = document.getElementById('toAccount');
        const externalAccountGroup = document.getElementById('externalAccountGroup');
        const ibanInput = document.getElementById('ibanAccount');
        const fromAccountSelect = document.getElementById('fromAccount');
        const amountInput = document.getElementById('amount');

        console.log('📝 Form elements found:', {
            toAccountSelect: !!toAccountSelect,
            externalAccountGroup: !!externalAccountGroup,
            ibanInput: !!ibanInput,
            fromAccountSelect: !!fromAccountSelect,
            amountInput: !!amountInput
        });

        // Show/hide external account fields
        if (toAccountSelect && externalAccountGroup) {
            toAccountSelect.addEventListener('change', (e) => {
                console.log('🔄 To account changed:', e.target.value);
                if (e.target.value === 'external') {
                    externalAccountGroup.style.display = 'block';
                } else {
                    externalAccountGroup.style.display = 'none';
                }
                this.updateTransferSummary();
            });
        }

        // IBAN validation
        if (ibanInput) {
            ibanInput.addEventListener('input', this.debounce(() => {
                this.validateIBAN(ibanInput.value);
            }, 500));
        }

        // Balance info and transfer summary updates
        if (fromAccountSelect && amountInput) {
            fromAccountSelect.addEventListener('change', () => {
                console.log('🔄 From account changed');
                this.updateBalanceInfo();
                this.updateTransferSummary();
            });
            
            amountInput.addEventListener('input', () => {
                console.log('💰 Amount input:', amountInput.value);
                this.updateBalanceInfo();
                this.updateTransferSummary();
            });
        }

        // Transfer type changes
        if (toAccountSelect) {
            toAccountSelect.addEventListener('change', () => {
                this.updateTransferSummary();
            });
        }

        console.log('✅ Transfer form setup complete');
    }

    /**
     * Calculate transfer fee based on amount and type
     */
    calculateTransferFee(amount, isExternal = false) {
        // Internal transfer fee: 1% with $1 minimum, $5 maximum
        if (!isExternal) {
            const fee = Math.max(1, Math.min(amount * 0.01, 5));
            return parseFloat(fee.toFixed(2));
        }
        
        // External transfer fee: 2% with $2 minimum, $15 maximum
        const fee = Math.max(2, Math.min(amount * 0.02, 15));
        return parseFloat(fee.toFixed(2));
    }

    /**
     * Update transfer summary with dynamic calculations
     */
    updateTransferSummary() {
        console.log('📊 updateTransferSummary called');
        
        const amountInput = document.getElementById('amount');
        const toAccountSelect = document.getElementById('toAccount');
        const transferSummary = document.getElementById('transferSummary');
        const totalAmountElement = document.getElementById('totalAmount');
        const feeAmountElement = document.getElementById('feeAmount');
        
        console.log('🔍 Elements found:', {
            amountInput: !!amountInput,
            toAccountSelect: !!toAccountSelect,
            transferSummary: !!transferSummary,
            totalAmountElement: !!totalAmountElement,
            feeAmountElement: !!feeAmountElement
        });
        
        if (!amountInput || !toAccountSelect || !transferSummary || !totalAmountElement || !feeAmountElement) {
            console.log('❌ Missing elements, returning early');
            return;
        }
        
        const amount = parseFloat(amountInput.value) || 0;
        const isExternal = toAccountSelect.value === 'external';
        
        console.log('💰 Calculation data:', { amount, isExternal });
        
        if (amount > 0) {
            const fee = this.calculateTransferFee(amount, isExternal);
            const total = amount + fee;
            
            console.log('🧮 Calculated:', { fee, total });
            
            transferSummary.style.display = 'block';
            
            // Update fee display
            feeAmountElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(fee);
            
            // Update total amount
            totalAmountElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(total);
            
            console.log('✅ Summary updated');
        } else {
            transferSummary.style.display = 'none';
            console.log('❌ Amount is 0, hiding summary');
        }
    }

    /**
     * Validate IBAN and show recipient info
     */
    async validateIBAN(iban) {
        const validationElement = document.getElementById('ibanValidation');
        const validationMessage = document.getElementById('validationMessage');
        
        if (!validationElement || !validationMessage) return;

        if (!iban || iban.trim() === '') {
            validationElement.style.display = 'none';
            return;
        }

        // Basic format validation
        if (!Account.isValidIBAN(iban)) {
            validationElement.style.display = 'block';
            validationElement.querySelector('.validation-icon').textContent = '❌';
            validationMessage.textContent = 'Invalid IBAN format';
            return;
        }

        // Check if IBAN exists in system
        validationElement.style.display = 'block';
        validationElement.querySelector('.validation-icon').textContent = '⏳';
        validationMessage.textContent = 'Checking IBAN...';

        try {
            const recipientAccount = dataManager.getAccountByIBAN(iban);
            
            if (recipientAccount) {
                const recipientUser = dataManager.getUserById(recipientAccount.userId);
                validationElement.querySelector('.validation-icon').textContent = '✅';
                validationMessage.textContent = `Account found: ${recipientUser?.fullName || 'Unknown User'}`;
            } else {
                validationElement.querySelector('.validation-icon').textContent = '❌';
                validationMessage.textContent = 'Account not found';
            }
        } catch (error) {
            validationElement.querySelector('.validation-icon').textContent = '❌';
            validationMessage.textContent = 'Error validating IBAN';
        }
    }

    /**
     * Update balance information based on selected account
     */
    async updateBalanceInfo() {
        const fromAccountSelect = document.getElementById('fromAccount');
        const amountInput = document.getElementById('amount');
        const balanceInfo = document.getElementById('balanceInfo');
        const availableBalance = document.getElementById('availableBalance');
        
        if (!fromAccountSelect || !amountInput || !balanceInfo || !availableBalance) return;

        const selectedAccountId = fromAccountSelect.value;
        const amount = parseFloat(amountInput.value) || 0;

        if (!selectedAccountId) {
            balanceInfo.style.display = 'none';
            return;
        }

        const account = dataManager.getAccountById(selectedAccountId);
        if (account) {
            balanceInfo.style.display = 'block';
            availableBalance.textContent = account.formatBalance();
            
            // Highlight if insufficient funds
            if (amount > account.balance) {
                balanceInfo.style.color = 'var(--error-color)';
            } else {
                balanceInfo.style.color = 'var(--success-color)';
            }
        }
    }

    // Show success message
    showTransferSuccess(message) {
        const successElement = document.getElementById('transferSuccess');
        const messageElement = document.getElementById('successMessage');
        
        if (successElement && messageElement) {
            messageElement.textContent = message;
            successElement.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideTransferSuccess();
            }, 5000);
        }
    }

    // Hide success message
    hideTransferSuccess() {
        const successElement = document.getElementById('transferSuccess');
        if (successElement) {
            successElement.style.display = 'none';
        }
    }

    /**
     * Process transfer form submission
     */
    async processTransfer(formData) {
        try {
            const fromAccountId = formData.get('fromAccount');
            const toAccountValue = formData.get('toAccount');
            const amount = parseFloat(formData.get('amount'));
            const description = formData.get('description') || '';
            const recipientEmail = formData.get('externalAccount');
            const recipientIBAN = formData.get('ibanAccount');

            // Validate inputs
            if (!fromAccountId || !toAccountValue || !amount || amount <= 0) {
                throw new Error('Please fill all required fields correctly');
            }

            let transferResult;

            if (toAccountValue === 'external') {
                // External transfer via IBAN
                if (!recipientIBAN) {
                    throw new Error('Please enter recipient IBAN');
                }

                if (!Account.isValidIBAN(recipientIBAN)) {
                    throw new Error('Invalid IBAN format');
                }

                transferResult = await dataManager.processTransfer(
                    fromAccountId,
                    recipientIBAN,
                    amount,
                    description
                );

            } else {
                // Internal transfer between own accounts
                transferResult = await dataManager.processTransfer(
                    fromAccountId,
                    toAccountValue,
                    amount,
                    description
                );
            }

            if (transferResult.success) {
                // ✅ REDIRECT TO SUCCESS PAGE
                const successUrl = `transfer-success.html?amount=${amount}`;
                window.location.href = successUrl;
                
            } else {
                throw new Error(transferResult.error);
            }

        } catch (error) {
            console.error('❌ Transfer failed:', error);
            await this.showError(error.message);
        }
    }

    /**
     * Utility method for debouncing
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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

        if (monthlyIncomeElement) {
            monthlyIncomeElement.textContent = '$4,250.00';
        }

        if (monthlyExpensesElement) {
            monthlyExpensesElement.textContent = '$2,875.50';
        }
    }

    /**
     * Update recent transactions list
     */
    async updateRecentTransactions() {
        const transactionList = document.querySelector('.transaction-list');
        
        if (!transactionList) return;

        transactionList.innerHTML = '';

        this.recentTransactions.forEach(transaction => {
            const transactionItem = this.createTransactionElement(transaction);
            transactionList.appendChild(transactionItem);
        });

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
     * UI Feedback Methods
     */
    async showSuccess(message) {
        if (window.finSimApp) {
            await finSimApp.showSuccess(message);
        }
    }

    async showError(message) {
        if (window.finSimApp) {
            await finSimApp.showError(message);
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

// Create global dashboard manager instance
window.dashboardManager = new DashboardManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardManager.init();
    });
} else {
    window.dashboardManager.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}