/**
 * FinSim - Authentication System
 * Handles user registration, login, logout, and session management
 */

class AuthManager {
    constructor() {
        this.storage = storage;
        this.dataManager = dataManager;
        this.currentUser = null;
        this.init();
    }

    /**
     * Initialize authentication system
     */
    init() {
        // Check if user is already logged in
        this.currentUser = this.storage.get('currentUser');
        
        if (this.currentUser) {
            console.log('🔐 User session restored:', this.currentUser.email);
            this.updateUserLoginTime();
        } else {
            console.log('🔐 No active user session');
        }
    }

    /**
     * Register a new user
     */
    async register(userData) {
        try {
            // Validate input
            if (!this.validateRegistration(userData)) {
                throw new Error('Please fill in all required fields');
            }

            // Check if user already exists
            const existingUser = this.dataManager.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Validate password strength
            if (!this.validatePassword(userData.password)) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Check password confirmation
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Create new user
            const newUser = this.dataManager.createUser({
                email: userData.email,
                password: this.hashPassword(userData.password), // Basic hashing
                firstName: userData.firstName,
                lastName: userData.lastName
            });

            // Create default accounts for new user
            this.createDefaultAccounts(newUser.id);

            // Auto-login after registration
            this.login(userData.email, userData.password);

            return {
                success: true,
                user: newUser,
                message: 'Registration successful!'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Please enter both email and password');
            }

            // Find user by email
            const user = this.dataManager.getUserByEmail(email);
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }

            // Verify password (basic comparison - will be enhanced)
            if (!this.verifyPassword(password, user.password)) {
                throw new Error('Invalid email or password');
            }

            // Update last login time
            this.dataManager.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });

            // Set current user session
            this.currentUser = user;
            this.storage.set('currentUser', user.toJSON());

            console.log('🔐 User logged in:', user.email);
            
            return {
                success: true,
                user: user,
                message: 'Login successful!'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        this.storage.set('currentUser', null);
        console.log('🔐 User logged out');
        
        // Redirect to login page (will be handled by app.js)
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Validate registration data
     */
    validateRegistration(userData) {
        return userData.email && 
               userData.password && 
               userData.firstName && 
               userData.lastName;
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        return password && password.length >= 6;
    }

    /**
     * Basic password hashing (for demo purposes)
     * In production, use proper hashing like bcrypt
     */
    hashPassword(password) {
        // Simple hash for demo - replace with proper hashing in production
        return btoa(password + 'finsim_salt');
    }

    /**
     * Verify password against hash
     */
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    /**
     * Create default accounts for new users
     */
    createDefaultAccounts(userId) {
        // Create checking account
        this.dataManager.createAccount({
            userId: userId,
            type: 'checking',
            balance: 1000.00, // Starter balance
            accountNumber: this.generateAccountNumber()
        });

        // Create savings account
        this.dataManager.createAccount({
            userId: userId,
            type: 'savings',
            balance: 500.00, // Starter balance
            accountNumber: this.generateAccountNumber()
        });

        console.log('💰 Default accounts created for user:', userId);
    }

    /**
     * Generate account number
     */
    generateAccountNumber() {
        return 'FIN' + Date.now().toString().substr(-8);
    }

    /**
     * Update user's last login time
     */
    updateUserLoginTime() {
        if (this.currentUser) {
            this.dataManager.updateUser(this.currentUser.id, {
                lastLogin: new Date().toISOString()
            });
        }
    }

    /**
     * Change user password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            // Verify current password
            if (!this.verifyPassword(currentPassword, this.currentUser.password)) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            if (!this.validatePassword(newPassword)) {
                throw new Error('New password must be at least 6 characters long');
            }

            // Update password
            this.dataManager.updateUser(this.currentUser.id, {
                password: this.hashPassword(newPassword)
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authManager;
}