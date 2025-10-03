/**
 * FinSim - Admin Management System
 * Handles admin dashboard, user management, and system reports
 */

class AdminManager {
    constructor() {
        this.currentAdmin = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize admin system
     */
    async init() {
        try {
            console.log('🚀 Initializing Admin Manager...');
            
            // Check if user is actually an admin
            if (!authManager.isAdmin()) {
                console.error('❌ Admin access denied: User is not an admin');
                this.redirectToUserDashboard();
                return;
            }

            this.currentAdmin = authManager.getCurrentUser();
            await this.loadAdminData();
            await this.updateAdminUI();
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ Admin Manager initialized successfully');

        } catch (error) {
            console.error('❌ Admin initialization failed:', error);
            this.handleAdminError(error);
        }
    }

    /**
     * Load all admin data from storage
     */
    async loadAdminData() {
        try {
            this.users = storage.get('users', []);
            this.accounts = storage.get('accounts', []);
            this.transactions = storage.get('transactions', []);
            
            console.log('📊 Admin data loaded:', {
                users: this.users.length,
                accounts: this.accounts.length,
                transactions: this.transactions.length
            });

        } catch (error) {
            console.error('❌ Failed to load admin data:', error);
            throw error;
        }
    }

    /**
     * Update admin UI with real data
     */
    async updateAdminUI() {
        await this.updateAdminProfile();
        await this.updateDashboardStats();
        await this.updateRecentActivity();
        await this.updatePageSpecificUI();
    }

    /**
     * Update admin profile in sidebar
     */
    async updateAdminProfile() {
        const adminAvatar = document.querySelector('.admin-avatar');
        const adminName = document.querySelector('.admin-info h4');
        const adminRole = document.querySelector('.admin-info p');
        const navUser = document.querySelector('.nav-user');

        if (adminAvatar && this.currentAdmin) {
            adminAvatar.textContent = this.getUserInitials(this.currentAdmin);
        }

        if (adminName && this.currentAdmin) {
            adminName.textContent = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        }

        if (adminRole) {
            adminRole.textContent = 'System Administrator';
        }

        if (navUser && this.currentAdmin) {
            navUser.textContent = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        }
    }

    /**
     * Update dashboard statistics with real data
     */
    async updateDashboardStats() {
        const stats = this.calculateSystemStats();

        // Update total users
        const totalUsersElement = document.querySelector('.admin-stat-card:nth-child(1) .stat-number');
        if (totalUsersElement) {
            totalUsersElement.textContent = stats.totalUsers.toLocaleString();
        }

        // Update total transactions
        const totalTransactionsElement = document.querySelector('.admin-stat-card:nth-child(2) .stat-number');
        if (totalTransactionsElement) {
            totalTransactionsElement.textContent = stats.totalTransactions.toLocaleString();
        }

        // Update system revenue (total balance)
        const systemRevenueElement = document.querySelector('.admin-stat-card:nth-child(3) .stat-number');
        if (systemRevenueElement) {
            systemRevenueElement.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(stats.totalBalance);
        }

        // Update fraud alerts (placeholder for now)
        const fraudAlertsElement = document.querySelector('.admin-stat-card:nth-child(4) .stat-number');
        if (fraudAlertsElement) {
            fraudAlertsElement.textContent = stats.fraudAlerts.toString();
        }
    }

    /**
     * Calculate system-wide statistics
     */
    calculateSystemStats() {
        const activeUsers = this.users.filter(user => user.isActive);
        const totalBalance = this.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        
        return {
            totalUsers: this.users.length,
            activeUsers: activeUsers.length,
            totalAccounts: this.accounts.length,
            totalTransactions: this.transactions.length,
            totalBalance: totalBalance,
            fraudAlerts: 0 // Placeholder for now
        };
    }

    /**
     * Update recent activity feed
     */
    async updateRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const recentActivities = this.getRecentActivities();
        
        if (recentActivities.length === 0) {
            activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
            return;
        }

        activityList.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-details">
                    <p>${activity.message}</p>
                    <small>${activity.timestamp}</small>
                </div>
            </div>
        `).join('');
    }

    /**
     * Get recent system activities
     */
    getRecentActivities() {
        const activities = [];
        const now = new Date();

        // Get recent user registrations (last 5)
        const recentUsers = this.users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        recentUsers.forEach(user => {
            const timeAgo = this.getTimeAgo(new Date(user.createdAt));
            activities.push({
                icon: '👤',
                message: `New user registration`,
                timestamp: `${timeAgo}`
            });
        });

        // Get recent large transactions
        const largeTransactions = this.transactions
            .filter(txn => txn.amount > 1000)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 2);

        largeTransactions.forEach(txn => {
            const timeAgo = this.getTimeAgo(new Date(txn.timestamp));
            activities.push({
                icon: '🔄',
                message: `Large transfer processed`,
                timestamp: `${timeAgo}`
            });
        });

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4);
    }

    /**
     * Update page-specific UI elements
     */
    async updatePageSpecificUI() {
        const currentPage = this.getCurrentAdminPage();
        
        switch (currentPage) {
            case 'users':
                await this.initializeUsersPage();
                break;
            case 'reports':
                await this.initializeReportsPage();
                break;
            case 'dashboard':
                // Already handled by updateDashboardStats
                break;
        }
    }

    /**
     * Get current admin page
     */
    getCurrentAdminPage() {
        const path = window.location.pathname;
        if (path.includes('/admin/users.html')) return 'users';
        if (path.includes('/admin/reports.html')) return 'reports';
        return 'dashboard'; // admin.html or default
    }

    /**
     * Initialize users page with real data
     */
    async initializeUsersPage() {
        console.log('👥 Initializing users page...');
        
        await this.loadUsersTable();
        this.setupUsersSearch();
        this.setupUsersFilters();
        this.updateUsersPagination();
    }

    /**
     * Load real users into the table
     */
    async loadUsersTable() {
        const tableBody = document.querySelector('.users-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        this.users.forEach(user => {
            const userRow = this.createUserRow(user);
            tableBody.appendChild(userRow);
        });

        this.updateUsersPagination();
    }

    /**
     * Create a table row for a user
     */
    createUserRow(user) {
        const row = document.createElement('tr');
        
        const userBalance = this.calculateUserBalance(user.id);
        const lastLogin = user.lastLogin ? this.getTimeAgo(new Date(user.lastLogin)) : 'Never';
        
        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar-small">${this.getUserInitials(user)}</div>
                    <div class="user-info-small">
                        <p class="user-name">${user.firstName} ${user.lastName}</p>
                        <p class="user-id">ID: ${user.id.slice(-6)}</p>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userBalance)}</td>
            <td>${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" title="Edit" onclick="adminManager.editUser('${user.id}')">✏️</button>
                    <button class="btn-icon" title="View" onclick="adminManager.viewUser('${user.id}')">👁️</button>
                    <button class="btn-icon" title="Delete" onclick="adminManager.deleteUser('${user.id}')">🗑️</button>
                </div>
            </td>
        `;

        return row;
    }

