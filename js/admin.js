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
     * Initialize reports page (Phase 3)
     */
    async initializeReportsPage() {
        console.log('📈 Initializing reports page...');
        // Will be implemented in Phase 3
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