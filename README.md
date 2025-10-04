# 🏦 FinSim Banking App

A modern, feature-rich banking simulator built with vanilla JavaScript, HTML5, and CSS3. Experience professional banking operations with a beautiful, responsive interface.

## ✨ Features

### 🎯 Core Banking Features
- **Multi-Account Management** - Checking, Savings, and Investment accounts
- **Instant Money Transfers** - Internal and external transfers with IBAN support
- **Transaction History** - Comprehensive transaction tracking and filtering
- **Real-time Balance Updates** - Live balance calculations and updates

### 👨‍💼 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI/UX** - Clean, professional banking interface
- **Secure Authentication** - Role-based access control (User/Admin)
- **Interactive Dashboard** - Real-time financial overview

### 🔐 Security & Admin
- **Admin Dashboard** - Complete system management
- **User Management** - Edit, view, and delete users
- **System Reports** - Financial analytics and export capabilities
- **Fraud Detection** - Security monitoring system

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local server for development (optional)

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/ESBogdanov25/JS-2526-banking-app.git
   cd JS-2526-banking-app

2. **Open the application**

    Option 1: Open index.html directly in your browser
    
    Option 2: Use a local server for best experience
  ```bash
    # Using Python
    python -m http.server 8000
    
    # Using Node.js
    npx http-server
    
    # Using PHP
    php -S localhost:8000
  ```

3. **Access the application**
  Open your browser and navigate to http://localhost:8000


## 🔑 Default Login Credentials
### Admin Access
- **Email:** `admin@finsim.com`  
- **Password:** `admin123`  

### Regular User
- Register a new account through the registration page  

---

## 🏗️ Project Structure

  JS-2526-banking-app/
  ```
  ├── 📁 admin/ # Admin panel
  │ ├── admin.html # Admin dashboard
  │ ├── users.html # User management
  │ └── reports.html # System reports
  │
  ├── 📁 assets/ # Static assets
  │
  │── 📁 auth/ # Authentication pages
  │ ├── login.html # User login
  │ └── register.html # User registration
  │
  ├── 📁 css/ # Stylesheets
  │ ├── style.css # Main styles
  │ ├── dashboard.css # Dashboard styles
  │ ├── admin.css # Admin panel styles
  │ └── auth.css # Authentication styles
  │
  ├── 📁 dashboard/ # User dashboard
  │ ├── dashboard.html # Main dashboard
  │ ├── accounts.html # Account management
  │ ├── transactions.html # Transaction history
  │ ├── transfer.html # Money transfers
  │ └── transfer-success.html
  │
  ├── 📁 js/ # JavaScript modules
  │ ├── app.js # Main application controller
  │ ├── auth.js # Authentication system
  │ ├── dashboard.js # Dashboard functionality
  │ ├── admin.js # Admin management
  │ ├── storage.js # LocalStorage management
  │ ├── models.js # Data models (User, Account, Transaction)
  │ └── utils.js # Utility functions
  │
  ├── index.html # Landing page
  │
  ├── LICENSE
  │
  └── README.md
```
---

## 💻 Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)  
- **Storage:** Browser LocalStorage  
- **Styling:** CSS Grid, Flexbox, CSS Custom Properties  
- **Icons:** Emoji-based icon system  
- **Responsive:** Mobile-first design approach  

---

## 🎨 Key Features in Detail

### Banking Operations
- 💳 **Account Management:** Create and manage multiple account types  
- 🔄 **Money Transfers:** Internal and external transfers with IBAN validation  
- 📊 **Financial Analytics:** Spending insights and balance tracking  
- 🏦 **Professional IBAN System:** Realistic international bank account numbers  

### User Management
- 👤 **Role-based Access:** Separate interfaces for users and admins  
- 🔐 **Secure Authentication:** Encrypted password storage  
- 📱 **Session Management:** Persistent login sessions  
- 👥 **Admin Controls:** Full user management capabilities  

### Admin Features
- 📈 **System Analytics:** User growth, transaction volume, financial metrics  
- 👥 **User Management:** Edit, view, and delete user accounts  
- 📋 **Reporting:** Export financial reports in multiple formats  
- 🛡️ **Security Monitoring:** Fraud detection and system health  

---

## 🔧 Development

### Data Models
```javascript
// User Model
{
  id: "user_unique_id",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "user", // or "admin"
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}

// Account Model
{
  id: "account_unique_id",
  userId: "user_unique_id",
  type: "checking", // checking, savings, investment
  balance: 1500.00,
  iban: "FS00 FINS0010 1234 5678 9012 3456",
  accountNumber: "FIN123456789"
}

// Transaction Model
{
  id: "transaction_unique_id",
  accountId: "account_unique_id",
  type: "transfer", // transfer, deposit, withdrawal
  amount: 100.00,
  description: "Payment for services",
  timestamp: "2024-01-01T10:30:00.000Z"
}
```

# Storage System
- Uses browser LocalStorage for data persistence
- Automatic data initialization
- Conflict-free key management
- Data validation and error handling

---

## 🌟 Unique Features

### Professional IBAN Implementation
- Realistic IBAN format: `FS00 FINS0010 XXXX XXXX XXXX XXXX`
- IBAN validation and verification
- Recipient account lookup
- Professional banking standards

### Advanced Admin Dashboard
- Real-time system metrics
- User activity monitoring
- Financial reporting
- Export capabilities (PDF, CSV, Excel)

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Professional banking aesthetics

---

## 🚀 Getting Started as a Developer

### Code Architecture
- **Modular JavaScript:** Separate concerns with dedicated classes
- **Event-Driven:** Global event delegation system
- **MVC Pattern:** Clear separation of data, view, and control
- **Async/Await:** Modern asynchronous programming

### Key JavaScript Classes
- `AuthManager` - Handles user authentication and sessions
- `DashboardManager` - Manages user dashboard operations
- `AdminManager` - Controls admin panel functionality
- `DataManager` - Centralized data operations
- `StorageManager` - LocalStorage abstraction layer

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch:  
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:  
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch:  
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

---

## 📱 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🔒 Security Notes
This is a **simulation application** for educational and portfolio purposes:
- All data is stored locally in your browser
- No real financial transactions occur
- No sensitive data is transmitted to external servers
- Use only with simulated/test data

---

## 📄 License
This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Author
**Emil Bogdanov**  
- GitHub: [@ESBogdanov25](https://github.com/ESBogdanov25)  
- LinkedIn: [Emil Bogdanov](https://www.linkedin.com/in/emil-bogdanov-a304b62a0/)  

---

## 🙏 Acknowledgments
- Design inspiration from modern banking applications
- Icons provided by emoji characters for cross-platform compatibility
- Built as a portfolio project to demonstrate full-stack JavaScript capabilities

---

<div align="center"> ⭐ Star this repo if you find it helpful!  
Built with 💙 and Vanilla JavaScript </div>
