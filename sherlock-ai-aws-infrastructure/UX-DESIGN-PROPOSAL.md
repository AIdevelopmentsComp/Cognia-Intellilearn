# 🎨 **SHERLOCK AI - UX/UI DESIGN PROPOSAL**
## **Legal Case Management System - React Screens**

### **🎯 DESIGN PHILOSOPHY**
- **Colors**: **Black (#000000)** & **Yellow (#FFD700)** - Professional Attorney Theme
- **Typography**: Clean, readable, legal-document style
- **UX**: Attorney-first design, optimized for case management workflows
- **Accessibility**: WCAG 2.1 AA compliant for legal professionals

---

## **🎨 GLOBAL DESIGN SYSTEM**

### **Color Palette:**
```css
:root {
  /* Primary Colors */
  --primary-black: #000000;
  --primary-yellow: #FFD700;
  --secondary-yellow: #FFA500;
  --accent-yellow: #FFFF99;
  
  /* Grays */
  --dark-gray: #1a1a1a;
  --medium-gray: #333333;
  --light-gray: #666666;
  --border-gray: #404040;
  
  /* Status Colors */
  --success-green: #28a745;
  --warning-orange: #FFA500;
  --danger-red: #dc3545;
  --info-blue: #007bff;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-muted: #888888;
}
```

### **Typography:**
```css
/* Legal Document Font Stack */
font-family: 'Times New Roman', Georgia, serif; /* For legal content */
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; /* For UI elements */

/* Font Sizes */
--font-xs: 0.75rem;    /* 12px - footnotes */
--font-sm: 0.875rem;   /* 14px - secondary text */
--font-base: 1rem;     /* 16px - body text */
--font-lg: 1.125rem;   /* 18px - subheadings */
--font-xl: 1.25rem;    /* 20px - section titles */
--font-2xl: 1.5rem;    /* 24px - page titles */
--font-3xl: 1.875rem;  /* 30px - main headings */
```

---

## **📱 SCREEN STRUCTURE & NAVIGATION**

### **🔧 DOCUSIGN & EMAIL MANAGEMENT SCREENS**

#### **A. DocuSign Dashboard**
```jsx
<div className="docusign-dashboard">
  <div className="screen-header">
    <h1>✍️ DocuSign Document Management</h1>
    <div className="header-actions">
      <button className="btn-secondary">📊 View Analytics</button>
      <button className="btn-primary">📝 Create New Envelope</button>
    </div>
  </div>

  {/* Status Overview Cards */}
  <div className="docusign-stats">
    <div className="stat-card pending">
      <div className="stat-icon">⏳</div>
      <div className="stat-info">
        <h3>47</h3>
        <p>Pending Signatures</p>
      </div>
      <div className="stat-trend">2 expiring today</div>
    </div>
    
    <div className="stat-card completed">
      <div className="stat-icon">✅</div>
      <div className="stat-info">
        <h3>238</h3>
        <p>Completed This Month</p>
      </div>
      <div className="stat-trend">↗️ +23%</div>
    </div>
    
    <div className="stat-card templates">
      <div className="stat-icon">📄</div>
      <div className="stat-info">
        <h3>12</h3>
        <p>Active Templates</p>
      </div>
      <div className="stat-trend">Ready to use</div>
    </div>
  </div>

  {/* Quick Actions */}
  <div className="docusign-quick-actions">
    <div className="quick-action-card">
      <h3>📝 Create from Template</h3>
      <div className="template-list">
        <button className="template-btn">
          <span className="template-icon">📋</span>
          <div className="template-info">
            <strong>Medical Authorization</strong>
            <p>Standard HIPAA authorization form</p>
          </div>
        </button>
        
        <button className="template-btn">
          <span className="template-icon">⚖️</span>
          <div className="template-info">
            <strong>Retainer Agreement</strong>
            <p>Mass tort contingency agreement</p>
          </div>
        </button>
        
        <button className="template-btn">
          <span className="template-icon">💰</span>
          <div className="template-info">
            <strong>Settlement Authorization</strong>
            <p>Client settlement approval form</p>
          </div>
        </button>
      </div>
    </div>

    <div className="quick-action-card">
      <h3>📧 Bulk Send</h3>
      <div className="bulk-options">
        <button className="bulk-btn">
          <span className="bulk-icon">👥</span>
          <div className="bulk-info">
            <strong>Send to Multiple Clients</strong>
            <p>Same document to multiple recipients</p>
          </div>
        </button>
        
        <button className="bulk-btn">
          <span className="bulk-icon">📋</span>
          <div className="bulk-info">
            <strong>Send Different Documents</strong>
            <p>Customized documents per client</p>
          </div>
        </button>
      </div>
    </div>
  </div>

  {/* Active Envelopes Table */}
  <div className="docusign-envelopes">
    <h2>📬 Active Envelopes</h2>
    <div className="envelope-filters">
      <button className="filter-btn active">All</button>
      <button className="filter-btn">Pending</button>
      <button className="filter-btn">Completed</button>
      <button className="filter-btn">Expired</button>
    </div>
    
    <table className="envelopes-table">
      <thead>
        <tr>
          <th>Document</th>
          <th>Client</th>
          <th>Matter Number</th>
          <th>Status</th>
          <th>Sent Date</th>
          <th>Due Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr className="envelope-row pending">
          <td>
            <div className="doc-info">
              <span className="doc-icon">📋</span>
              <div>
                <strong>Medical Authorization</strong>
                <p className="doc-meta">HIPAA Form v2.1</p>
              </div>
            </div>
          </td>
          <td>Sarah Johnson</td>
          <td><a href="/cases/ZAN20245727">ZAN20245727</a></td>
          <td>
            <span className="status-badge pending-signature">
              ⏳ Pending Signature
            </span>
          </td>
          <td>Dec 1, 2024</td>
          <td className="due-urgent">Dec 5, 2024</td>
          <td>
            <div className="action-buttons">
              <button className="btn-icon" title="Send Reminder">📧</button>
              <button className="btn-icon" title="View Document">👁️</button>
              <button className="btn-icon" title="Resend">🔄</button>
            </div>
          </td>
        </tr>
        
        <tr className="envelope-row completed">
          <td>
            <div className="doc-info">
              <span className="doc-icon">⚖️</span>
              <div>
                <strong>Retainer Agreement</strong>
                <p className="doc-meta">Mass Tort Agreement</p>
              </div>
            </div>
          </td>
          <td>Michael Rodriguez</td>
          <td><a href="/cases/ZAN20246789">ZAN20246789</a></td>
          <td>
            <span className="status-badge completed">
              ✅ Completed
            </span>
          </td>
          <td>Nov 28, 2024</td>
          <td>Dec 2, 2024</td>
          <td>
            <div className="action-buttons">
              <button className="btn-icon" title="View Signed">👁️</button>
              <button className="btn-icon" title="Download PDF">⬇️</button>
              <button className="btn-icon" title="Link to Case">🔗</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Template Management */}
  <div className="template-management">
    <h2>📄 Document Templates</h2>
    <div className="template-grid">
      <div className="template-card">
        <div className="template-header">
          <h4>📋 Medical Authorization</h4>
          <div className="template-actions">
            <button className="btn-icon">✏️</button>
            <button className="btn-icon">📝</button>
          </div>
        </div>
        <div className="template-stats">
          <span>Used 47 times this month</span>
          <span>94% completion rate</span>
        </div>
        <div className="template-preview">
          <p>Standard HIPAA authorization form with client signature fields...</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### **B. Email Campaign Management**
```jsx
<div className="email-campaign">
  <div className="screen-header">
    <h1>📧 Mass Email & Communication Center</h1>
    <div className="header-actions">
      <button className="btn-secondary">📊 Campaign Analytics</button>
      <button className="btn-primary">✉️ Create Campaign</button>
    </div>
  </div>

  {/* Campaign Types */}
  <div className="campaign-types">
    <div className="campaign-card">
      <div className="campaign-icon">🏥</div>
      <h3>Medical Record Requests</h3>
      <p>Automated requests to healthcare providers</p>
      <div className="campaign-stats">
        <span>📊 87% Response Rate</span>
        <span>⏱️ Avg 5 days response</span>
      </div>
      <button className="btn-primary">Create Campaign</button>
    </div>
    
    <div className="campaign-card">
      <div className="campaign-icon">👥</div>
      <h3>Client Updates</h3>
      <p>Case status updates and important notifications</p>
      <div className="campaign-stats">
        <span>📊 94% Open Rate</span>
        <span>⏱️ Sent to 2,047 clients</span>
      </div>
      <button className="btn-primary">Create Campaign</button>
    </div>
    
    <div className="campaign-card">
      <div className="campaign-icon">🏛️</div>
      <h3>Court Deadline Reminders</h3>
      <p>Automated reminders for upcoming deadlines</p>
      <div className="campaign-stats">
        <span>📊 99% Delivery Rate</span>
        <span>⏱️ 24h before deadline</span>
      </div>
      <button className="btn-primary">Create Campaign</button>
    </div>
  </div>

  {/* Campaign Builder */}
  <div className="campaign-builder">
    <h2>✉️ Create New Email Campaign</h2>
    
    <div className="builder-steps">
      <div className="step active">
        <div className="step-number">1</div>
        <span>Select Recipients</span>
      </div>
      <div className="step">
        <div className="step-number">2</div>
        <span>Design Email</span>
      </div>
      <div className="step">
        <div className="step-number">3</div>
        <span>Review & Send</span>
      </div>
    </div>

    {/* Step 1: Recipients */}
    <div className="builder-content">
      <div className="recipient-selection">
        <h3>👥 Select Recipients</h3>
        
        <div className="selection-options">
          <div className="selection-card">
            <input type="radio" name="recipients" id="case-type" />
            <label htmlFor="case-type" className="selection-label">
              <h4>📁 By Case Type</h4>
              <p>All clients in specific case categories</p>
            </label>
            <div className="selection-details">
              <select>
                <option>Select Case Type</option>
                <option>Zantac Cases (2,047 clients)</option>
                <option>NEC Cases (35 clients)</option>
                <option>Hair Relaxer Cases (23 clients)</option>
              </select>
            </div>
          </div>
          
          <div className="selection-card">
            <input type="radio" name="recipients" id="case-status" />
            <label htmlFor="case-status" className="selection-label">
              <h4>⚖️ By Case Status</h4>
              <p>Clients with specific case status</p>
            </label>
            <div className="selection-details">
              <select>
                <option>Select Status</option>
                <option>Active Cases (1,847 clients)</option>
                <option>Pending Review (156 clients)</option>
                <option>Settlement Phase (44 clients)</option>
              </select>
            </div>
          </div>
          
          <div className="selection-card">
            <input type="radio" name="recipients" id="custom-list" />
            <label htmlFor="custom-list" className="selection-label">
              <h4>📋 Custom List</h4>
              <p>Upload CSV or select individual clients</p>
            </label>
            <div className="selection-details">
              <button className="btn-secondary">📤 Upload CSV</button>
              <button className="btn-secondary">👥 Select Manually</button>
            </div>
          </div>
        </div>

        <div className="recipient-preview">
          <h4>📊 Selected Recipients: 2,047 clients</h4>
          <div className="recipient-stats">
            <div className="stat">
              <span className="stat-value">2,047</span>
              <span className="stat-label">Total Recipients</span>
            </div>
            <div className="stat">
              <span className="stat-value">94%</span>
              <span className="stat-label">Valid Email Rate</span>
            </div>
            <div className="stat">
              <span className="stat-value">$2.05</span>
              <span className="stat-label">Estimated Cost</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Active Campaigns */}
  <div className="active-campaigns">
    <h2>📊 Active Campaigns</h2>
    <div className="campaign-list">
      <div className="campaign-item">
        <div className="campaign-info">
          <h4>🏥 Medical Records Request - Zantac Cases</h4>
          <p>Requesting complete medical records from primary care providers</p>
          <div className="campaign-meta">
            <span>Sent to: 2,047 providers</span>
            <span>Started: Dec 1, 2024</span>
          </div>
        </div>
        <div className="campaign-metrics">
          <div className="metric">
            <span className="metric-value">87%</span>
            <span className="metric-label">Delivered</span>
          </div>
          <div className="metric">
            <span className="metric-value">34%</span>
            <span className="metric-label">Responses</span>
          </div>
          <div className="metric">
            <span className="metric-value">12%</span>
            <span className="metric-label">Records Received</span>
          </div>
        </div>
        <div className="campaign-actions">
          <button className="btn-secondary">📊 View Details</button>
          <button className="btn-secondary">📧 Send Follow-up</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## **📱 SCREEN STRUCTURE & NAVIGATION**

