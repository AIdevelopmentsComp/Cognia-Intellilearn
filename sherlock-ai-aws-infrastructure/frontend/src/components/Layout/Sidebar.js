import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiHome,
  FiFolder,
  FiFolderOpen,
  FiFileText,
  FiMail,
  FiEdit3,
  FiBarChart3,
  FiUsers,
  FiShield,
  FiSettings,
  FiSearch,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const SidebarContainer = styled(motion.nav)`
  grid-area: sidebar;
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border-right: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  overflow-y: auto;
  position: relative;
  z-index: 100;
`;

const SidebarHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Logo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 800;
  background: linear-gradient(45deg, 
    ${({ theme }) => theme.colors.primary.yellow}, 
    ${({ theme }) => theme.colors.primary.yellowSecondary}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.fonts.legal};
`;

const Tagline = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const UserRole = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.primary.yellow};
  color: ${({ theme }) => theme.colors.primary.black};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
`;

const MenuSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const MenuTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary.yellow};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-left: ${({ theme }) => theme.spacing.sm};
`;

const MenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all 0.2s ease;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: ${({ theme }) => theme.colors.primary.yellow};
    transform: scaleY(0);
    transition: transform 0.2s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.grays.mediumGray};
    transform: translateX(4px);
  }

  &.active {
    color: ${({ theme }) => theme.colors.primary.yellow};
    background: rgba(255, 215, 0, 0.1);

    &::before {
      transform: scaleY(1);
    }
  }

  svg {
    margin-right: ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const MenuBadge = styled.span`
  background: ${({ theme }) => theme.colors.status.danger};
  color: white;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin-left: auto;
  min-width: 20px;
  text-align: center;
  font-weight: 600;
`;

const SidebarFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  margin-top: auto;
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.grays.mediumGray};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.yellow};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Sidebar = ({ isOpen, userRole }) => {
  const location = useLocation();

  // Define menu items based on user role
  const getMenuItems = (role) => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: FiHome },
      { path: '/cases', label: 'Cases', icon: FiFolder, badge: '1,247' },
      { path: '/file-explorer', label: 'File Explorer', icon: FiFolderOpen },
    ];

    const attorneyItems = [
      { path: '/court-releases', label: 'Court Releases', icon: FiFileText, badge: '23' },
      { path: '/docusign', label: 'DocuSign', icon: FiEdit3 },
      { path: '/email-campaigns', label: 'Email Campaigns', icon: FiMail },
      { path: '/reports', label: 'Reports & Analytics', icon: FiBarChart3 },
    ];

    const adminItems = [
      { path: '/users', label: 'User Management', icon: FiUsers },
      { path: '/security', label: 'Security', icon: FiShield },
      { path: '/settings', label: 'Settings', icon: FiSettings },
    ];

    switch (role?.toLowerCase()) {
      case 'admin':
        return [...baseItems, ...attorneyItems, ...adminItems];
      case 'attorney':
      case 'abogado':
        return [...baseItems, ...attorneyItems];
      case 'paralegal':
        return baseItems;
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems(userRole);

  // Group menu items
  const coreItems = menuItems.slice(0, 3);
  const legalItems = menuItems.slice(3, 7);
  const adminItems = menuItems.slice(7);

  return (
    <SidebarContainer
      initial={{ x: isOpen ? 0 : -280 }}
      animate={{ x: isOpen ? 0 : -280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <Logo>SHERLOCK</Logo>
        <Tagline>AI Legal Intelligence</Tagline>
        <UserRole>{userRole}</UserRole>
      </SidebarHeader>

      {/* Core Navigation */}
      <MenuSection>
        <MenuTitle>Core</MenuTitle>
        {coreItems.map((item) => (
          <MenuItem 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <item.icon />
            {item.label}
            {item.badge && <MenuBadge>{item.badge}</MenuBadge>}
          </MenuItem>
        ))}
      </MenuSection>

      {/* Legal Tools */}
      {legalItems.length > 0 && (
        <MenuSection>
          <MenuTitle>Legal Tools</MenuTitle>
          {legalItems.map((item) => (
            <MenuItem 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon />
              {item.label}
              {item.badge && <MenuBadge>{item.badge}</MenuBadge>}
            </MenuItem>
          ))}
        </MenuSection>
      )}

      {/* Administration */}
      {adminItems.length > 0 && (
        <MenuSection>
          <MenuTitle>Administration</MenuTitle>
          {adminItems.map((item) => (
            <MenuItem 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <item.icon />
              {item.label}
              {item.badge && <MenuBadge>{item.badge}</MenuBadge>}
            </MenuItem>
          ))}
        </MenuSection>
      )}

      {/* Quick Stats */}
      <SidebarFooter>
        <QuickStats>
          <StatCard>
            <StatValue>247</StatValue>
            <StatLabel>Active</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>89</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>23</StatValue>
            <StatLabel>Court</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>$2.4M</StatValue>
            <StatLabel>Portfolio</StatLabel>
          </StatCard>
        </QuickStats>
        
        {/* Quick Actions */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ marginBottom: '1rem' }}
        >
          <MenuItem to="/cases/new">
            <FiSearch />
            Quick Search
          </MenuItem>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MenuItem to="/cases/create">
            <FiClock />
            SOL Monitor
            <MenuBadge>12</MenuBadge>
          </MenuItem>
        </motion.div>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar; 