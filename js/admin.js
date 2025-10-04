/**
 * FinSim - Admin Management System
 * Handles admin dashboard, user management, and system reports
 */

class AdminManager {
    constructor() {
        this.currentAdmin = null;
        this.isInitialized = false;
        this.currentFilters = {
            dateFrom: null,
            dateTo: null,
            reportType: 'Financial Overview'
        };
        // User management properties
        this.currentUsersPage = 1;
        this.usersPageSize = 10;
        this.currentUsersSearch = '';
        this.currentUsersFilters = {
            status: 'All Users',
            sortBy: 'Sort by: Recent'
        };
        this.filteredUsers = [];
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
        
        this.currentUsersPage = 1;
        this.usersPageSize = 10;
        this.currentUsersSearch = '';
        this.currentUsersFilters = {
            status: 'All Users',
            sortBy: 'Sort by: Recent'
        };
        
        await this.loadUsersTable();
        this.setupUsersSearch();
        this.setupUsersFilters();
        this.setupAddUserButton();
        this.updateUsersPagination();
    }

    /**
     * Load real users into the table with pagination
     */
    async loadUsersTable() {
        const tableBody = document.querySelector('.users-table tbody');
        if (!tableBody) return;

        // Apply search and filters
        this.applyUsersFiltersAndSearch();
        
        // Calculate pagination
        const startIndex = (this.currentUsersPage - 1) * this.usersPageSize;
        const endIndex = startIndex + this.usersPageSize;
        const usersToShow = this.filteredUsers.slice(startIndex, endIndex);

        tableBody.innerHTML = '';

        if (usersToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--gray-500);">
                        ${this.filteredUsers.length === 0 ? 'No users found matching your criteria' : 'No users on this page'}
                    </td>
                </tr>
            `;
            return;
        }

        usersToShow.forEach(user => {
            const userRow = this.createUserRow(user);
            tableBody.appendChild(userRow);
        });

        this.updateUsersPagination();
    }

    /**
     * Apply search and filters to users
     */
    applyUsersFiltersAndSearch() {
        let filteredUsers = [...this.users];

        // Apply search
        if (this.currentUsersSearch) {
            const searchTerm = this.currentUsersSearch.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                const searchableText = `
                    ${user.firstName} ${user.lastName}
                    ${user.email}
                    ${user.role}
                    ${user.id}
                `.toLowerCase();

                return searchableText.includes(searchTerm);
            });
        }

        // Apply status filter
        if (this.currentUsersFilters.status !== 'All Users') {
            filteredUsers = filteredUsers.filter(user => {
                if (this.currentUsersFilters.status === 'Active') return user.isActive;
                if (this.currentUsersFilters.status === 'Inactive') return !user.isActive;
                if (this.currentUsersFilters.status === 'Admin') return user.role === 'admin';
                return true;
            });
        }

        // Apply sorting
        if (this.currentUsersFilters.sortBy) {
            filteredUsers.sort((a, b) => {
                switch (this.currentUsersFilters.sortBy) {
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

        this.filteredUsers = filteredUsers;
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
     * Edit user - show edit modal
     */
    editUser(userId) {
        console.log('✏️ Edit user:', userId);
        this.showEditUserModal(userId);
    }

    /**
     * Show edit user modal
     */
    showEditUserModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        const modalHTML = `
            <div class="modal-overlay" id="editUserModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    width: 90%;
                ">
                    <div class="modal-header" style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--gray-900);">Edit User: ${user.firstName} ${user.lastName}</h3>
                        <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">User ID: ${user.id}</p>
                    </div>
                    