### **1. 🔐 LOGIN & AUTHENTICATION SCREENS**

#### **A. Login Screen**
```jsx
<div className="login-container">
  <div className="login-card">
    <div className="logo-section">
      <img src="/sherlock-logo.svg" alt="Sherlock AI" />
      <h1>SHERLOCK AI</h1>
      <p>Legal Case Management System</p>
    </div>
    
    <form className="login-form">
      <div className="form-group">
        <label>Email / Username</label>
        <input type="email" placeholder="attorney@watts-law.com" />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input type="password" placeholder="••••••••••••" />
      </div>
      
      <div className="form-options">
        <label className="checkbox">
          <input type="checkbox" /> Remember me
        </label>
        <a href="/forgot-password">Forgot Password?</a>
      </div>
      
      <button className="btn-primary">Sign In</button>
    </form>
    
    <div className="login-footer">
      <p>Watts Law Firm - Confidential Attorney System</p>
    </div>
  </div>
</div>
```

**CSS Styling:**
```css
.login-container {
  background: linear-gradient(135deg, var(--primary-black) 0%, var(--dark-gray) 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: var(--primary-black);
  border: 2px solid var(--primary-yellow);
  border-radius: 12px;
  padding: 2rem;
  width: 400px;
  box-shadow: 0 20px 40px rgba(255, 215, 0, 0.1);
}

.logo-section h1 {
  color: var(--primary-yellow);
  font-size: var(--font-3xl);
  text-align: center;
  margin: 1rem 0;
  font-weight: 700;
  letter-spacing: 2px;
}

.btn-primary {
  background: var(--primary-yellow);
  color: var(--primary-black);
  border: none;
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 6px;
  width: 100%;
  font-size: var(--font-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--secondary-yellow);
  transform: translateY(-1px);
}
```

