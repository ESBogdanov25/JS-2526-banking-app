// js/app.js

/**
 * FinSim - Professional Application Controller
 * Enterprise-grade application management with async/await patterns
 */

// Dependency validation
if (typeof storage === 'undefined') {
    console.error('❌ Storage manager not loaded');
}

if (typeof authManager === 'undefined') {
    console.error('❌ Auth manager not loaded');
}

if (typeof dataManager === 'undefined') {
    console.error('❌ Data manager not loaded');
}

class FinSimApp {
    constructor() {
        this.auth = authManager;
        this.currentPage = null;
        this.isInitialized = false;
        this.eventHandlers = new Map();
        
        // App states
        this.states = {
            LOADING: 'loading',
            READY: 'ready',
            ERROR: 'error',
            AUTHENTICATED: 'authenticated',
            UNAUTHENTICATED: 'unauthenticated'
        };
        
        this.currentState = this.states.LOADING;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing FinSim Application...');
            
            await this.setupApplication();
            await this.initializeAuth();
            await this.setupEventDelegation();
            await this.initializeUI();
            await this.routeToCurrentPage();
            
            this.isInitialized = true;
            this.currentState = this.states.READY;
            
            console.log('✅ FinSim Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.currentState = this.states.ERROR;
            await this.handleCriticalError(error);
        }
    }

    /**
     * Setup core application components
     */
    async setupApplication() {
        // Validate required components
        if (!this.auth || !storage) {
            throw new Error('Required application components not available');
        }

        // Set app version and metadata
        this.appInfo = {
            name: 'FinSim',
            version: '1.0.0',
            environment: this.getEnvironment(),
            timestamp: new Date().toISOString()
        };

        console.log('📱 App Info:', this.appInfo);
    }

    /**
     * Initialize authentication system
     */
    async initializeAuth() {
        try {
            // Wait for auth system to be ready
            await this.waitForAuthReady();
            
            const isAuthenticated = this.auth.isAuthenticated();
            this.currentState = isAuthenticated ? 
                this.states.AUTHENTICATED : 
                this.states.UNAUTHENTICATED;

            console.log(`🔐 Auth State: ${this.currentState}`);
            
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            throw new Error('Authentication system unavailable');
        }
    }