                    <form id="editUserForm">
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label for="editFirstName" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">First Name</label>
                                <input type="text" id="editFirstName" value="${user.firstName}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 6px;" required>
                            </div>
                            <div class="form-group">
                                <label for="editLastName" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Last Name</label>
                                <input type="text" id="editLastName" value="${user.lastName}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 6px;" required>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="editEmail" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email</label>
                            <input type="email" id="editEmail" value="${user.email}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 6px;" required>
                        </div>
                        
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="form-group">
                                <label for="editRole" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Role</label>
                                <select id="editRole" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 6px;">
                                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editStatus" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Status</label>
                                <select id="editStatus" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 6px;">
                                    <option value="active" ${user.isActive ? 'selected' : ''}>Active</option>
                                    <option value="inactive" ${!user.isActive ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="modal-actions" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary" id="cancelEditUser" style="
                                padding: 0.75rem 1.5rem;
                                border: 1px solid var(--gray-300);
                                background: white;
                                color: var(--gray-700);
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                            ">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="
                                padding: 0.75rem 1.5rem;
                                background: var(--primary-color);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                            ">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup event listeners
        const cancelBtn = document.getElementById('cancelEditUser');
        const form = document.getElementById('editUserForm');
        const modal = document.getElementById('editUserModal');

        // Cancel button - close modal
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserChanges(userId);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Save user changes
     */
    async saveUserChanges(userId) {
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const email = document.getElementById('editEmail').value;
        const role = document.getElementById('editRole').value;
        const status = document.getElementById('editStatus').value;

        try {
            // Check if email is already taken by another user
            const existingUser = this.users.find(u => u.email === email && u.id !== userId);
            if (existingUser) {
                alert('This email is already taken by another user!');
                return;
            }

            // Update user in storage
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users[userIndex] = {
                    ...this.users[userIndex],
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    role: role,
                    isActive: status === 'active'
                };

                // Save to storage
                storage.set('users', this.users);

                // Close modal
                const modal = document.getElementById('editUserModal');
                if (modal) modal.remove();

                // Refresh table
                await this.loadUsersTable();

                // Show success message
                if (window.finSimApp) {
                    finSimApp.showSuccess('User updated successfully!');
                }
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user. Please try again.');
        }
    }

    /**
     * View user details
     */
    viewUser(userId) {
        console.log('👁️ View user:', userId);
        this.showUserDetailsModal(userId);
    }

    /**
     * Show user details modal
     */
    showUserDetailsModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        // Get user accounts
        const userAccounts = this.accounts.filter(account => account.userId === userId);
        const totalBalance = userAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        
        // Get user transactions
        const userTransactions = this.transactions.filter(txn => {
            const accountIds = userAccounts.map(acc => acc.id);
            return accountIds.includes(txn.accountId);
        });

        const modalHTML = `
            <div class="modal-overlay" id="viewUserModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div class="modal-header" style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--gray-900);">User Details: ${user.firstName} ${user.lastName}</h3>
                        <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">User ID: ${user.id}</p>
                    </div>
                    
                    <div class="user-details" style="margin-bottom: 2rem;">
                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <h4 style="margin: 0 0 1rem 0; color: var(--gray-800);">Personal Information</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <strong>Name:</strong> ${user.firstName} ${user.lastName}
                                </div>
                                <div>
                                    <strong>Email:</strong> ${user.email}
                                </div>
                                <div>
                                    <strong>Role:</strong> <span class="role-badge ${user.role}">${user.role}</span>
                                </div>
                                <div>
                                    <strong>Status:</strong> <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                                <div>
                                    <strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}
                                </div>
                                <div>
                                    <strong>Last Login:</strong> ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <h4 style="margin: 0 0 1rem 0; color: var(--gray-800);">Financial Summary</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <strong>Total Balance:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
                                </div>
                                <div>
                                    <strong>Accounts:</strong> ${userAccounts.length}
                                </div>
                                <div>
                                    <strong>Transactions:</strong> ${userTransactions.length}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4 style="margin: 0 0 1rem 0; color: var(--gray-800);">Accounts</h4>
                            ${userAccounts.length > 0 ? 
                                userAccounts.map(account => `
                                    <div style="padding: 0.75rem; background: var(--gray-50); border-radius: 6px; margin-bottom: 0.5rem;">
                                        <strong>${this.getAccountTypeDisplay(account.type)}</strong><br>
                                        <small>${account.maskedAccountNumber} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.balance)}</small>
                                    </div>
                                `).join('') : 
                                '<p style="color: var(--gray-500);">No accounts found</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="modal-actions" style="display: flex; justify-content: flex-end;">
                        <button class="btn btn-primary" id="closeViewUser" style="
                            padding: 0.75rem 1.5rem;
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                        ">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup event listener
        const closeBtn = document.getElementById('closeViewUser');
        const modal = document.getElementById('viewUserModal');

        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Delete user with confirmation
     */
    async deleteUser(userId) {
        console.log('🗑️ Delete user:', userId);
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found!');
            return;
        }

        // Prevent deleting yourself
        if (user.id === this.currentAdmin.id) {
            alert('You cannot delete your own account!');
            return;
        }

        if (confirm(`Are you sure you want to delete user "${user.firstName} ${user.lastName}"?\n\nThis will also delete all their accounts and transactions. This action cannot be undone!`)) {
            await this.performUserDeletion(userId);
        }
    }

    /**
     * Perform user deletion
     */
    async performUserDeletion(userId) {
        try {
            // Remove user accounts
            this.accounts = this.accounts.filter(account => account.userId !== userId);
            
            // Remove user transactions
            const userAccountIds = this.accounts.filter(acc => acc.userId === userId).map(acc => acc.id);
            this.transactions = this.transactions.filter(txn => !userAccountIds.includes(txn.accountId));
            
            // Remove user
            this.users = this.users.filter(user => user.id !== userId);
            
            // Save all changes to storage
            storage.set('users', this.users);
            storage.set('accounts', this.accounts);
            storage.set('transactions', this.transactions);
            
            // Refresh the table
            await this.loadUsersTable();
            
            // Show success message
            if (window.finSimApp) {
                finSimApp.showSuccess('User deleted successfully!');
            }
            
            console.log('✅ User deleted:', userId);
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            if (window.finSimApp) {
                finSimApp.showError('Failed to delete user. Please try again.');
            }
        }
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
                this.currentUsersSearch = searchInput.value.toLowerCase();
                this.currentUsersPage = 1; // Reset to first page when searching
                this.loadUsersTable();
            };

            searchInput.addEventListener('input', this.debounce(performSearch, 300));
            searchButton.addEventListener('click', performSearch);
        }
    }

    /**
     * Setup users filters
     */
    setupUsersFilters() {
        const statusFilter = document.querySelector('.filter-group select:nth-child(1)');
        const sortFilter = document.querySelector('.filter-group select:nth-child(2)');

        // Status filter
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentUsersFilters.status = e.target.value;
                this.currentUsersPage = 1; // Reset to first page when filtering
                this.loadUsersTable();
            });
        }

        // Sort filter
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentUsersFilters.sortBy = e.target.value;
                this.currentUsersPage = 1; // Reset to first page when sorting
                this.loadUsersTable();
            });
        }
    }

    /**
     * Setup add user button to show confirmation popup
     */
    setupAddUserButton() {
        const addUserButton = document.querySelector('.admin-header .btn-primary');
        if (addUserButton) {
            addUserButton.addEventListener('click', () => {
                this.showAddUserConfirmation();
            });
        }
    }

    /**
     * Show confirmation popup for adding new user
     */
    showAddUserConfirmation() {
        const modalHTML = `
            <div class="modal-overlay" id="addUserModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <div class="modal-header" style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--gray-900); font-size: 1.5rem;">
                            Add New User
                        </h3>
                        <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">
                            You will be signed out and redirected to the registration page to create a new user account.
                        </p>
                    </div>
                    
                    <div class="modal-actions" style="
                        display: flex;
                        gap: 0.75rem;
                        justify-content: center;
                    ">
                        <button class="btn btn-secondary" id="cancelAddUser" style="
                            padding: 0.75rem 1.5rem;
                            border: 1px solid var(--gray-300);
                            background: white;
                            color: var(--gray-700);
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="confirmAddUser" style="
                            padding: 0.75rem 1.5rem;
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            Create User
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup event listeners
        const cancelBtn = document.getElementById('cancelAddUser');
        const confirmBtn = document.getElementById('confirmAddUser');
        const modal = document.getElementById('addUserModal');

        // Cancel button - close modal
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Confirm button - sign out and redirect to register
        confirmBtn.addEventListener('click', async () => {
            await this.createNewUserRedirect();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Add hover effects
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.backgroundColor = 'var(--gray-50)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.backgroundColor = 'white';
        });

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.backgroundColor = 'var(--primary-dark)';
            confirmBtn.style.transform = 'translateY(-1px)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.backgroundColor = 'var(--primary-color)';
            confirmBtn.style.transform = 'translateY(0)';
        });
    }

    /**
     * Sign out and redirect to registration page
     */
    async createNewUserRedirect() {
        try {
            // Close the modal first
            const modal = document.getElementById('addUserModal');
            if (modal) {
                modal.remove();
            }

            // Show loading state
            if (window.finSimApp) {
                await finSimApp.showLoading('Redirecting to registration...');
            }

            // Sign out current admin user
            await authManager.logout();

            // Redirect to registration page
            window.location.href = '../auth/register.html';

        } catch (error) {
            console.error('❌ Error redirecting to registration:', error);
            if (window.finSimApp) {
                await finSimApp.showError('Failed to redirect. Please try again.');
            }
        }
    }

    /**
     * Update users pagination
     */
    updateUsersPagination() {
        const paginationInfo = document.querySelector('.pagination-info');
        const paginationContainer = document.querySelector('.pagination');
        
        if (!paginationInfo || !paginationContainer) return;

        const totalUsers = this.filteredUsers.length;
        const totalPages = Math.ceil(totalUsers / this.usersPageSize);
        const startUser = ((this.currentUsersPage - 1) * this.usersPageSize) + 1;
        const endUser = Math.min(this.currentUsersPage * this.usersPageSize, totalUsers);

        // Update pagination info
        paginationInfo.textContent = `Showing ${startUser}-${endUser} of ${totalUsers} users`;

        // Clear existing pagination
        paginationContainer.innerHTML = '';

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = `pagination-btn ${this.currentUsersPage === 1 ? 'disabled' : ''}`;
        prevButton.textContent = 'Previous';
        prevButton.disabled = this.currentUsersPage === 1;
        prevButton.addEventListener('click', () => {
            if (this.currentUsersPage > 1) {
                this.currentUsersPage--;
                this.loadUsersTable();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentUsersPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `pagination-btn ${i === this.currentUsersPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                this.currentUsersPage = i;
                this.loadUsersTable();
            });
            paginationContainer.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = `pagination-btn ${this.currentUsersPage === totalPages ? 'disabled' : ''}`;
        nextButton.textContent = 'Next';
        nextButton.disabled = this.currentUsersPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (this.currentUsersPage < totalPages) {
                this.currentUsersPage++;
                this.loadUsersTable();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    /**
     * Initialize reports page with real data
     */
    async initializeReportsPage() {
        console.log('📈 Initializing reports page...');
        
        // Set default date range (last 30 days)
        this.setDefaultDateRange();
        
        await this.updateReportsMetrics();
        this.setupReportsFilters();
        this.setupExportButtons();
    }

    /**
     * Set default date range (last 30 days)
     */
    setDefaultDateRange() {
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);

        const dateFromInput = document.querySelector('.date-range input:nth-child(2)');
        const dateToInput = document.querySelector('.date-range input:nth-child(4)');

        if (dateFromInput && dateToInput) {
            dateFromInput.value = dateFrom.toISOString().split('T')[0];
            dateToInput.value = dateTo.toISOString().split('T')[0];
            
            this.currentFilters.dateFrom = dateFrom;
            this.currentFilters.dateTo = dateTo;
        }
    }

    /**
     * Update reports metrics with real data
     */
    async updateReportsMetrics() {
        const filteredData = this.getFilteredData();
        const metrics = this.calculateReportsMetrics(filteredData);

        // Update key metrics grid
        this.updateMetricsGrid(metrics);
        
        // Update chart placeholders with real data info
        this.updateChartPlaceholders(metrics, filteredData);
    }

    /**
     * Get filtered data based on current filters
     */
    getFilteredData() {
        let filteredTransactions = [...this.transactions];
        let filteredUsers = [...this.users];

        // Apply date range filter to transactions
        if (this.currentFilters.dateFrom && this.currentFilters.dateTo) {
            filteredTransactions = filteredTransactions.filter(txn => {
                const txnDate = new Date(txn.timestamp);
                return txnDate >= this.currentFilters.dateFrom && txnDate <= this.currentFilters.dateTo;
            });
        }

        // Apply date range filter to users (for user growth)
        if (this.currentFilters.dateFrom && this.currentFilters.dateTo) {
            filteredUsers = filteredUsers.filter(user => {
                const userDate = new Date(user.createdAt);
                return userDate >= this.currentFilters.dateFrom && userDate <= this.currentFilters.dateTo;
            });
        }

        return {
            transactions: filteredTransactions,
            users: filteredUsers,
            accounts: this.accounts // Accounts aren't date-filtered
        };
    }

    /**
     * Calculate comprehensive reports metrics
     */
    calculateReportsMetrics(filteredData) {
        const activeUsers = this.users.filter(user => user.isActive);
        const totalBalance = this.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        const avgBalance = this.accounts.length > 0 ? totalBalance / this.accounts.length : 0;
        
        // Calculate transaction volume by type from filtered data
        const deposits = filteredData.transactions.filter(txn => txn.type === 'deposit').length;
        const transfers = filteredData.transactions.filter(txn => txn.type === 'transfer').length;
        const withdrawals = filteredData.transactions.filter(txn => txn.type === 'withdrawal').length;

        // Calculate recent growth based on filtered data
        const recentUsers = filteredData.users.length;
        const previousPeriodUsers = this.getPreviousPeriodUsersCount();
        const userGrowth = previousPeriodUsers > 0 ? 
            ((recentUsers - previousPeriodUsers) / previousPeriodUsers * 100) : 0;

        return {
            activeUsers: activeUsers.length,
            totalTransactions: filteredData.transactions.length,
            filteredUsers: filteredData.users.length,
            avgBalance: avgBalance,
            totalBalance: totalBalance,
            userGrowth: userGrowth,
            transactionVolume: {
                deposits: deposits,
                transfers: transfers,
                withdrawals: withdrawals
            },
            systemUptime: 99.98,
            responseTime: 128,
            fraudRate: 0.03
        };
    }

    /**
     * Get user count from previous period for growth calculation
     */
    getPreviousPeriodUsersCount() {
        if (!this.currentFilters.dateFrom || !this.currentFilters.dateTo) return 0;

        const periodLength = this.currentFilters.dateTo - this.currentFilters.dateFrom;
        const previousStart = new Date(this.currentFilters.dateFrom.getTime() - periodLength);
        const previousEnd = new Date(this.currentFilters.dateTo.getTime() - periodLength);

        return this.users.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate >= previousStart && userDate <= previousEnd;
        }).length;
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
    updateChartPlaceholders(metrics, filteredData) {
        const reportType = this.currentFilters.reportType;

        // Update based on selected report type
        switch (reportType) {
            case 'Financial Overview':
                this.updateFinancialCharts(metrics, filteredData);
                break;
            case 'User Activity':
                this.updateUserActivityCharts(metrics, filteredData);
                break;
            case 'Transaction Analysis':
                this.updateTransactionCharts(metrics, filteredData);
                break;
            case 'Fraud Detection':
                this.updateFraudCharts(metrics, filteredData);
                break;
            case 'System Performance':
                this.updatePerformanceCharts(metrics, filteredData);
                break;
            default:
                this.updateFinancialCharts(metrics, filteredData);
        }
    }

    /**
     * Update financial overview charts
     */
    updateFinancialCharts(metrics, filteredData) {
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>📈 Financial Overview</p>
                <p>Total System Balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}</p>
                <p>${metrics.totalTransactions.toLocaleString()} transactions in selected period</p>
                <p>Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}</p>
                <small>Financial trends for selected period</small>
            `;
        }

        // Update other charts for financial view
        this.updateSupportingCharts(metrics, 'financial');
    }

    /**
     * Update user activity charts
     */
    updateUserActivityCharts(metrics, filteredData) {
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>👥 User Activity Analysis</p>
                <p>${metrics.filteredUsers} users registered in period</p>
                <p>${metrics.activeUsers} currently active users</p>
                <p>Growth: ${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%</p>
                <p>Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}</p>
                <small>User activity and growth analysis</small>
            `;
        }

        this.updateSupportingCharts(metrics, 'user-activity');
    }

    /**
     * Update transaction analysis charts
     */
    updateTransactionCharts(metrics, filteredData) {
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>🔄 Transaction Analysis</p>
                <p>Total Transactions: ${metrics.totalTransactions.toLocaleString()}</p>
                <p>Deposits: ${metrics.transactionVolume.deposits} | Transfers: ${metrics.transactionVolume.transfers} | Withdrawals: ${metrics.transactionVolume.withdrawals}</p>
                <p>Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}</p>
                <small>Detailed transaction analysis and patterns</small>
            `;
        }

        this.updateSupportingCharts(metrics, 'transaction');
    }

    /**
     * Update fraud detection charts
     */
    updateFraudCharts(metrics, filteredData) {
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>🛡️ Fraud Detection Analysis</p>
                <p>Fraud Rate: ${metrics.fraudRate}%</p>
                <p>${metrics.totalTransactions.toLocaleString()} transactions monitored</p>
                <p>0 security incidents detected</p>
                <p>Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}</p>
                <small>Security and fraud detection metrics</small>
            `;
        }

        this.updateSupportingCharts(metrics, 'fraud');
    }

    /**
     * Update system performance charts
     */
    updatePerformanceCharts(metrics, filteredData) {
        const financialChart = document.querySelector('.report-card.wide .chart-placeholder');
        if (financialChart) {
            financialChart.innerHTML = `
                <p>⚡ System Performance</p>
                <p>Uptime: ${metrics.systemUptime}%</p>
                <p>Response Time: ${metrics.responseTime}ms</p>
                <p>${metrics.totalTransactions.toLocaleString()} transactions processed</p>
                <p>Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}</p>
                <small>System performance and reliability metrics</small>
            `;
        }

        this.updateSupportingCharts(metrics, 'performance');
    }

    /**
     * Update supporting charts based on report type
     */
    updateSupportingCharts(metrics, reportType) {
        // Update user growth chart
        const userChart = document.querySelector('.report-card:nth-child(2) .chart-placeholder');
        if (userChart) {
            userChart.innerHTML = `
                <p>📊 ${this.getChartTitle(reportType, 'user')}</p>
                <p>${this.getChartData(reportType, 'user', metrics)}</p>
                <small>${this.getChartDescription(reportType, 'user')}</small>
            `;
        }

        // Update transaction volume chart
        const transactionChart = document.querySelector('.report-card:nth-child(3) .chart-placeholder');
        if (transactionChart) {
            transactionChart.innerHTML = `
                <p>📊 ${this.getChartTitle(reportType, 'transaction')}</p>
                <p>${this.getChartData(reportType, 'transaction', metrics)}</p>
                <small>${this.getChartDescription(reportType, 'transaction')}</small>
            `;
        }

        // Update fraud alerts chart
        const fraudChart = document.querySelector('.report-card:nth-child(4) .chart-placeholder');
        if (fraudChart) {
            fraudChart.innerHTML = `
                <p>📊 ${this.getChartTitle(reportType, 'fraud')}</p>
                <p>${this.getChartData(reportType, 'fraud', metrics)}</p>
                <small>${this.getChartDescription(reportType, 'fraud')}</small>
            `;
        }
    }

    /**
     * Get chart title based on report type
     */
    getChartTitle(reportType, chartType) {
        const titles = {
            'financial': {
                'user': 'User Financial Distribution',
                'transaction': 'Transaction Types',
                'fraud': 'Risk Assessment'
            },
            'user-activity': {
                'user': 'User Growth Trend',
                'transaction': 'Activity Patterns',
                'fraud': 'User Security'
            },
            'transaction': {
                'user': 'User Transaction Stats',
                'transaction': 'Volume Analysis',
                'fraud': 'Anomaly Detection'
            },
            'fraud': {
                'user': 'User Risk Profiles',
                'transaction': 'Suspicious Activity',
                'fraud': 'Threat Analysis'
            },
            'performance': {
                'user': 'User Load Distribution',
                'transaction': 'Processing Volume',
                'fraud': 'System Security'
            }
        };
        return titles[reportType]?.[chartType] || 'Data Overview';
    }

    /**
     * Get chart data based on report type
     */
    getChartData(reportType, chartType, metrics) {
        switch (chartType) {
            case 'user':
                return `Active: ${metrics.activeUsers} | New: ${metrics.filteredUsers} | Growth: ${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%`;
            case 'transaction':
                return `D: ${metrics.transactionVolume.deposits} | T: ${metrics.transactionVolume.transfers} | W: ${metrics.transactionVolume.withdrawals}`;
            case 'fraud':
                return `Rate: ${metrics.fraudRate}% | Monitored: ${metrics.totalTransactions} | Incidents: 0`;
            default:
                return 'Chart data would appear here';
        }
    }

    /**
     * Get chart description based on report type
     */
    getChartDescription(reportType, chartType) {
        return `${this.currentFilters.reportType} - ${chartType} analysis for selected period`;
    }

    /**
     * Update report titles based on selected report type
     */
    updateReportTitles() {
        const mainReportTitle = document.querySelector('.report-card.wide h3');
        const supportingTitles = document.querySelectorAll('.report-card:not(.wide) h3');
        
        if (!mainReportTitle) return;

        const reportType = this.currentFilters.reportType;
        
        // Update main report title
        mainReportTitle.textContent = reportType;
        
        // Update supporting report titles based on report type
        const supportingTitlesMap = {
            'Financial Overview': ['User Growth', 'Transaction Volume', 'Risk Assessment'],
            'User Activity': ['Activity Trends', 'User Demographics', 'Engagement Metrics'],
            'Transaction Analysis': ['Transaction Types', 'Volume Trends', 'Pattern Analysis'],
            'Fraud Detection': ['Threat Monitoring', 'Anomaly Detection', 'Security Metrics'],
            'System Performance': ['Performance Metrics', 'Resource Usage', 'Uptime Statistics']
        };

        const titles = supportingTitlesMap[reportType] || ['Data Analysis', 'Trends', 'Metrics'];
        
        supportingTitles.forEach((titleElement, index) => {
            if (titleElement && titles[index]) {
                titleElement.textContent = titles[index];
            }
        });
    }

    /**
     * Setup reports filters
     */
    setupReportsFilters() {
        const dateInputs = document.querySelectorAll('.date-range input');
        const reportTypeSelect = document.querySelector('.report-type select');

        // Date range change handler - update immediately
        dateInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateDateFilters();
                this.generateReport(); // This will now update the report automatically
            });
        });

        // Report type change handler - update immediately
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', (e) => {
                this.currentFilters.reportType = e.target.value;
                this.generateReport(); // This will update the report automatically
            });

            // Set initial report type
            this.currentFilters.reportType = reportTypeSelect.value;
        }
    }

    /**
     * Update date filters from inputs
     */
    updateDateFilters() {
        const dateFromInput = document.querySelector('.date-range input:nth-child(2)');
        const dateToInput = document.querySelector('.date-range input:nth-child(4)');

        if (dateFromInput && dateFromInput.value) {
            this.currentFilters.dateFrom = new Date(dateFromInput.value);
        }
        if (dateToInput && dateToInput.value) {
            this.currentFilters.dateTo = new Date(dateToInput.value);
            // Set to end of day for proper range inclusion
            this.currentFilters.dateTo.setHours(23, 59, 59, 999);
        }
    }

    /**
     * Generate report based on filters and download as TXT file
     */
    async generateReport() {
        try {
            console.log('📊 Generating report with current filters...', this.currentFilters);
            
            await this.updateReportsMetrics();
            this.updateReportTitles();
            
            // Create report content
            const reportContent = this.createReportContent();
            
            // Download as TXT file
            const fileName = `finsim_report_${new Date().toISOString().split('T')[0]}.txt`;
            this.downloadFile(reportContent, fileName, 'text/plain');
            
            // Show success message
            if (window.finSimApp) {
                finSimApp.showSuccess('Report generated and downloaded successfully!');
            }
            
        } catch (error) {
            console.error('❌ Report generation failed:', error);
            if (window.finSimApp) {
                finSimApp.showError('Failed to generate report. Please try again.');
            }
        }
    }

    /**
     * Create comprehensive report content
     */
    createReportContent() {
        const filteredData = this.getFilteredData();
        const metrics = this.calculateReportsMetrics(filteredData);
        
        const reportDate = new Date().toLocaleString();
        const adminName = this.currentAdmin ? `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}` : 'System';
        const dateRange = this.currentFilters.dateFrom && this.currentFilters.dateTo ? 
            `${this.currentFilters.dateFrom.toLocaleDateString()} to ${this.currentFilters.dateTo.toLocaleDateString()}` : 
            'All Time';
        
        let reportContent = `