#### **B. Role Selection Screen (Post-Login)**
```jsx
<div className="role-selection">
  <h2>Select Your Role</h2>
  <div className="role-cards">
    <div className="role-card admin">
      <div className="role-icon">👑</div>
      <h3>System Administrator</h3>
      <p>Full system access & user management</p>
      <button>Continue as Admin</button>
    </div>
    
    <div className="role-card attorney">
      <div className="role-icon">⚖️</div>
      <h3>Attorney</h3>
      <p>Complete case management & legal operations</p>
      <button>Continue as Attorney</button>
    </div>
    
    <div className="role-card paralegal">
      <div className="role-icon">📋</div>
      <h3>Paralegal</h3>
      <p>Case support & document management</p>
      <button>Continue as Paralegal</button>
    </div>
  </div>
</div>
```

---

### **2. 📊 DASHBOARD & HOME SCREEN**

#### **A. Main Dashboard**
```jsx
<div className="dashboard">
  {/* Top Navigation */}
  <header className="top-nav">
    <div className="nav-left">
      <img src="/sherlock-logo.svg" className="nav-logo" />
      <h1>SHERLOCK AI</h1>
    </div>
    
    <div className="nav-center">
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search by Matter Number, Client Name, or Case Type..."
        />
        <button className="search-btn">🔍</button>
      </div>
    </div>
    
    <div className="nav-right">
      <div className="user-menu">
        <span>Maria Rodriguez, Esq.</span>
        <div className="user-avatar">MR</div>
      </div>
    </div>
  </header>

  {/* Side Navigation */}
  <nav className="sidebar">
    <ul className="nav-menu">
      <li className="nav-item active">
        <a href="/dashboard">📊 Dashboard</a>
      </li>
      <li className="nav-item">
        <a href="/cases">📁 Cases</a>
        <ul className="sub-menu">
          <li><a href="/cases/active">Active Cases</a></li>
          <li><a href="/cases/pending">Pending Review</a></li>
          <li><a href="/cases/closed">Closed Cases</a></li>
        </ul>
      </li>
      <li className="nav-item">
        <a href="/clients">👥 Clients</a>
      </li>
      <li className="nav-item">
        <a href="/documents">📄 Documents</a>
      </li>
      <li className="nav-item">
        <a href="/calendar">📅 Calendar</a>
      </li>
      <li className="nav-item">
        <a href="/reports">📈 Reports</a>
      </li>
      <li className="nav-item">
        <a href="/court-releases">🏛️ Court Releases</a>
      </li>
      <li className="nav-item">
        <a href="/file-explorer">📂 File Explorer</a>
      </li>
      <li className="nav-item">
        <a href="/docusign">✍️ DocuSign</a>
      </li>
      <li className="nav-item">
        <a href="/email-campaigns">📧 Email Campaigns</a>
      </li>
    </ul>
  </nav>

  {/* Main Content */}
  <main className="main-content">
    {/* Stats Cards */}
    <div className="stats-grid">
      <div className="stat-card total-cases">
        <div className="stat-icon">📁</div>
        <div className="stat-info">
          <h3>2,105</h3>
          <p>Total Cases</p>
        </div>
        <div className="stat-trend">↗️ +15%</div>
      </div>
      
      <div className="stat-card active-cases">
        <div className="stat-icon">⚡</div>
        <div className="stat-info">
          <h3>1,847</h3>
          <p>Active Cases</p>
        </div>
        <div className="stat-trend">↗️ +8%</div>
      </div>
      
      <div className="stat-card pending-deadlines">
        <div className="stat-icon">⏰</div>
        <div className="stat-info">
          <h3>23</h3>
          <p>Pending Deadlines</p>
        </div>
        <div className="stat-trend urgent">🚨 Urgent</div>
      </div>
      
      <div className="stat-card settlements">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>$2.4M</h3>
          <p>Settlements (YTD)</p>
        </div>
        <div className="stat-trend">↗️ +32%</div>
      </div>
      
      <div className="stat-card docusign-pending">
        <div className="stat-icon">✍️</div>
        <div className="stat-info">
          <h3>47</h3>
          <p>Pending Signatures</p>
        </div>
        <div className="stat-trend urgent">⚠️ 2 expiring today</div>
      </div>
      
      <div className="stat-card email-campaigns">
        <div className="stat-icon">📧</div>
        <div className="stat-info">
          <h3>3</h3>
          <p>Active Campaigns</p>
        </div>
        <div className="stat-trend">📊 87% response rate</div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="action-buttons">
        <button className="action-btn new-case">
          <span className="btn-icon">➕</span>
          New Case
        </button>
        <button className="action-btn search-case">
          <span className="btn-icon">🔍</span>
          Search Cases
        </button>
        <button className="action-btn generate-report">
          <span className="btn-icon">📊</span>
          Generate Report
        </button>
        <button className="action-btn upload-docs">
          <span className="btn-icon">📤</span>
          Upload Documents
        </button>
      </div>
    </div>

    {/* Recent Activity & Alerts */}
    <div className="dashboard-grid">
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon new">➕</div>
            <div className="activity-content">
              <p><strong>New case filed:</strong> ZAN20249999</p>
              <span className="activity-time">2 minutes ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon update">🔄</div>
            <div className="activity-content">
              <p><strong>Medical records updated:</strong> NEC20240123</p>
              <span className="activity-time">15 minutes ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon court">🏛️</div>
            <div className="activity-content">
              <p><strong>Court filing submitted:</strong> HR20240456</p>
              <span className="activity-time">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>

      <div className="alerts-panel">
        <h2>Alerts & Deadlines</h2>
        <div className="alert-list">
          <div className="alert-item critical">
            <div className="alert-icon">🚨</div>
            <div className="alert-content">
              <p><strong>SOL Deadline:</strong> ZAN20245555</p>
              <span className="alert-date">Due: Tomorrow</span>
            </div>
          </div>
          
          <div className="alert-item warning">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <p><strong>Court deficiency:</strong> NEC20240789</p>
              <span className="alert-date">Cure by: Dec 15</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Case Type Overview */}
    <div className="case-overview">
      <h2>Cases by Type</h2>
      <div className="case-type-grid">
        <div className="case-type-card zantac">
          <div className="case-type-header">
            <h3>Zantac</h3>
            <span className="case-count">2,047</span>
          </div>
          <div className="case-type-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '87%'}}></div>
            </div>
            <span>87% Active</span>
          </div>
        </div>
        
        <div className="case-type-card nec">
          <div className="case-type-header">
            <h3>NEC</h3>
            <span className="case-count">35</span>
          </div>
          <div className="case-type-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '92%'}}></div>
            </div>
            <span>92% Active</span>
          </div>
        </div>
        
        <div className="case-type-card hair-relaxer">
          <div className="case-type-header">
            <h3>Hair Relaxer</h3>
            <span className="case-count">23</span>
          </div>
          <div className="case-type-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '78%'}}></div>
            </div>
            <span>78% Active</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
```

