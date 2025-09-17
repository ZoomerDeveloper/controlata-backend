import React, { useState } from 'react';
import {
  Layout as AntLayout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Drawer,
} from 'antd';
import {
  MenuOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  PictureOutlined,
  InboxOutlined,
  DollarOutlined,
  TrendingDownOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Заказы' },
  { key: '/pictures', icon: <PictureOutlined />, label: 'Картины' },
  { key: '/materials', icon: <InboxOutlined />, label: 'Материалы' },
  { key: '/incomes', icon: <DollarOutlined />, label: 'Доходы' },
  { key: '/expenses', icon: <TrendingDownOutlined />, label: 'Расходы' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Отчеты' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'Пользователь',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleLogout,
    },
  ];

  const siderContent = (
    <div>
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          Controlata
        </Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </div>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {siderContent}
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            <Typography.Text>Система отчетности</Typography.Text>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Avatar style={{ cursor: 'pointer' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </AntLayout>

      {/* Mobile drawer */}
      <Drawer
        title="Controlata"
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={240}
        bodyStyle={{ padding: 0 }}
      >
        {siderContent}
      </Drawer>
    </AntLayout>
  );
};

export default Layout;