FinSim Banking System - Report
==============================

Report Type: ${this.currentFilters.reportType}
Generated: ${reportDate}
Generated By: ${adminName}
Date Range: ${dateRange}

EXECUTIVE SUMMARY
=================

Total Users in Period: ${metrics.filteredUsers.toLocaleString()}
Active Users: ${metrics.activeUsers.toLocaleString()}
Total System Balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}
Total Transactions: ${metrics.totalTransactions.toLocaleString()}
Average User Balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.avgBalance)}
User Growth: ${metrics.userGrowth >= 0 ? '+' : ''}${metrics.userGrowth.toFixed(1)}%

TRANSACTION ANALYSIS
====================

Deposits: ${metrics.transactionVolume.deposits.toLocaleString()}
Transfers: ${metrics.transactionVolume.transfers.toLocaleString()}
Withdrawals: ${metrics.transactionVolume.withdrawals.toLocaleString()}
Total: ${metrics.totalTransactions.toLocaleString()}

SYSTEM METRICS
==============

System Uptime: ${metrics.systemUptime}%
Average Response Time: ${metrics.responseTime}ms
Fraud Detection Rate: ${metrics.fraudRate}%

USER STATISTICS
===============

Total Registered Users: ${this.users.length.toLocaleString()}
Active Users: ${metrics.activeUsers.toLocaleString()}
Admin Users: ${this.users.filter(user => user.role === 'admin').length.toLocaleString()}
Inactive Users: ${this.users.filter(user => !user.isActive).length.toLocaleString()}

