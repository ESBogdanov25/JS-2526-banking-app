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
     * Utility function to get user initials
     */
    getUserInitials(user) {
        const first = user.firstName ? user.firstName[0] : '';
        const last = user.lastName ? user.lastName[0] : '';
        return (first + last).toUpperCase() || 'AU';
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
     * Setup admin event listeners
     */
    setupEventListeners() {
        console.log('🎯 Setting up admin event listeners...');
        // Will be implemented in Phase 2
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

    /**
     * Initialize users page (Phase 2)
     */
    async initializeUsersPage() {
        console.log('👥 Initializing users page...');
        // Will be implemented in Phase 2
    }

    /**
     * Initialize reports page (Phase 2)
     */
    async initializeReportsPage() {
        console.log('📈 Initializing reports page...');
        // Will be implemented in Phase 2
    }
}

// Create and initialize admin manager
document.addEventListener('DOMContentLoaded', function() {
    window.adminManager = new AdminManager();
});