import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiEdit3,
  FiMail,
  FiBarChart3,
  FiActivity,
  FiCalendar,
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 1600px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.fonts.legal};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const QuickActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.primary.yellow};
  color: ${({ theme }) => theme.colors.primary.black};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary.yellowSecondary};
    transform: translateY(-2px);
  }

  svg {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const MetricCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.colors.primary.yellow}, 
      ${({ theme }) => theme.colors.primary.yellowSecondary}
    );
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MetricIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: rgba(255, 215, 0, 0.1);
  color: ${({ theme }) => theme.colors.primary.yellow};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MetricTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ isPositive, theme }) => 
    isPositive ? theme.colors.status.success : theme.colors.status.danger
  };

  svg {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  svg {
    color: ${({ theme }) => theme.colors.primary.yellow};
  }
`;

const RecentActivity = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.grays.mediumGray};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ActivityIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: rgba(255, 215, 0, 0.1);
  color: ${({ theme }) => theme.colors.primary.yellow};
  font-size: ${({ theme }) => theme.fontSizes.base};
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ActivityTime = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Dashboard = ({ userRole }) => {
  const [metrics, setMetrics] = useState({
    totalCases: { value: 1247, change: 12.5, isPositive: true },
    activeCases: { value: 789, change: -2.1, isPositive: false },
    completedCases: { value: 458, change: 8.3, isPositive: true },
    portfolioValue: { value: '$2.4M', change: 15.7, isPositive: true },
    avgCaseValue: { value: '$47K', change: 4.2, isPositive: true },
    courtReleases: { value: 23, change: 35.0, isPositive: true },
    aiPredictions: { value: 87, change: 3.8, isPositive: true },
    solAlerts: { value: 12, change: -25.0, isPositive: true },
  });

  const [caseFlowData, setCaseFlowData] = useState([
    { month: 'Jan', intake: 65, closed: 45, pending: 20 },
    { month: 'Feb', intake: 78, closed: 52, pending: 26 },
    { month: 'Mar', intake: 89, closed: 67, pending: 22 },
    { month: 'Apr', intake: 95, closed: 71, pending: 24 },
    { month: 'May', intake: 102, closed: 83, pending: 19 },
    { month: 'Jun', intake: 87, closed: 79, pending: 8 },
  ]);

  const [caseTypeDistribution, setCaseTypeDistribution] = useState([
    { name: 'Zantac', value: 687, color: '#FF6B6B' },
    { name: 'NEC', value: 324, color: '#4ECDC4' },
    { name: 'Hair Relaxer', value: 156, color: '#45B7D1' },
    { name: 'Solar', value: 45, color: '#96CEB4' },
    { name: 'Tesla', value: 35, color: '#FECA57' },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'case_update',
      icon: FiFileText,
      text: 'Case ZAN20243245 moved to Settlement Phase',
      time: '5 minutes ago'
    },
    {
      id: 2,
      type: 'document',
      icon: FiEdit3,
      text: 'Medical records uploaded for NEC20241876',
      time: '12 minutes ago'
    },
    {
      id: 3,
      type: 'email',
      icon: FiMail,
      text: 'Email campaign sent to 234 Zantac clients',
      time: '1 hour ago'
    },
    {
      id: 4,
      type: 'court',
      icon: FiCheckCircle,
      text: 'Court release approved for HR20242156',
      time: '2 hours ago'
    },
  ]);

  const [alertsNotifications, setAlertsNotifications] = useState([
    {
      id: 1,
      type: 'sol_warning',
      icon: FiClock,
      text: '12 cases approaching SOL deadline',
      priority: 'high',
      time: 'Today'
    },
    {
      id: 2,
      type: 'court_deadline',
      icon: FiCalendar,
      text: '3 court releases due this week',
      priority: 'medium',
      time: 'This week'
    },
    {
      id: 3,
      type: 'document_review',
      icon: FiEye,
      text: '27 medical records need review',
      priority: 'low',
      time: 'This month'
    },
  ]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardContainer className="fade-in">
      {/* Dashboard Header */}
      <DashboardHeader>
        <HeaderContent>
          <WelcomeTitle>
            {getGreeting()}, {userRole}
          </WelcomeTitle>
          <Subtitle>
            Panel de Control Sherlock AI - Tu asistente legal inteligente
          </Subtitle>
          
          <QuickActions>
            <QuickActionButton
              as={Link}
              to="/cases/new"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiFileText />
              Nuevo Caso
            </QuickActionButton>
            
            <QuickActionButton
              as={Link}
              to="/file-explorer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEye />
              Explorar Archivos
            </QuickActionButton>
            
            <QuickActionButton
              as={Link}
              to="/docusign"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit3 />
              DocuSign
            </QuickActionButton>

            <QuickActionButton
              as={Link}
              to="/email-campaigns"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiMail />
              Campaña Email
            </QuickActionButton>
          </QuickActions>
        </HeaderContent>
      </DashboardHeader>

      {/* Key Metrics */}
      <MetricsGrid>
        <MetricCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <MetricIcon>
            <FiUsers />
          </MetricIcon>
          <MetricTitle>Total de Casos</MetricTitle>
          <MetricValue>{metrics.totalCases.value.toLocaleString()}</MetricValue>
          <MetricChange isPositive={metrics.totalCases.isPositive}>
            {metrics.totalCases.isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(metrics.totalCases.change)}% este mes
          </MetricChange>
        </MetricCard>

        <MetricCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <MetricIcon>
            <FiActivity />
          </MetricIcon>
          <MetricTitle>Casos Activos</MetricTitle>
          <MetricValue>{metrics.activeCases.value.toLocaleString()}</MetricValue>
          <MetricChange isPositive={metrics.activeCases.isPositive}>
            {metrics.activeCases.isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(metrics.activeCases.change)}% este mes
          </MetricChange>
        </MetricCard>

        <MetricCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <MetricIcon>
            <FiDollarSign />
          </MetricIcon>
          <MetricTitle>Valor del Portfolio</MetricTitle>
          <MetricValue>{metrics.portfolioValue.value}</MetricValue>
          <MetricChange isPositive={metrics.portfolioValue.isPositive}>
            {metrics.portfolioValue.isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {Math.abs(metrics.portfolioValue.change)}% este mes
          </MetricChange>
        </MetricCard>

        <MetricCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <MetricIcon>
            <FiAlertTriangle />
          </MetricIcon>
          <MetricTitle>Alertas SOL</MetricTitle>
          <MetricValue>{metrics.solAlerts.value}</MetricValue>
          <MetricChange isPositive={metrics.solAlerts.isPositive}>
            <FiClock />
            Requieren atención inmediata
          </MetricChange>
        </MetricCard>
      </MetricsGrid>

      {/* Charts Section */}
      <ChartsGrid>
        <ChartCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <ChartTitle>
            <FiBarChart3 />
            Flujo de Casos - Últimos 6 Meses
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={caseFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis 
                dataKey="month" 
                stroke="#888888"
                fontSize={12}
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #FFD700',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="intake" 
                stackId="1"
                stroke="#FFD700" 
                fill="rgba(255, 215, 0, 0.3)" 
                name="Ingreso"
              />
              <Area 
                type="monotone" 
                dataKey="closed" 
                stackId="1"
                stroke="#28a745" 
                fill="rgba(40, 167, 69, 0.3)" 
                name="Cerrados"
              />
              <Area 
                type="monotone" 
                dataKey="pending" 
                stackId="1"
                stroke="#FFA500" 
                fill="rgba(255, 165, 0, 0.3)" 
                name="Pendientes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <ChartTitle>
            <FiActivity />
            Distribución por Tipo
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={caseTypeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {caseTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #FFD700',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>

      {/* Recent Activity & Notifications */}
      <RecentActivity>
        <ActivityCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
        >
          <ChartTitle>
            <FiActivity />
            Actividad Reciente
          </ChartTitle>
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityIcon>
                <activity.icon />
              </ActivityIcon>
              <ActivityContent>
                <ActivityText>{activity.text}</ActivityText>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityCard>

        <ActivityCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
        >
          <ChartTitle>
            <FiAlertTriangle />
            Alertas y Notificaciones
          </ChartTitle>
          {alertsNotifications.map((alert) => (
            <ActivityItem key={alert.id}>
              <ActivityIcon>
                <alert.icon />
              </ActivityIcon>
              <ActivityContent>
                <ActivityText>{alert.text}</ActivityText>
                <ActivityTime>{alert.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityCard>
      </RecentActivity>
    </DashboardContainer>
  );
};

export default Dashboard; 