ACCOUNT INFORMATION
===================

Total Accounts: ${this.accounts.length.toLocaleString()}
Total System Balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}
Average Balance per Account: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.avgBalance)}

RECENT ACTIVITY
===============

Last 5 System Activities:
`;

        // Add recent activities
        const recentActivities = this.getRecentActivities().slice(0, 5);
        recentActivities.forEach((activity, index) => {
            reportContent += `${index + 1}. ${activity.message} (${activity.timestamp})\n`;
        });

        reportContent += `

REPORT FOOTER
=============

This report was automatically generated by the FinSim Banking System.
For any questions, please contact system administration.

Confidential - For Internal Use Only
`;

        return reportContent;
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
                this.generateReport();
            });
        }
    }

    /**
     * Export specific report type
     */
    exportReport(reportType) {
        console.log(`📤 Exporting ${reportType}...`);
        
        const filteredData = this.getFilteredData();
        
        switch (reportType) {
            case 'Financial Report':
                this.generateFinancialReportPDF(filteredData);
                break;
            case 'User Analytics':
                const userCsv = this.generateUserAnalyticsCSV(filteredData);
                this.downloadFile(userCsv, `user_analytics_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
                break;
            case 'Transaction Log':
                const transactionExcel = this.generateTransactionLogExcel(filteredData);
                this.downloadFile(transactionExcel, `transaction_log_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel');
                break;
            case 'Security Report':
                this.generateSecurityReportPDF(filteredData);
                break;
            default:
                this.generateFinancialReportPDF(filteredData);
        }
        
        if (window.finSimApp) {
            finSimApp.showSuccess(`${reportType} exported successfully`);
        }
    }

    /**
     * Generate financial report PDF
     */
    generateFinancialReportPDF(filteredData) {
        console.log('📊 Generating financial report PDF...');
        
        const pdfWindow = window.open('', '_blank');
        const reportDate = new Date().toLocaleDateString();
        const adminName = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        const metrics = this.calculateReportsMetrics(filteredData);

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
                    .date-range {
                        background: #f8fafc;
                        padding: 10px;
                        border-radius: 6px;
                        margin: 10px 0;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
                
                <div class="header">
                    <h1>FinSim Financial Report</h1>
                    <div class="subtitle">Comprehensive Financial Performance Analysis</div>
                    <div class="subtitle">Generated by: ${adminName}</div>
                    <div class="date-range">
                        <strong>Date Range:</strong> ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}
                    </div>
                </div>

                <div class="section">
                    <h2>Executive Summary</h2>
                    <p>This financial report provides a comprehensive overview of the FinSim banking system's financial performance for the selected period.</p>
                    
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-value">${metrics.filteredUsers.toLocaleString()}</div>
                            <div class="metric-label">Users in Period</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.totalBalance)}</div>
                            <div class="metric-label">Total System Balance</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${metrics.totalTransactions.toLocaleString()}</div>
                            <div class="metric-label">Transactions in Period</div>
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
     * Generate user analytics CSV
     */
    generateUserAnalyticsCSV(filteredData) {
        const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Total Balance', 'Last Login', 'Join Date'];
        
        const rows = filteredData.users.map(user => [
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
    generateTransactionLogExcel(filteredData) {
        const headers = ['Transaction ID', 'Date', 'Time', 'Type', 'Amount', 'Description', 'Account ID', 'Status', 'Recipient'];
        
        const rows = filteredData.transactions.slice(0, 1000).map(txn => [
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
    generateSecurityReportPDF(filteredData) {
        console.log('📊 Generating security report PDF...');
        
        const pdfWindow = window.open('', '_blank');
        const reportDate = new Date().toLocaleDateString();
        const adminName = `${this.currentAdmin.firstName} ${this.currentAdmin.lastName}`;
        const metrics = this.calculateReportsMetrics(filteredData);
        
        // Security metrics calculation
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.isActive).length;
        const inactiveUsers = totalUsers - activeUsers;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;

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
                    .date-range {
                        background: #f8fafc;
                        padding: 10px;
                        border-radius: 6px;
                        margin: 10px 0;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
                
                <div class="header">
                    <h1>FinSim Security Report</h1>
                    <div class="subtitle">Comprehensive System Security Assessment</div>
                    <div class="subtitle">Generated by: ${adminName}</div>
                    <div class="date-range">
                        <strong>Date Range:</strong> ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}
                    </div>
                </div>

                <div class="section">
                    <h2>Executive Summary</h2>
                    <p>This security report provides an overview of the FinSim banking system's security posture for the selected period.</p>
                    
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
                            <div class="metric-value">${metrics.totalTransactions}</div>
                            <div class="metric-label">Transactions in Period</div>
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
Date Range: ${this.currentFilters.dateFrom?.toLocaleDateString()} to ${this.currentFilters.dateTo?.toLocaleDateString()}

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
        // Additional event listeners can be added here
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