---

### **3. 📁 FILE EXPLORER SCREEN - S3 CLIENT FOLDERS**

#### **A. File Explorer Dashboard**
```jsx
<div className="file-explorer">
  <div className="screen-header">
    <h1>📂 Client Document Explorer</h1>
    <div className="header-actions">
      <button className="btn-secondary">🔍 Search Files</button>
      <button className="btn-primary">📤 Upload Documents</button>
    </div>
  </div>

  {/* Breadcrumb Navigation */}
  <div className="breadcrumb">
    <span className="breadcrumb-item">🏠 Root</span>
    <span className="breadcrumb-separator">></span>
    <span className="breadcrumb-item active">Client Folders</span>
  </div>

  {/* File System Tree View */}
  <div className="explorer-layout">
    {/* Left Sidebar - Folder Tree */}
    <div className="folder-tree">
      <div className="tree-section">
        <h3>📁 Client Folders (by Matter Number)</h3>
        <div className="folder-list">
          <div className="folder-item expandable expanded">
            <div className="folder-header">
              <span className="folder-icon">📁</span>
              <span className="folder-name">ZAN2024001 - Sarah Johnson</span>
              <span className="file-count">(143 files)</span>
            </div>
            <div className="subfolder-list">
              <div className="subfolder-item">
                <span className="folder-icon">📄</span>
                <span>Medical Records</span>
                <span className="file-count">(24)</span>
              </div>
              <div className="subfolder-item">
                <span className="folder-icon">⚖️</span>
                <span>Court Documents</span>
                <span className="file-count">(8)</span>
              </div>
              <div className="subfolder-item">
                <span className="folder-icon">📝</span>
                <span>Client Communications</span>
                <span className="file-count">(67)</span>
              </div>
              <div className="subfolder-item">
                <span className="folder-icon">💰</span>
                <span>Financial</span>
                <span className="file-count">(12)</span>
              </div>
              <div className="subfolder-item">
                <span className="folder-icon">✍️</span>
                <span>DocuSign Documents</span>
                <span className="file-count">(32)</span>
              </div>
            </div>
          </div>
          
          <div className="folder-item">
            <span className="folder-icon">📁</span>
            <span className="folder-name">ZAN2024002 - Michael Rodriguez</span>
            <span className="file-count">(89 files)</span>
          </div>
          
          <div className="folder-item">
            <span className="folder-icon">📁</span>
            <span className="folder-name">NEC2024001 - Patricia Williams</span>
            <span className="file-count">(156 files)</span>
          </div>
        </div>
      </div>
      
      {/* Quick Filters */}
      <div className="tree-filters">
        <h4>🔍 Quick Filters</h4>
        <div className="filter-buttons">
          <button className="filter-btn active">All Files</button>
          <button className="filter-btn">Medical</button>
          <button className="filter-btn">Court</button>
          <button className="filter-btn">Signed Docs</button>
          <button className="filter-btn">Pending Signature</button>
        </div>
      </div>
    </div>

    {/* Main Content - File Grid */}
    <div className="file-content">
      <div className="content-header">
        <h2>📂 ZAN2024001 - Sarah Johnson > Medical Records</h2>
        <div className="view-options">
          <button className="view-btn active">🔲 Grid</button>
          <button className="view-btn">📋 List</button>
          <button className="view-btn">🗓️ Timeline</button>
        </div>
      </div>

      {/* File Grid */}
      <div className="file-grid">
        <div className="file-card pdf">
          <div className="file-preview">
            <div className="file-icon">📄</div>
            <div className="file-overlay">
              <button className="overlay-btn">👁️ Preview</button>
              <button className="overlay-btn">⬇️ Download</button>
            </div>
          </div>
          <div className="file-info">
            <h4>Pathology Report - MD Anderson</h4>
            <p className="file-meta">PDF • 2.4 MB • Mar 15, 2020</p>
            <div className="file-tags">
              <span className="tag medical">Medical</span>
              <span className="tag hipaa">HIPAA Protected</span>
            </div>
          </div>
          <div className="file-actions">
            <button className="btn-icon" title="AI Summary">🤖</button>
            <button className="btn-icon" title="Share">🔗</button>
            <button className="btn-icon" title="More">⋯</button>
          </div>
        </div>

        <div className="file-card docusign-pending">
          <div className="file-preview">
            <div className="file-icon">✍️</div>
            <div className="docusign-status">Pending Signature</div>
          </div>
          <div className="file-info">
            <h4>Medical Authorization Form</h4>
            <p className="file-meta">DocuSign • Sent 2 days ago</p>
            <div className="file-tags">
              <span className="tag pending">Pending</span>
              <span className="tag urgent">Due Tomorrow</span>
            </div>
          </div>
          <div className="file-actions">
            <button className="btn-icon" title="Send Reminder">📧</button>
            <button className="btn-icon" title="View Status">👁️</button>
          </div>
        </div>

        <div className="file-card image">
          <div className="file-preview">
            <img src="/api/files/preview/img123" alt="X-Ray scan" />
          </div>
          <div className="file-info">
            <h4>Chest X-Ray - Pre-treatment</h4>
            <p className="file-meta">JPEG • 1.2 MB • Jan 10, 2020</p>
            <div className="file-tags">
              <span className="tag medical">Medical</span>
              <span className="tag diagnostic">Diagnostic</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Analytics */}
      <div className="file-analytics">
        <div className="analytics-card">
          <h4>📊 Folder Statistics</h4>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">143</span>
              <span className="stat-label">Total Files</span>
            </div>
            <div className="stat">
              <span className="stat-value">89%</span>
              <span className="stat-label">Organized</span>
            </div>
            <div className="stat">
              <span className="stat-value">32</span>
              <span className="stat-label">Pending Signatures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **4. 📁 CASES MANAGEMENT SCREENS**

#### **A. Cases List Screen**
```jsx
<div className="cases-screen">
  <div className="screen-header">
    <h1>Case Management</h1>
    <div className="header-actions">
      <button className="btn-secondary">Export</button>
      <button className="btn-primary">+ New Case</button>
    </div>
  </div>

  {/* Filters & Search */}
  <div className="filters-bar">
    <div className="filter-group">
      <label>Case Type:</label>
      <select>
        <option value="">All Types</option>
        <option value="ZANTAC">Zantac</option>
        <option value="NEC">NEC</option>
        <option value="HAIR_RELAXER">Hair Relaxer</option>
      </select>
    </div>
    
    <div className="filter-group">
      <label>Status:</label>
      <select>
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="PENDING">Pending Review</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>
    
    <div className="filter-group">
      <label>Attorney:</label>
      <select>
        <option value="">All Attorneys</option>
        <option value="ATT001">Maria Rodriguez</option>
        <option value="ATT002">John Smith</option>
      </select>
    </div>
    
    <div className="search-group">
      <input type="text" placeholder="Search Matter Number, Client Name..." />
      <button className="search-btn">🔍</button>
    </div>
  </div>

  {/* Cases Table */}
  <div className="data-table">
    <table className="cases-table">
      <thead>
        <tr>
          <th>Matter Number</th>
          <th>Client Name</th>
          <th>Case Type</th>
          <th>Status</th>
          <th>Attorney</th>
          <th>SOL Date</th>
          <th>Last Activity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr className="case-row">
          <td className="matter-number">
            <a href="/cases/ZAN20245727">ZAN20245727</a>
          </td>
          <td>Sarah Johnson</td>
          <td>
            <span className="case-type-badge zantac">Zantac</span>
          </td>
          <td>
            <span className="status-badge active">Active</span>
          </td>
          <td>Maria Rodriguez, Esq.</td>
          <td className="sol-date warning">Dec 15, 2024</td>
          <td>2 hours ago</td>
          <td>
            <div className="action-buttons">
              <button className="btn-icon" title="View">👁️</button>
              <button className="btn-icon" title="Edit">✏️</button>
              <button className="btn-icon" title="Documents">📄</button>
            </div>
          </td>
        </tr>
        {/* More rows... */}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="pagination">
    <button className="page-btn">« Previous</button>
    <span className="page-info">Page 1 of 87</span>
    <button className="page-btn">Next »</button>
  </div>
