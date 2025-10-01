// js/auth.js

/**
 * FinSim - Professional Authentication System
 * Enterprise-grade async/await patterns with proper error handling
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
    async init() {
        try {
            this.currentUser = await this.storage.get('currentUser');
            
            if (this.currentUser) {
                console.log('🔐 User session restored:', this.currentUser.email);
                await this.updateUserLoginTime();
            } else {
                console.log('🔐 No active user session');
            }
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            this.currentUser = null;
        }
    }

    /**
     * Register a new user with comprehensive validation
     */
    async register(userData) {
        try {
            // Input validation pipeline
            await this.validateRegistrationData(userData);
            await this.checkUserExists(userData.email);
            await this.validatePasswordStrength(userData.password);
            await this.confirmPasswordMatch(userData.password, userData.confirmPassword);

            // Create user account
            const newUser = await this.createUserAccount(userData);
            
            // Setup user environment
            await this.setupUserEnvironment(newUser.id);
            
            // Auto-login after successful registration
            const loginResult = await this.login(userData.email, userData.password);
            
            return {
                success: true,
                user: newUser,
                message: '🎉 Registration successful! Welcome to FinSim.',
                redirect: '/dashboard/dashboard.html'
            };

        } catch (error) {
            console.error('❌ Registration failed:', error);
            return {
                success: false,
                message: error.message,
                error: error.name
            };
        }
    }

    /**
     * User login with security checks
     */
    async login(email, password) {
        try {
            // Validation pipeline
            await this.validateLoginCredentials(email, password);
            
            const user = await this.findUserByEmail(email);
            await this.validateUserAccount(user);
            await this.verifyUserPassword(password, user.password);

            // Update session
            await this.updateUserSession(user);
            
            console.log('🔐 User login successful:', user.email);
            
            return {
                success: true,
                user: this.sanitizeUserData(user),
                message: '👋 Welcome back to FinSim!',
                redirect: '/dashboard/dashboard.html'
            };

        } catch (error) {
            console.error('❌ Login failed:', error);
            return {
                success: false,
                message: error.message,
                error: error.name
            };
        }
    }

    /**
     * Secure logout with session cleanup
     */
    async logout() {
        try {
            if (this.currentUser) {
                console.log('🔐 User logout:', this.currentUser.email);
            }
            
            this.currentUser = null;
            await this.storage.set('currentUser', null);
            
            return {
                success: true,
                message: '👋 Logged out successfully',
                redirect: '/index.html'
            };

        } catch (error) {
            console.error('❌ Logout failed:', error);
            throw new Error('Logout process failed');
        }
    }

    /**
     * Validation Methods
     */
    async validateRegistrationData(userData) {
        const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !userData[field]?.trim());
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (!this.isValidEmail(userData.email)) {
            throw new Error('Please enter a valid email address');
        }
    }

    async checkUserExists(email) {
        const existingUser = await this.dataManager.getUserByEmail(email);
        if (existingUser) {
            throw new Error('An account with this email already exists');
        }
    }

    async validatePasswordStrength(password) {
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Add more sophisticated password validation if needed
        const strengthChecks = {
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
        };

        const passedChecks = Object.values(strengthChecks).filter(Boolean).length;
        if (passedChecks < 2) {
            throw new Error('Password should include uppercase, lowercase letters and numbers');
        }
    }

    async confirmPasswordMatch(password, confirmPassword) {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
    }

    async validateLoginCredentials(email, password) {
        if (!email?.trim() || !password?.trim()) {
            throw new Error('Please enter both email and password');
        }
    }

    async findUserByEmail(email) {
        const user = await this.dataManager.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        return user;
    }

    async validateUserAccount(user) {
        if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.');
        }
    }

    async verifyUserPassword(inputPassword, storedHash) {
        const isValid = await this.hashPassword(inputPassword) === storedHash;
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
    }

    /**
     * User Management Methods
     */
    async createUserAccount(userData) {
        return await this.dataManager.createUser({
            email: userData.email.trim().toLowerCase(),
            password: await this.hashPassword(userData.password),
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            role: 'user'
        });
    }

    async setupUserEnvironment(userId) {
        try {
            // Create default accounts
            const accounts = await Promise.all([
                this.createAccount(userId, 'checking', 1000.00),
                this.createAccount(userId, 'savings', 500.00)
            ]);

            console.log('💰 User environment setup completed:', accounts.length, 'accounts created');
            
        } catch (error) {
            console.error('❌ User environment setup failed:', error);
            // Don't throw error - user can still login and create accounts manually
        }
    }

    async createAccount(userId, type, balance) {
        return await this.dataManager.createAccount({
            userId: userId,
            type: type,
            balance: balance,
            accountNumber: this.generateAccountNumber()
        });
    }

    async updateUserSession(user) {
        this.currentUser = user;
        await this.storage.set('currentUser', user.toJSON());
        await this.updateUserLoginTime();
    }

    async updateUserLoginTime() {
        if (this.currentUser) {
            await this.dataManager.updateUser(this.currentUser.id, {
                lastLogin: new Date().toISOString()
            });
        }
    }

    /**
     * Security Methods
     */
    async hashPassword(password) {
        // Simulate async hashing operation
        return new Promise((resolve) => {
            setTimeout(() => {
                // Basic hash for demo - REPLACE with proper bcrypt in production
                const hash = btoa(password + 'finsim_salt_v2');
                resolve(hash);
            }, 10);
        });
    }

    /**
     * Utility Methods
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateAccountNumber() {
        return 'FIN' + Date.now().toString().substr(-8) + Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    sanitizeUserData(user) {
        // Remove sensitive data before sending to client
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    /**
     * Public Interface
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser ? this.sanitizeUserData(this.currentUser) : null;
    }

    /**
     * Password change with security validation
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            await this.verifyUserPassword(currentPassword, this.currentUser.password);
            await this.validatePasswordStrength(newPassword);

            await this.dataManager.updateUser(this.currentUser.id, {
                password: await this.hashPassword(newPassword)
            });

            return {
                success: true,
                message: '🔒 Password updated successfully'
            };

        } catch (error) {
            console.error('❌ Password change failed:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Create and export auth manager instance
const authManager = new AuthManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authManager;
}