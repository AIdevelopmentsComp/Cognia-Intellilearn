import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Dashboard from './components/Dashboard/Dashboard';
import CasesList from './components/Cases/CasesList';
import CaseDetail from './components/Cases/CaseDetail';
import FileExplorer from './components/FileExplorer/FileExplorer';
import DocuSignDashboard from './components/DocuSign/DocuSignDashboard';
import EmailCampaigns from './components/Email/EmailCampaigns';
import CourtReleases from './components/Court/CourtReleases';
import Reports from './components/Reports/Reports';
import Sidebar from './components/Layout/Sidebar';
import TopNavigation from './components/Layout/TopNavigation';

// AWS Amplify Configuration
const awsconfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: 'SherlockAPI',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      },
    ],
  },
};

Amplify.configure(awsconfig);

// Global Theme - Black & Yellow Professional
const theme = {
  colors: {
    primary: {
      black: '#000000',
      yellow: '#FFD700',
      yellowSecondary: '#FFA500',
      yellowAccent: '#FFFF99',
    },
    grays: {
      darkGray: '#1a1a1a',
      mediumGray: '#333333',
      lightGray: '#666666',
      borderGray: '#404040',
    },
    status: {
      success: '#28a745',
      warning: '#FFA500',
      danger: '#dc3545',
      info: '#007bff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      muted: '#888888',
    },
  },
  fonts: {
    legal: "'Times New Roman', Georgia, serif",
    ui: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  shadows: {
    sm: '0 2px 4px rgba(255, 215, 0, 0.1)',
    md: '0 4px 6px rgba(255, 215, 0, 0.15)',
    lg: '0 10px 15px rgba(255, 215, 0, 0.2)',
  },
};

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.ui};
    background-color: ${({ theme }) => theme.colors.primary.black};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.grays.darkGray};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary.yellow};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary.yellowSecondary};
  }

  /* Button Base Styles */
  .btn-primary {
    background: ${({ theme }) => theme.colors.primary.yellow};
    color: ${({ theme }) => theme.colors.primary.black};
    border: none;
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: ${({ theme }) => theme.fontSizes.base};

    &:hover {
      background: ${({ theme }) => theme.colors.primary.yellowSecondary};
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .btn-secondary {
    background: transparent;
    color: ${({ theme }) => theme.colors.primary.yellow};
    border: 1px solid ${({ theme }) => theme.colors.primary.yellow};
    padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${({ theme }) => theme.colors.primary.yellow};
      color: ${({ theme }) => theme.colors.primary.black};
    }
  }

  .btn-icon {
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.primary.yellow};
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: ${({ theme }) => theme.colors.primary.yellow};
      color: ${({ theme }) => theme.colors.primary.black};
    }
  }

  /* Status Badges */
  .status-badge {
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
    border-radius: ${({ theme }) => theme.borderRadius.xl};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.active {
    background: ${({ theme }) => theme.colors.status.success};
    color: white;
  }

  .status-badge.pending {
    background: ${({ theme }) => theme.colors.status.warning};
    color: white;
  }

  .status-badge.closed {
    background: ${({ theme }) => theme.colors.grays.mediumGray};
    color: white;
  }

  /* Case Type Badges */
  .case-type-badge {
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
    border-radius: ${({ theme }) => theme.borderRadius.xl};
    font-size: ${({ theme }) => theme.fontSizes.xs};
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

  /* Form Elements */
  .form-group {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }

  .form-group label {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.primary.yellow};
    font-weight: 500;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.sm};
    background: ${({ theme }) => theme.colors.grays.darkGray};
    border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme }) => theme.fontSizes.base};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary.yellow};
      box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
    }
  }

  /* Toast Notifications */
  .Toastify__toast {
    background: ${({ theme }) => theme.colors.grays.darkGray};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary.yellow};
  }

  .Toastify__toast--success {
    border-color: ${({ theme }) => theme.colors.status.success};
  }

  .Toastify__toast--error {
    border-color: ${({ theme }) => theme.colors.status.danger};
  }

  .Toastify__toast--warning {
    border-color: ${({ theme }) => theme.colors.status.warning};
  }

  /* Loading Animation */
  .loading {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  .loading::after {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid ${({ theme }) => theme.colors.primary.yellow};
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Fade In Animation */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Main App Layout
const AppContainer = styled.div`
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main";
  grid-template-columns: 280px 1fr;
  grid-template-rows: 70px 1fr;
  min-height: 100vh;
`;

const MainContent = styled.main`
  grid-area: main;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.primary.black};
`;

function App({ user, signOut }) {
  const [userRole, setUserRole] = useState('Attorney'); // Default role
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Extract user role from Cognito groups
    if (user && user.signInUserSession) {
      const groups = user.signInUserSession.idToken.payload['cognito:groups'];
      if (groups && groups.length > 0) {
        setUserRole(groups[0]); // Take first group as primary role
      }
    }
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppContainer>
          {/* Top Navigation */}
          <TopNavigation 
            user={user} 
            userRole={userRole}
            signOut={signOut}
            toggleSidebar={toggleSidebar}
          />

          {/* Sidebar Navigation */}
          <Sidebar 
            isOpen={sidebarOpen}
            userRole={userRole}
          />

          {/* Main Content Area */}
          <MainContent>
            <Routes>
              {/* Dashboard - Default Route */}
              <Route path="/" element={<Dashboard userRole={userRole} />} />
              <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />

              {/* Cases Management */}
              <Route path="/cases" element={<CasesList userRole={userRole} />} />
              <Route path="/cases/:matterNumber" element={<CaseDetail userRole={userRole} />} />

              {/* File Explorer */}
              <Route path="/file-explorer" element={<FileExplorer userRole={userRole} />} />
              <Route path="/file-explorer/:matterNumber" element={<FileExplorer userRole={userRole} />} />

              {/* DocuSign */}
              <Route path="/docusign" element={<DocuSignDashboard userRole={userRole} />} />

              {/* Email Campaigns */}
              <Route path="/email-campaigns" element={<EmailCampaigns userRole={userRole} />} />

              {/* Court Releases */}
              <Route path="/court-releases" element={<CourtReleases userRole={userRole} />} />

              {/* Reports & Analytics */}
              <Route path="/reports" element={<Reports userRole={userRole} />} />

              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainContent>
        </AppContainer>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Router>
    </ThemeProvider>
  );
}

// Custom authentication UI theme
const authTheme = {
  name: 'sherlock-auth-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#FFD700',
          80: '#FFA500',
          90: '#FF8C00',
          100: '#FF7F00',
        },
      },
      background: {
        primary: '#000000',
        secondary: '#1a1a1a',
      },
      font: {
        primary: '#ffffff',
        secondary: '#cccccc',
      },
    },
  },
};

export default withAuthenticator(App, {
  theme: authTheme,
  hideSignUp: true, // Only allow admin-created accounts
  signUpAttributes: [],
  socialProviders: [],
}); 