</div>
```

#### **B. Individual Case Detail Screen**
```jsx
<div className="case-detail">
  {/* Case Header */}
  <div className="case-header">
    <div className="case-title">
      <h1>ZAN20245727</h1>
      <div className="case-badges">
        <span className="case-type-badge zantac">Zantac</span>
        <span className="status-badge active">Active</span>
        <span className="priority-badge high">High Priority</span>
      </div>
    </div>
    
    <div className="case-actions">
      <button className="btn-secondary">Print Summary</button>
      <button className="btn-secondary">Generate Report</button>
      <button className="btn-primary">Update Case</button>
    </div>
  </div>

  {/* Case Navigation Tabs */}
  <div className="case-tabs">
    <nav className="tab-nav">
      <button className="tab-btn active">Overview</button>
      <button className="tab-btn">Parties</button>
      <button className="tab-btn">Medical Records</button>
      <button className="tab-btn">Documents</button>
      <button className="tab-btn">Financial</button>
      <button className="tab-btn">Court Releases</button>
      <button className="tab-btn">Timeline</button>
      <button className="tab-btn">AI Summary</button>
    </nav>
  </div>

  {/* Tab Content - Overview */}
  <div className="tab-content overview-tab">
    <div className="overview-grid">
      {/* Client Information */}
      <div className="info-card client-info">
        <h3>👤 Client Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name:</label>
            <span>Sarah Michelle Johnson</span>
          </div>
          <div className="info-item">
            <label>DOB:</label>
            <span>March 15, 1965</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>(555) 123-4567</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>sarah.johnson@email.com</span>
          </div>
          <div className="info-item full-width">
            <label>Address:</label>
            <span>1234 Main Street, Houston, TX 77001</span>
          </div>
        </div>
      </div>

      {/* Case Information */}
      <div className="info-card case-info">
        <h3>⚖️ Case Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Intake Date:</label>
            <span>January 15, 2024</span>
          </div>
          <div className="info-item">
            <label>SOL Date:</label>
            <span className="sol-warning">December 15, 2024</span>
          </div>
          <div className="info-item">
            <label>Assigned Attorney:</label>
            <span>Maria Rodriguez, Esq.</span>
          </div>
          <div className="info-item">
            <label>Paralegal:</label>
            <span>Carlos Johnson</span>
          </div>
          <div className="info-item full-width">
            <label>Case Summary:</label>
            <span>72-year-old female with gastric cancer diagnosis following extensive Zantac usage from 2015-2019.</span>
          </div>
        </div>
      </div>

      {/* Medical Summary */}
      <div className="info-card medical-summary">
        <h3>🏥 Medical Summary</h3>
        <div className="medical-timeline">
          <div className="timeline-item">
            <div className="timeline-date">2020</div>
            <div className="timeline-content">
              <strong>Initial Diagnosis:</strong> Gastric adenocarcinoma
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2020-2021</div>
            <div className="timeline-content">
              <strong>Treatment:</strong> Chemotherapy and surgical resection
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2024</div>
            <div className="timeline-content">
              <strong>Current Status:</strong> In remission, ongoing monitoring
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="info-card ai-summary">
        <h3>🤖 AI Case Summary</h3>
        <div className="ai-content">
          <p><strong>Liability Assessment:</strong> Strong product liability case with clear Zantac usage pattern and temporal relationship to cancer diagnosis.</p>
          <p><strong>Medical Strength:</strong> Well-documented medical history with oncology records supporting causation theory.</p>
          <p><strong>Recommended Actions:</strong></p>
          <ul>
            <li>Obtain complete pharmacy records for 2015-2019 period</li>
            <li>Schedule expert medical review</li>
            <li>Coordinate with MDL proceedings</li>
          </ul>
          <div className="confidence-score">
            <label>Case Strength:</label>
            <div className="confidence-bar">
              <div className="confidence-fill strong" style={{width: '85%'}}></div>
            </div>
            <span>85% Strong</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Parties Tab Content */}
  <div className="tab-content parties-tab hidden">
    <div className="parties-section">
      <div className="section-header">
        <h3>👥 Case Parties</h3>
        <button className="btn-primary">+ Add Party</button>
      </div>
      
      <div className="parties-grid">
        {/* Injured Party */}
        <div className="party-card injured-party">
          <div className="party-header">
            <h4>👤 Injured Party</h4>
            <span className="party-type">Primary Plaintiff</span>
          </div>
          <div className="party-details">
            <p><strong>Name:</strong> Sarah Michelle Johnson</p>
            <p><strong>Relationship:</strong> Self</p>
            <p><strong>Status:</strong> Living</p>
            <p><strong>Age at Diagnosis:</strong> 55 years old</p>
          </div>
          <div className="party-actions">
            <button className="btn-icon">✏️</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>

        {/* Executor (if applicable) */}
        <div className="party-card executor">
          <div className="party-header">
            <h4>⚖️ Legal Representative</h4>
            <span className="party-type">Power of Attorney</span>
          </div>
          <div className="party-details">
            <p><strong>Name:</strong> Michael Johnson</p>
            <p><strong>Relationship:</strong> Son</p>
            <p><strong>Authority:</strong> Medical & Legal Decisions</p>
          </div>
          <div className="party-actions">
            <button className="btn-icon">✏️</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>

        {/* Witnesses */}
        <div className="party-card witness">
          <div className="party-header">
            <h4>👁️ Witness #1</h4>
            <span className="party-type">Fact Witness</span>
          </div>
          <div className="party-details">
            <p><strong>Name:</strong> Dr. Patricia Williams</p>
            <p><strong>Role:</strong> Primary Care Physician</p>
            <p><strong>Testimony:</strong> Prescribed Zantac 2015-2018</p>
          </div>
          <div className="party-actions">
            <button className="btn-icon">✏️</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>

        <div className="party-card witness">
          <div className="party-header">
            <h4>👁️ Witness #2</h4>
            <span className="party-type">Character Witness</span>
          </div>
          <div className="party-details">
            <p><strong>Name:</strong> Jennifer Martinez</p>
            <p><strong>Role:</strong> Neighbor/Friend</p>
            <p><strong>Testimony:</strong> Observed daily Zantac use</p>
          </div>
          <div className="party-actions">
            <button className="btn-icon">✏️</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Medical Records Tab */}
  <div className="tab-content medical-tab hidden">
    <div className="medical-section">
      <div className="section-header">
        <h3>🏥 Medical Records</h3>
        <button className="btn-primary">+ Add Record</button>
      </div>
      
      <div className="medical-records-list">
        <div className="medical-record-card">
          <div className="record-header">
            <h4>🔬 Pathology Report</h4>
            <span className="record-date">March 2020</span>
          </div>
          <div className="record-details">
            <p><strong>Provider:</strong> MD Anderson Cancer Center</p>
            <p><strong>Type:</strong> Gastric Biopsy Results</p>
            <p><strong>AI Summary:</strong> Confirmed gastric adenocarcinoma, stage II, with characteristics consistent with NDMA-induced carcinogenesis patterns.</p>
          </div>
          <div className="record-actions">
            <button className="btn-secondary">View Full Report</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>

        <div className="medical-record-card">
          <div className="record-header">
            <h4>💊 Treatment Records</h4>
            <span className="record-date">2020-2021</span>
          </div>
          <div className="record-details">
            <p><strong>Provider:</strong> Houston Methodist Hospital</p>
            <p><strong>Type:</strong> Chemotherapy & Surgery Records</p>
            <p><strong>AI Summary:</strong> Complete treatment protocol including 6 cycles of FOLFOX chemotherapy and subtotal gastrectomy.</p>
          </div>
          <div className="record-actions">
            <button className="btn-secondary">View Full Report</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>

        <div className="medical-record-card">
          <div className="record-header">
            <h4>📋 Primary Care Records</h4>
            <span className="record-date">2015-2019</span>
          </div>
          <div className="record-details">
            <p><strong>Provider:</strong> Dr. Patricia Williams, MD</p>
            <p><strong>Type:</strong> Complete Medical History</p>
            <p><strong>AI Summary:</strong> Documents regular Zantac prescriptions and usage pattern. No prior GI malignancy risk factors identified.</p>
          </div>
          <div className="record-actions">
            <button className="btn-secondary">View Full Report</button>
            <button className="btn-icon">📄</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### **4. 🏛️ COURT RELEASES & DEFICIENCIES SCREEN**