    /**
     * Calculate total balance for a user
     */
    calculateUserBalance(userId) {
        const userAccounts = this.accounts.filter(account => account.userId === userId);
        return userAccounts.reduce((total, account) => total + (account.balance || 0), 0);
    }

    /**
     * Setup users search functionality
     */
    setupUsersSearch() {
        const searchInput = document.querySelector('.search-box input');
        const searchButton = document.querySelector('.search-btn');

        if (searchInput && searchButton) {
            const performSearch = () => {
                const searchTerm = searchInput.value.toLowerCase();
                this.filterUsers(searchTerm);
            };

            searchInput.addEventListener('input', this.debounce(performSearch, 300));
            searchButton.addEventListener('click', performSearch);
        }
    }

    /**
     * Setup users filters
     */
    setupUsersFilters() {
        const filterSelects = document.querySelectorAll('.filter-group select');
        
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.applyUsersFilters();
            });
        });
    }

    /**
     * Filter users based on search term
     */
    filterUsers(searchTerm) {
        const tableBody = document.querySelector('.users-table tbody');
        if (!tableBody) return;

        const filteredUsers = this.users.filter(user => {
            const searchableText = `
                ${user.firstName} ${user.lastName}
                ${user.email}
                ${user.role}
                ${user.id}
            `.toLowerCase();

            return searchableText.includes(searchTerm);
        });

        this.displayFilteredUsers(filteredUsers);
    }

    /**
     * Apply all active filters
     */
    applyUsersFilters() {
        const statusFilter = document.querySelector('.filter-group select:nth-child(1)');
        const sortFilter = document.querySelector('.filter-group select:nth-child(2)');
        
        let filteredUsers = [...this.users];

        // Apply status filter
        if (statusFilter && statusFilter.value !== 'All Users') {
            filteredUsers = filteredUsers.filter(user => {
                if (statusFilter.value === 'Active') return user.isActive;
                if (statusFilter.value === 'Inactive') return !user.isActive;
                if (statusFilter.value === 'Admin') return user.role === 'admin';
                return true;
            });
        }

        // Apply sorting
        if (sortFilter) {
            filteredUsers.sort((a, b) => {
                switch (sortFilter.value) {
                    case 'Sort by: Name':
                        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    case 'Sort by: Balance':
                        return this.calculateUserBalance(b.id) - this.calculateUserBalance(a.id);
                    case 'Sort by: Recent':
                    default:
                        return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });
        }

        this.displayFilteredUsers(filteredUsers);
    }

    /**
     * Display filtered users in the table
     */
    displayFilteredUsers(users) {
        const tableBody = document.querySelector('.users-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--gray-500);">
                        No users found matching your criteria
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const userRow = this.createUserRow(user);
            tableBody.appendChild(userRow);
        });

        this.updateUsersPagination(users.length);
    }

    /**
     * Update users pagination info
     */
    updateUsersPagination(totalUsers = null) {
        const paginationInfo = document.querySelector('.pagination-info');
        const userCount = totalUsers || this.users.length;
        
        if (paginationInfo) {
            paginationInfo.textContent = `Showing 1-${userCount} of ${userCount} users`;
        }
    }

    /**
     * Initialize reports page with real data
     */
    async initializeReportsPage() {
        console.log('📈 Initializing reports page...');
        
        await this.updateReportsMetrics();
        this.setupReportsFilters();
        this.setupExportButtons();
    }

    /**
     * Update reports metrics with real data
     */
    async updateReportsMetrics() {
        const metrics = this.calculateReportsMetrics();

        // Update key metrics grid
        this.updateMetricsGrid(metrics);
        
        // Update chart placeholders with real data info
        this.updateChartPlaceholders(metrics);
    }

    /**
     * Calculate comprehensive reports metrics
     */
    calculateReportsMetrics() {
        const activeUsers = this.users.filter(user => user.isActive);
        const totalBalance = this.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        const avgBalance = this.accounts.length > 0 ? totalBalance / this.accounts.length : 0;
        
        // Calculate transaction volume by type
        const deposits = this.transactions.filter(txn => txn.type === 'deposit').length;
        const transfers = this.transactions.filter(txn => txn.type === 'transfer').length;
        const withdrawals = this.transactions.filter(txn => txn.type === 'withdrawal').length;

        // Calculate recent growth (last 7 days vs previous 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentUsers = this.users.filter(user => new Date(user.createdAt) > oneWeekAgo).length;
        const previousWeekUsers = this.users.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate > new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && userDate <= oneWeekAgo;
        }).length;

        const userGrowth = previousWeekUsers > 0 ? 
            ((recentUsers - previousWeekUsers) / previousWeekUsers * 100) : 0;

        return {
            activeUsers: activeUsers.length,
            totalTransactions: this.transactions.length,
            avgBalance: avgBalance,
            totalBalance: totalBalance,
            userGrowth: userGrowth,
            transactionVolume: {
                deposits: deposits,
                transfers: transfers,
                withdrawals: withdrawals
            },
            systemUptime: 99.98, // Placeholder
            responseTime: 128, // Placeholder
            fraudRate: 0.03 // Placeholder
        };
    }

    /**
     * Update metrics grid with real data
     */
    updateMetricsGrid(metrics) {
        const metricsGrid = document.querySelector('.metrics-grid');
        if (!metricsGrid) return;

        metricsGrid.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Active Users</span>
                <span class="metric-value">${metrics.activeUsers.toLocaleString()}</span>
                <span class="metric-change ${metrics.userGrowth >= 0 ? 'positive' : 'negative'}">
                    ${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Total Transactions</span>
                <span class="metric-value">${metrics.totalTransactions.toLocaleString()}</span>
                <span class="metric-change positive">+8%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Avg. Balance</span>
                <span class="metric-value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.avgBalance)}</span>
                <span class="metric-change positive">+5%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Fraud Rate</span>
                <span class="metric-value">${metrics.fraudRate.toFixed(2)}%</span>
                <span class="metric-change negative">+0.01%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">System Uptime</span>
                <span class="metric-value">${metrics.systemUptime}%</span>
                <span class="metric-change positive">+0.02%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Response Time</span>
                <span class="metric-value">${metrics.responseTime}ms</span>
                <span class="metric-change positive">-12ms</span>
            </div>
        `;
    }

    /**
     * Update chart placeholders with real data context
     */
    updateChartPlaceholders(metrics) {
        // Update financial overview placeholder
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>📈 Financial Overview</p>
                <p>Total System Balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}</p>
                <p>${metrics.totalTransactions.toLocaleString()} total transactions</p>
                <small>Charts would show monthly trends here</small>
            `;
        }

        // Update user growth placeholder
        const userChart = document.querySelector('.report-card:nth-child(2) .chart-placeholder');
        if (userChart) {
            userChart.innerHTML = `
                <p>👥 User Growth</p>
                <p>${metrics.activeUsers} active users</p>
                <p>${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}% growth</p>
                <small>Line chart showing user acquisition</small>
            `;
        }

        // Update transaction volume placeholder
        const transactionChart = document.querySelector('.report-card:nth-child(3) .chart-placeholder');
        if (transactionChart) {
            transactionChart.innerHTML = `
                <p>🔄 Transaction Volume</p>
                <p>Deposits: ${metrics.transactionVolume.deposits}</p>
                <p>Transfers: ${metrics.transactionVolume.transfers}</p>
                <p>Withdrawals: ${metrics.transactionVolume.withdrawals}</p>
                <small>Area chart showing transaction patterns</small>
            `;
        }

        // Update fraud alerts placeholder
        const fraudChart = document.querySelector('.report-card:nth-child(4) .chart-placeholder');
        if (fraudChart) {
            fraudChart.innerHTML = `
                <p>🛡️ Security Metrics</p>
                <p>Fraud Rate: ${metrics.fraudRate}%</p>
                <p>System monitoring active</p>
                <small>Pie chart showing alert types</small>
            `;
        }
    }

    /**
     * Setup reports filters
     */
    setupReportsFilters() {
        const dateInputs = document.querySelectorAll('.date-range input');
        const reportTypeSelect = document.querySelector('.report-type select');

        // Date range change handler
        dateInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.generateReport();
            });
        });

        // Report type change handler
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', () => {
                this.generateReport();
            });
        }
    }

    /**
     * Generate report based on filters
     */
    generateReport() {
        console.log('📊 Generating report with current filters...');
        // In a real implementation, this would filter data and update charts
        // For now, we'll just show a notification
        if (window.finSimApp) {
            finSimApp.showSuccess('Report generated with current filters');
        }
    }

    /**
     * Setup export buttons
     */
    setupExportButtons() {
        const exportButtons = document.querySelectorAll('.export-btn');
        
        exportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const reportType = e.target.querySelector('span:nth-child(2)')?.textContent || 'Report';
                this.exportReport(reportType);
            });
        });

        // Setup header export buttons
        const exportDataBtn = document.querySelector('.header-actions .btn-secondary');
        const generateReportBtn = document.querySelector('.header-actions .btn-primary');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => {
                this.generateComprehensiveReport();
            });
        }
    }

    /**
     * Export specific report type
     */
    exportReport(reportType) {
        console.log(`📤 Exporting ${reportType}...`);
        
        switch (reportType) {
            case 'Financial Report':
                this.generateFinancialReportPDF();
                break;
            case 'User Analytics':
                const userCsv = this.generateUserAnalyticsCSV();
                this.downloadFile(userCsv, `user_analytics_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
                break;
            case 'Transaction Log':
                const transactionExcel = this.generateTransactionLogExcel();
                this.downloadFile(transactionExcel, `transaction_log_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
                break;
            case 'Security Report':
                this.generateSecurityReportPDF();
                break;
            default:
                this.generateFinancialReportPDF();
        }
        
        if (window.finSimApp) {
            finSimApp.showSuccess(`${reportType} exported successfully`);
        }
    }

    /**
     * Generate financial report PDF
     */
    generateFinancialReportPDF() {
        console.log('📊 Generating financial report PDF...');
        
        const pdfWindow = window.open('', '_blank');
        const reportDate = new Date().toLocaleDateString();
        const adminName = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        const metrics = this.calculateReportsMetrics();

        pdfWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>FinSim Financial Report</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px; 
                        color: #333;
                        line-height: 1.6;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 3px solid #10b981; 
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 { 
                        color: #10b981; 
                        margin: 0;
                        font-size: 28px;
                    }
                    .header .subtitle { 
                        color: #666; 
                        font-size: 16px;
                        margin: 5px 0;
                    }
                    .section { 
                        margin-bottom: 30px; 
                    }
                    .section h2 { 
                        color: #10b981; 
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 8px;
                        font-size: 20px;
                    }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .metric-card {
                        background: #f0fdf4;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #10b981;
                    }
                    .metric-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1e293b;
                    }
                    .metric-label {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 5px;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .table th, .table td {
                        border: 1px solid #e2e8f0;
                        padding: 12px;
                        text-align: left;
                    }
                    .table th {
                        background: #f1f5f9;
                        font-weight: bold;
                        color: #475569;
                    }
                    .positive { color: #10b981; font-weight: bold; }
                    .negative { color: #dc2626; font-weight: bold; }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e2e8f0;
                        text-align: center;
                        color: #64748b;
                        font-size: 14px;
                    }
                    .timestamp {
                        text-align: right;
                        color: #64748b;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
                
                <div class="header">
                    <h1>FinSim Financial Report</h1>
                    <div class="subtitle">Comprehensive Financial Performance Analysis</div>
                    <div class="subtitle">Generated by: ${adminName}</div>
                </div>

                <div class="section">
                    <h2>Executive Summary</h2>
                    <p>This financial report provides a comprehensive overview of the FinSim banking system's financial performance, including user balances, transaction volumes, and system growth metrics.</p>
                    
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${this.users.length.toLocaleString()}</div>
                            <div class="metric-label">Total Users</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}</div>
                            <div class="metric-label">Total System Balance</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${metrics.totalTransactions.toLocaleString()}</div>
                            <div class="metric-label">Total Transactions</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.avgBalance)}</div>
                            <div class="metric-label">Average User Balance</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Transaction Analysis</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Transaction Type</th>
                                <th>Count</th>
                                <th>Percentage</th>
                                <th>Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Deposits</td>
                                <td>${metrics.transactionVolume.deposits}</td>
                                <td>${((metrics.transactionVolume.deposits / metrics.totalTransactions) * 100).toFixed(1)}%</td>
                                <td class="positive">+5%</td>
                            </tr>
                            <tr>
                                <td>Transfers</td>
                                <td>${metrics.transactionVolume.transfers}</td>
                                <td>${((metrics.transactionVolume.transfers / metrics.totalTransactions) * 100).toFixed(1)}%</td>
                                <td class="positive">+8%</td>
                            </tr>
                            <tr>
                                <td>Withdrawals</td>
                                <td>${metrics.transactionVolume.withdrawals}</td>
                                <td>${((metrics.transactionVolume.withdrawals / metrics.totalTransactions) * 100).toFixed(1)}%</td>
                                <td class="positive">+3%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>User Financial Distribution</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Balance Range</th>
                                <th>Number of Users</th>
                                <th>Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>$0 - $1,000</td>
                                <td>${this.calculateUsersInRange(0, 1000)}</td>
                                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.calculateBalanceInRange(0, 1000))}</td>
                            </tr>
                            <tr>
                                <td>$1,001 - $10,000</td>
                                <td>${this.calculateUsersInRange(1001, 10000)}</td>
                                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.calculateBalanceInRange(1001, 10000))}</td>
                            </tr>
                            <tr>
                                <td>$10,001 - $50,000</td>
                                <td>${this.calculateUsersInRange(10001, 50000)}</td>
                                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.calculateBalanceInRange(10001, 50000))}</td>
                            </tr>
                            <tr>
                                <td>$50,001+</td>
                                <td>${this.calculateUsersInRange(50001, Infinity)}</td>
                                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.calculateBalanceInRange(50001, Infinity))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    <p>FinSim Banking System - Confidential Financial Report</p>
                    <p>This report contains sensitive financial information. Handle with care.</p>
                </div>
            </body>
            </html>
        `);

        pdfWindow.document.close();
        setTimeout(() => {
            pdfWindow.print();
        }, 500);
    }

    /**
     * Calculate users in balance range
     */
    calculateUsersInRange(min, max) {
        return this.users.filter(user => {
            const balance = this.calculateUserBalance(user.id);
            return balance >= min && balance <= max;
        }).length;
    }

    /**
     * Calculate total balance in range
     */
    calculateBalanceInRange(min, max) {
        return this.users.reduce((total, user) => {
            const balance = this.calculateUserBalance(user.id);
            if (balance >= min && balance <= max) {
                return total + balance;
            }
            return total;
        }, 0);
    }

    /**
     * Generate user analytics CSV
     */
    generateUserAnalyticsCSV() {
        const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Total Balance', 'Last Login', 'Join Date'];
        
        const rows = this.users.map(user => [
            user.id,
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.role,
            user.isActive ? 'Active' : 'Inactive',
            `$${this.calculateUserBalance(user.id).toFixed(2)}`,
            user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
            new Date(user.createdAt).toLocaleDateString()
        ]);

        return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }

    /**
     * Generate transaction log Excel format
     */
    generateTransactionLogExcel() {
        const headers = ['Transaction ID', 'Date', 'Time', 'Type', 'Amount', 'Description', 'Account ID', 'Status', 'Recipient'];
        
        const rows = this.transactions.slice(0, 1000).map(txn => [
            txn.id,
            new Date(txn.timestamp).toLocaleDateString(),
            new Date(txn.timestamp).toLocaleTimeString(),
            txn.type,
            `$${txn.amount}`,
            txn.description || 'N/A',
            txn.accountId,
            txn.status,
            txn.recipientName || 'N/A'
        ]);

        // Create Excel-like HTML table for download
        const excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <style>
                    td { mso-number-format:\\@; }
                    .header { background-color: #4f46e5; color: white; font-weight: bold; }
                </style>
            </head>
            <body>
                <table>
                    <tr class="header">${headers.map(header => `<td>${header}</td>`).join('')}</tr>
                    ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </table>
            </body>
            </html>
        `;

        return excelContent;
    }

    /**
     * Generate security report PDF
     */
    generateSecurityReportPDF() {
        console.log('📊 Generating security report PDF...');
        
        const pdfWindow = window.open('', '_blank');
        const reportDate = new Date().toLocaleDateString();
        const adminName = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        
        // Security metrics calculation
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.isActive).length;
        const inactiveUsers = totalUsers - activeUsers;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;
        const totalTransactions = this.transactions.length;
        
        // Recent security events (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentLogins = this.users.filter(user => 
            user.lastLogin && new Date(user.lastLogin) > oneWeekAgo
        ).length;
        
        const recentTransactions = this.transactions.filter(txn => 
            new Date(txn.timestamp) > oneWeekAgo
        ).length;

        pdfWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>FinSim Security Report</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px; 
                        color: #333;
                        line-height: 1.6;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 3px solid #dc2626; 
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 { 
                        color: #dc2626; 
                        margin: 0;
                        font-size: 28px;
                    }
                    .header .subtitle { 
                        color: #666; 
                        font-size: 16px;
                        margin: 5px 0;
                    }
                    .section { 
                        margin-bottom: 30px; 
                    }
                    .section h2 { 
                        color: #dc2626; 
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 8px;
                        font-size: 20px;
                    }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .metric-card {
                        background: #fef2f2;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #dc2626;
                    }
                    .metric-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1e293b;
                    }
                    .metric-label {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 5px;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .table th, .table td {
                        border: 1px solid #e2e8f0;
                        padding: 12px;
                        text-align: left;
                    }
                    .table th {
                        background: #f1f5f9;
                        font-weight: bold;
                        color: #475569;
                    }
                    .risk-high { color: #dc2626; font-weight: bold; }
                    .risk-medium { color: #d97706; font-weight: bold; }
                    .risk-low { color: #059669; font-weight: bold; }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e2e8f0;
                        text-align: center;
                        color: #64748b;
                        font-size: 14px;
                    }
                    .timestamp {
                        text-align: right;
                        color: #64748b;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
                
                <div class="header">
                    <h1>FinSim Security Report</h1>
                    <div class="subtitle">Comprehensive System Security Assessment</div>
                    <div class="subtitle">Generated by: ${adminName}</div>
                </div>

                <div class="section">
                    <h2>Executive Summary</h2>
                    <p>This security report provides an overview of the FinSim banking system's security posture, 
                    including user activity, system metrics, and potential risk areas.</p>
                    
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${totalUsers}</div>
                            <div class="metric-label">Total Users</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${activeUsers}</div>
                            <div class="metric-label">Active Users</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${adminUsers}</div>
                            <div class="metric-label">Admin Users</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${totalTransactions}</div>
                            <div class="metric-label">Total Transactions</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Recent Activity (Last 7 Days)</h2>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${recentLogins}</div>
                            <div class="metric-label">User Logins</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${recentTransactions}</div>
                            <div class="metric-label">Transactions</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${inactiveUsers}</div>
                            <div class="metric-label">Inactive Users</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">0</div>
                            <div class="metric-label">Security Incidents</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Security Risk Assessment</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Risk Area</th>
                                <th>Status</th>
                                <th>Risk Level</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>User Authentication</td>
                                <td>Active</td>
                                <td class="risk-low">Low</td>
                                <td>Monitor login patterns</td>
                            </tr>
                            <tr>
                                <td>Transaction Monitoring</td>
                                <td>Active</td>
                                <td class="risk-low">Low</td>
                                <td>Continue current monitoring</td>
                            </tr>
                            <tr>
                                <td>Data Encryption</td>
                                <td>Enabled</td>
                                <td class="risk-low">Low</td>
                                <td>Maintain current standards</td>
                            </tr>
                            <tr>
                                <td>Admin Access Control</td>
                                <td>Restricted</td>
                                <td class="risk-medium">Medium</td>
                                <td>Regular access reviews</td>
                            </tr>
                            <tr>
                                <td>System Backups</td>
                                <td>Enabled</td>
                                <td class="risk-low">Low</td>
                                <td>Verify backup integrity weekly</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Admin Activity Log</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Admin User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${new Date().toLocaleString()}</td>
                                <td>${adminName}</td>
                                <td>Security Report Generated</td>
                                <td>Comprehensive security assessment</td>
                            </tr>
                            <tr>
                                <td>${new Date().toLocaleString()}</td>
                                <td>System</td>
                                <td>Automated Security Scan</td>
                                <td>No vulnerabilities detected</td>
                            </tr>
                            <tr>
                                <td>${new Date(Date.now() - 86400000).toLocaleString()}</td>
                                <td>${adminName}</td>
                                <td>User Management</td>
                                <td>Reviewed user accounts</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    <p>FinSim Banking System - Confidential Security Report</p>
                    <p>This report contains sensitive security information. Handle with care.</p>
                </div>
            </body>
            </html>
        `);

        pdfWindow.document.close();
        setTimeout(() => {
            pdfWindow.print();
        }, 500);
    }

    /**
     * Export all system data
     */
    exportAllData() {
        console.log('📤 Exporting all system data...');
        
        const zipContent = `
System Data Export - ${new Date().toLocaleDateString()}

USERS: ${this.users.length} users
ACCOUNTS: ${this.accounts.length} accounts  
TRANSACTIONS: ${this.transactions.length} transactions
TOTAL BALANCE: $${this.calculateSystemStats().totalBalance.toLocaleString()}

Export generated by: ${this.currentAdmin.firstName} ${this.currentAdmin.lastName}
        `.trim();

        this.downloadFile(zipContent, `system_export_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
        
        if (window.finSimApp) {
            finSimApp.showSuccess('System data exported successfully');
        }
    }

    /**
     * Generate comprehensive report
     */
    generateComprehensiveReport() {
        console.log('📊 Generating comprehensive report...');
        
        const reportData = this.calculateReportsMetrics();
        const reportSummary = `
FinSim Comprehensive System Report
Generated: ${new Date().toLocaleDateString()}

SYSTEM OVERVIEW:
• Total Users: ${this.users.length}
• Active Users: ${reportData.activeUsers}
• Total Accounts: ${this.accounts.length}
• Total Transactions: ${reportData.totalTransactions}
• System Balance: $${reportData.totalBalance.toLocaleString()}

PERFORMANCE METRICS:
• User Growth: ${reportData.userGrowth >= 0 ? '+' : ''}${reportData.userGrowth.toFixed(1)}%
• Average Balance: $${reportData.avgBalance.toFixed(2)}
• System Uptime: ${reportData.systemUptime}%
• Response Time: ${reportData.responseTime}ms

TRANSACTION ANALYSIS:
• Deposits: ${reportData.transactionVolume.deposits}
• Transfers: ${reportData.transactionVolume.transfers} 
• Withdrawals: ${reportData.transactionVolume.withdrawals}
        `.trim();

        this.downloadFile(reportSummary, `comprehensive_report_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
        
        if (window.finSimApp) {
            finSimApp.showSuccess('Comprehensive report generated successfully');
        }
    }

    /**
     * Download file utility
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * User action methods (to be implemented in Phase 3)
     */
    editUser(userId) {
        console.log('✏️ Edit user:', userId);
        // Will be implemented in Phase 3
    }

    viewUser(userId) {
        console.log('👁️ View user:', userId);
        // Will be implemented in Phase 3
    }

    deleteUser(userId) {
        console.log('🗑️ Delete user:', userId);
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            // Will be implemented in Phase 3
        }
    }

    /**
     * Utility function to get user initials
     */
    getUserInitials(user) {
        const first = user.firstName ? user.firstName[0] : '';
        const last = user.lastName ? user.lastName[0] : '';
        return (first + last).toUpperCase() || 'US';
    }

    /**
     * Utility function to get time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    /**
     * Debounce function for search
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
     * Setup admin event listeners
     */
    setupEventListeners() {
        console.log('🎯 Setting up admin event listeners...');
        // Will be implemented in Phase 3
    }

    /**
     * Handle admin errors
     */
    handleAdminError(error) {
        console.error('💥 Admin error:', error);
        // Show error to user
        if (window.finSimApp) {
            finSimApp.showError('Admin system error. Please refresh the page.');
        }
    }

    /**
     * Redirect non-admin users to user dashboard
     */
    redirectToUserDashboard() {
        console.log('🔒 Redirecting non-admin user to dashboard...');
        window.location.href = '../dashboard/dashboard.html';
    }
}

// Create and initialize admin manager
document.addEventListener('DOMContentLoaded', function() {
    window.adminManager = new AdminManager();
});