    /**
     * Wait for auth system to be ready
     */
    async waitForAuthReady(maxWaitTime = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkAuth = () => {
                if (this.auth && typeof this.auth.isAuthenticated === 'function') {
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('Auth system timeout'));
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            
            checkAuth();
        });
    }

    /**
     * Setup global event delegation
     */
    async setupEventDelegation() {
        try {
            // Remove existing listeners to prevent duplicates
            this.removeAllEventListeners();
            
            // Global click handler for navigation
            this.addEventListener('click', this.handleGlobalClick.bind(this));
            
            // Global form submission handler
            this.addEventListener('submit', this.handleGlobalSubmit.bind(this));
            
            // Auth state change listeners
            this.setupAuthStateListeners();
            
            console.log('🎯 Global event delegation setup completed');
            
        } catch (error) {
            console.error('❌ Event delegation setup failed:', error);
            throw error;
        }
    }

    /**
     * Handle global click events
     */
    async handleGlobalClick(event) {
        const target = event.target;
        
        try {
            // Navigation links
            if (target.matches('[data-nav]') || target.closest('[data-nav]')) {
                event.preventDefault();
                const navElement = target.matches('[data-nav]') ? target : target.closest('[data-nav]');
                const navTarget = navElement.getAttribute('data-nav');
                await this.navigateTo(navTarget);
            }
            
            // Auth actions
            if (target.matches('[data-auth]') || target.closest('[data-auth]')) {
                event.preventDefault();
                const authElement = target.matches('[data-auth]') ? target : target.closest('[data-auth]');
                const authAction = authElement.getAttribute('data-auth');
                await this.handleAuthAction(authAction, target);
            }
            
            // Logout buttons
            if (target.matches('[data-logout]') || target.closest('[data-logout]')) {
                event.preventDefault();
                await this.handleLogout();
            }
            
        } catch (error) {
            console.error('❌ Click handler error:', error);
            await this.showError('Action failed. Please try again.');
        }
    }

    /**
     * Handle global form submissions
     */
    async handleGlobalSubmit(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            await this.showLoading('Processing...');
            
            const formData = new FormData(form);
            const formType = form.getAttribute('data-form');
            
            switch (formType) {
                case 'login':
                    await this.handleLoginForm(formData);
                    break;
                case 'register':
                    await this.handleRegisterForm(formData);
                    break;
                default:
                    console.warn('Unknown form type:', formType);
            }
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            await this.showError('Form submission failed.');
        } finally {
            await this.hideLoading();
        }
    }

    /**
     * Handle login form submission
     */
    async handleLoginForm(formData) {
        try {
            const credentials = {
                email: formData.get('email')?.trim(),
                password: formData.get('password')
            };
            
            const result = await this.auth.login(credentials.email, credentials.password);
            
            if (result.success) {
                await this.showSuccess('Login successful!');
                await this.navigateTo('/dashboard/dashboard.html');
            } else {
                await this.showError(result.message);
            }
            
        } catch (error) {
            console.error('❌ Login form error:', error);
            await this.showError('Login failed. Please try again.');
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegisterForm(formData) {
        try {
            const userData = {
                email: formData.get('email')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                firstName: formData.get('firstName')?.trim(),
                lastName: formData.get('lastName')?.trim()
            };
            
            const result = await this.auth.register(userData);
            
            if (result.success) {
                await this.showSuccess('Registration successful!');
                await this.navigateTo('/dashboard/dashboard.html');
            } else {
                await this.showError(result.message);
            }
            
        } catch (error) {
            console.error('❌ Register form error:', error);
            await this.showError('Registration failed. Please try again.');
        }
    }

    /**
     * Handle authentication actions
     */
    async handleAuthAction(action, element) {
        try {
            switch (action) {
                case 'login':
                    await this.navigateTo('/auth/login.html');
                    break;
                case 'register':
                    await this.navigateTo('/auth/register.html');
                    break;
                default:
                    console.warn('Unknown auth action:', action);
            }
        } catch (error) {
            console.error('❌ Auth action error:', error);
            await this.showError('Authentication action failed.');
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            await this.showLoading('Logging out...');
            
            const result = await this.auth.logout();
            
            if (result.success) {
                await this.showSuccess('Logged out successfully');
                await this.navigateTo('/index.html');
            } else {
                await this.showError('Logout failed. Please try again.');
            }
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            await this.showError('Logout failed.');
        } finally {
            await this.hideLoading();
        }
    }

    /**
     * Professional navigation system
     */
    async navigateTo(path) {
        try {
            console.log('🧭 Navigating to:', path);
            
            // Validate path
            if (!path || typeof path !== 'string') {
                throw new Error('Invalid navigation path');
            }
            
            // Add loading state
            await this.showLoading('Loading...');
            
            // Simulate navigation delay for better UX
            await this.delay(300);
            
            // Handle both absolute and relative paths
            let finalPath = path;
            if (!path.startsWith('/') && !path.startsWith('http')) {
                finalPath = '/' + path;
            }
            
            window.location.href = finalPath;
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            await this.showError('Navigation failed.');
            await this.hideLoading();
        }
    }

    /**
     * Route to appropriate page based on auth state
     */
    async routeToCurrentPage() {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/auth/');
        const isDashboardPage = currentPath.includes('/dashboard/');
        
        try {
            if (this.auth.isAuthenticated()) {
                // User is logged in
                if (isAuthPage) {
                    // Redirect authenticated users away from auth pages
                    await this.navigateTo('/dashboard/dashboard.html');
                }
            } else {
                // User is not logged in
                if (isDashboardPage) {
                    // Redirect unauthenticated users to login
                    await this.navigateTo('/auth/login.html');
                }
            }
        } catch (error) {
            console.error('❌ Routing error:', error);
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUI() {
        try {
            await this.updateNavigation();
            await this.updateAuthUI();
            await this.initializePageSpecificUI();
            
        } catch (error) {
            console.error('❌ UI initialization failed:', error);
        }
    }

    /**
     * Update navigation based on auth state
     */
    async updateNavigation() {
        try {
            const navElements = document.querySelectorAll('[data-nav-auth]');
            
            navElements.forEach(element => {
                const authState = element.getAttribute('data-nav-auth');
                const isVisible = this.shouldShowElement(authState);
                
                element.style.display = isVisible ? '' : 'none';
            });
            
        } catch (error) {
            console.error('❌ Navigation update failed:', error);
        }
    }

    /**
     * Update authentication-related UI
     */
    async updateAuthUI() {
        try {
            const authState = this.auth.isAuthenticated() ? 'authenticated' : 'unauthenticated';
            const elements = document.querySelectorAll(`[data-auth-ui="${authState}"]`);
            
            elements.forEach(element => {
                element.style.display = '';
            });
            
            // Hide opposite state elements
            const oppositeState = authState === 'authenticated' ? 'unauthenticated' : 'authenticated';
            const oppositeElements = document.querySelectorAll(`[data-auth-ui="${oppositeState}"]`);
            
            oppositeElements.forEach(element => {
                element.style.display = 'none';
            });
            
        } catch (error) {
            console.error('❌ Auth UI update failed:', error);
        }
    }

    /**
     * Initialize page-specific UI components
     */
    async initializePageSpecificUI() {
        const page = this.getCurrentPage();
        
        try {
            switch (page) {
                case 'login':
                    await this.initializeLoginPage();
                    break;
                case 'register':
                    await this.initializeRegisterPage();
                    break;
                case 'dashboard':
                    await this.initializeDashboardPage();
                    break;
                default:
                    await this.initializeLandingPage();
            }
        } catch (error) {
            console.error(`❌ ${page} page initialization failed:`, error);
        }
    }

    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('/auth/login.html')) return 'login';
        if (path.includes('/auth/register.html')) return 'register';
        if (path.includes('/dashboard/')) return 'dashboard';
        return 'landing';
    }

    /**
     * UI Feedback Methods - IMPLEMENTED
     */
    async showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = overlay?.querySelector('.loading-message');
        
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    async hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    async showSuccess(message) {
        await this.showNotification(message, 'success');
    }

    async showError(message) {
        await this.showNotification(message, 'error');
    }

    async showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Utility Methods
     */
    shouldShowElement(authState) {
        switch (authState) {
            case 'authenticated':
                return this.auth.isAuthenticated();
            case 'unauthenticated':
                return !this.auth.isAuthenticated();
            case 'always':
                return true;
            default:
                return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getEnvironment() {
        return window.location.hostname === 'localhost' ? 'development' : 'production';
    }

    /**
     * Event Management
     */
    addEventListener(event, handler) {
        document.addEventListener(event, handler);
        this.eventHandlers.set(event, handler);
    }

    removeAllEventListeners() {
        this.eventHandlers.forEach((handler, event) => {
            document.removeEventListener(event, handler);
        });
        this.eventHandlers.clear();
    }

    /**
     * Error Handling
     */
    async handleCriticalError(error) {
        console.error('💥 Critical application error:', error);
        await this.showError('Application error occurred. Please refresh the page.');
    }

    setupAuthStateListeners() {
        // Setup listeners for auth state changes
        // This would typically use an event emitter pattern
    }

    /**
     * Page-specific initializers (to be implemented)
     */
    async initializeLoginPage() {
        console.log('🔐 Initializing login page...');
    }

    async initializeRegisterPage() {
        console.log('📝 Initializing register page...');
    }

    async initializeDashboardPage() {
        console.log('📊 Initializing dashboard page...');
    }

    async initializeLandingPage() {
        console.log('🏠 Initializing landing page...');
    }

    /**
     * Public API
     */
    async getAppStatus() {
        return {
            initialized: this.isInitialized,
            state: this.currentState,
            authenticated: this.auth.isAuthenticated(),
            user: this.auth.getCurrentUser(),
            appInfo: this.appInfo
        };
    }

    async refreshApp() {
        console.log('🔄 Refreshing application state...');
        await this.initializeAuth();
        await this.initializeUI();
    }
}

// Create and initialize the application
const finSimApp = new FinSimApp();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        finSimApp.initialize();
    });
} else {
    finSimApp.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = finSimApp;
}