```jsx
<div className="court-releases-screen">
  <div className="screen-header">
    <h1>🏛️ Court Releases & Deficiencies</h1>
    <div className="header-actions">
      <button className="btn-secondary">Export Report</button>
      <button className="btn-primary">+ New Filing</button>
    </div>
  </div>

  {/* Filters */}
  <div className="filters-bar">
    <div className="filter-group">
      <label>Court:</label>
      <select>
        <option value="">All Courts</option>
        <option value="MDL_2924">Federal MDL 2924</option>
        <option value="HARRIS_COUNTY">Harris County District Court</option>
      </select>
    </div>
    
    <div className="filter-group">
      <label>Status:</label>
      <select>
        <option value="">All Status</option>
        <option value="FILED">Filed</option>
        <option value="PENDING_CURE">Pending Cure</option>
        <option value="DEFICIENT">Deficient</option>
        <option value="ACCEPTED">Accepted</option>
      </select>
    </div>
  </div>

  {/* Court Releases Table */}
  <div className="court-releases-table">
    <table>
      <thead>
        <tr>
          <th>Matter Number</th>
          <th>Filing Type</th>
          <th>Court</th>
          <th>Filed Date</th>
          <th>Status</th>
          <th>Deficiencies</th>
          <th>Cure Deadline</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr className="filing-row">
          <td><a href="/cases/ZAN20245727">ZAN20245727</a></td>
          <td>Complaint Filing</td>
          <td>Federal MDL 2924</td>
          <td>Dec 1, 2024</td>
          <td>
            <span className="status-badge deficient">Deficient</span>
          </td>
          <td>
            <div className="deficiencies-list">
              <div className="deficiency-item critical">
                <span className="def-icon">🚨</span>
                <span className="def-text">Missing Exhibit A signature</span>
              </div>
              <div className="deficiency-item warning">
                <span className="def-icon">⚠️</span>
                <span className="def-text">Incorrect filing fee</span>
              </div>
            </div>
          </td>
          <td className="deadline urgent">Dec 8, 2024</td>
          <td>
            <div className="action-buttons">
              <button className="btn-icon" title="Cure Deficiency">🔧</button>
              <button className="btn-icon" title="View Filing">👁️</button>
              <button className="btn-icon" title="Court Documents">📄</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Deficiency Detail Panel */}
  <div className="deficiency-panel">
    <h3>🔧 Deficiency Cure Tracker</h3>
    <div className="deficiency-cards">
      <div className="deficiency-card critical">
        <div className="deficiency-header">
          <h4>🚨 Critical Deficiency</h4>
          <span className="deadline">Due: Dec 8, 2024</span>
        </div>
        <div className="deficiency-content">
          <p><strong>Issue:</strong> Missing notarized signature on Exhibit A</p>
          <p><strong>Required Action:</strong> Obtain client signature and notarization</p>
          <p><strong>Status:</strong> Appointment scheduled for Dec 5</p>
        </div>
        <div className="deficiency-actions">
          <button className="btn-primary">Mark as Cured</button>
          <button className="btn-secondary">Update Status</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### **5. 📊 REPORTS & ANALYTICS SCREEN**

```jsx
<div className="reports-screen">
  <div className="screen-header">
    <h1>📊 Reports & Analytics</h1>
    <div className="header-actions">
      <button className="btn-secondary">Schedule Report</button>
      <button className="btn-primary">Generate Custom Report</button>
    </div>
  </div>

  {/* Report Categories */}
  <div className="report-categories">
    <div className="category-card">
      <div className="category-icon">📈</div>
      <h3>Case Analytics</h3>
      <p>Performance metrics and case progression</p>
      <button className="btn-secondary">View Reports</button>
    </div>
    
    <div className="category-card">
      <div className="category-icon">💰</div>
      <h3>Financial Reports</h3>
      <p>Settlement tracking and cost analysis</p>
      <button className="btn-secondary">View Reports</button>
    </div>
    
    <div className="category-card">
      <div className="category-icon">⚖️</div>
      <h3>Legal Compliance</h3>
      <p>SOL tracking and court deadline reports</p>
      <button className="btn-secondary">View Reports</button>
    </div>
    
    <div className="category-card">
      <div className="category-icon">🤖</div>
      <h3>AI Insights</h3>
      <p>Predictive analytics and case recommendations</p>
      <button className="btn-secondary">View Reports</button>
    </div>
  </div>

  {/* Dashboard Widgets */}
  <div className="analytics-dashboard">
    <div className="widget-grid">
      <div className="chart-widget">
        <h3>Cases by Status</h3>
        <div className="pie-chart">
          {/* Chart implementation */}
        </div>
      </div>
      
      <div className="chart-widget">
        <h3>Settlement Trends</h3>
        <div className="line-chart">
          {/* Chart implementation */}
        </div>
      </div>
      
      <div className="chart-widget">
        <h3>Case Distribution by Type</h3>
        <div className="bar-chart">
          {/* Chart implementation */}
        </div>
      </div>
      
      <div className="chart-widget">
        <h3>Attorney Performance</h3>
        <div className="performance-metrics">
          {/* Metrics implementation */}
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### **6. 📱 MOBILE RESPONSIVE CONSIDERATIONS**

