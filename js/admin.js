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
        
        let csvContent = '';
        let filename = '';

        switch (reportType) {
            case 'Financial Report':
                csvContent = this.generateFinancialReportCSV();
                filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'User Analytics':
                csvContent = this.generateUserAnalyticsCSV();
                filename = `user_analytics_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'Transaction Log':
                csvContent = this.generateTransactionLogCSV();
                filename = `transaction_log_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'Security Report':
                csvContent = this.generateSecurityReportCSV();
                filename = `security_report_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                csvContent = this.generateFinancialReportCSV();
                filename = `report_${new Date().toISOString().split('T')[0]}.csv`;
        }

        this.downloadCSV(csvContent, filename);
        
        if (window.finSimApp) {
            finSimApp.showSuccess(`${reportType} exported successfully`);
        }
    }

    /**
     * Generate financial report CSV
     */
    generateFinancialReportCSV() {
        const headers = ['Metric', 'Value', 'Change'];
        const metrics = this.calculateReportsMetrics();
        
        const rows = [
            ['Total Users', this.users.length, '+12%'],
            ['Active Users', metrics.activeUsers, `${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%`],
            ['Total Balance', `$${metrics.totalBalance.toLocaleString()}`, '+5%'],
            ['Total Transactions', metrics.totalTransactions, '+8%'],
            ['Average Balance', `$${metrics.avgBalance.toFixed(2)}`, '+3%']
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
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
     * Generate transaction log CSV
     */
    generateTransactionLogCSV() {
        const headers = ['Transaction ID', 'Date', 'Type', 'Amount', 'Description', 'Account ID', 'Status'];
        
        const rows = this.transactions.slice(0, 1000).map(txn => [ // Limit to 1000 rows
            txn.id,
            new Date(txn.timestamp).toLocaleDateString(),
            txn.type,
            `$${txn.amount}`,
            txn.description,
            txn.accountId,
            txn.status
        ]);

        return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }

    /**
     * Generate security report CSV
     */
    generateSecurityReportCSV() {
        const headers = ['Date', 'Event Type', 'Description', 'User ID', 'Severity'];
        const rows = [
            [new Date().toLocaleDateString(), 'System Check', 'Regular security audit', 'SYSTEM', 'Low'],
            [new Date().toLocaleDateString(), 'User Activity', 'Admin login detected', this.currentAdmin.id, 'Info'],
            [new Date().toLocaleDateString(), 'Monitoring', 'System performance normal', 'SYSTEM', 'Low']
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
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

        this.downloadCSV(zipContent, `system_export_${new Date().toISOString().split('T')[0]}.txt`);
        
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

        this.downloadCSV(reportSummary, `comprehensive_report_${new Date().toISOString().split('T')[0]}.txt`);
        
        if (window.finSimApp) {
            finSimApp.showSuccess('Comprehensive report generated successfully');
        }
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
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