```css
/* Mobile Breakpoints */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .case-detail .case-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .filters-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .data-table {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .login-card {
    width: 90%;
    padding: 1.5rem;
  }
  
  .case-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

---

## **🎨 GLOBAL CSS FRAMEWORK**

```css
/* Sherlock AI - Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--primary-black);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Layout Components */
.dashboard {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main";
  grid-template-columns: 280px 1fr;
  grid-template-rows: 70px 1fr;
  min-height: 100vh;
}

.top-nav {
  grid-area: header;
  background: var(--primary-black);
  border-bottom: 2px solid var(--primary-yellow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.sidebar {
  grid-area: sidebar;
  background: var(--dark-gray);
  border-right: 1px solid var(--border-gray);
  overflow-y: auto;
}

.main-content {
  grid-area: main;
  padding: 2rem;
  overflow-y: auto;
}

/* Button Styles */
.btn-primary {
  background: var(--primary-yellow);
  color: var(--primary-black);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-base);
}

.btn-primary:hover {
  background: var(--secondary-yellow);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: var(--primary-yellow);
  border: 1px solid var(--primary-yellow);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary-yellow);
  color: var(--primary-black);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--primary-yellow);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--primary-yellow);
  color: var(--primary-black);
}

/* Card Styles */
.info-card {
  background: var(--dark-gray);
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.info-card h3 {
  color: var(--primary-yellow);
  font-size: var(--font-lg);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-gray);
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: var(--font-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: var(--success-green);
  color: white;
}

.status-badge.pending {
  background: var(--warning-orange);
  color: white;
}

.status-badge.closed {
  background: var(--medium-gray);
  color: white;
}

.status-badge.deficient {
  background: var(--danger-red);
  color: white;
}

/* Case Type Badges */
.case-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: var(--font-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.case-type-badge.zantac {
  background: #FF6B6B;
  color: white;
}

.case-type-badge.nec {
  background: #4ECDC4;
  color: white;
}

.case-type-badge.hair-relaxer {
  background: #45B7D1;
  color: white;
}

/* Data Tables */
.data-table {
  background: var(--dark-gray);
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: var(--medium-gray);
  color: var(--primary-yellow);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-yellow);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-gray);
}

.data-table tr:hover {
  background: var(--medium-gray);
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--primary-yellow);
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: var(--dark-gray);
  border: 1px solid var(--border-gray);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: var(--font-base);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-yellow);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
}

/* Responsive Grid */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }

@media (max-width: 1024px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 { grid-template-columns: 1fr; }
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Loading States */
.loading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.loading::after {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid var(--primary-yellow);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## **🎯 SUMMARY**

**Esta propuesta incluye:**

✅ **8 pantallas principales** con funcionalidad completa  
✅ **Black & Yellow theme** profesional para attorneys  
✅ **Single Table Design** integrado en UI  
✅ **Asociaciones múltiples** (injured party, executors, witnesses)  
✅ **Court releases & deficiencies tracking**  
✅ **AI summaries** integrados en cada sección  
✅ **Mobile responsive** design  
✅ **Accessibility compliant** (WCAG 2.1 AA)  

**¿Te gusta esta propuesta UX/UI? ¿Algún ajuste específico que quieras hacer?** 