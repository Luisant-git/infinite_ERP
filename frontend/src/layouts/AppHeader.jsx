import React from 'react';
import { Layout, Button, Space, Typography, Dropdown } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';
import logo from '../assets/infinite.png';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector(state => state.ui);
  const { user, selectedCompany, selectedYear } = useSelector(state => state.auth);
  console.log('AppHeader - selectedCompany:', selectedCompany, 'selectedYear:', selectedYear);
  console.log('AppHeader - user:', user);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <Header className="app-header" style={{ 
      padding: '0 16px', 
      background: '#fff', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #f0f0f0',
      position: 'sticky',
      top: 0,
      zIndex: 998
    }}>
      <Space>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => dispatch(toggleSidebar())}
        />
        <img src={logo} alt="Infinite ERP" className="header-logo" style={{ height: '36px', marginTop: '25px' }} />
      </Space>
      
      <Space className="header-right">
        {selectedCompany && selectedYear && (
          <div className="company-info" style={{
            background: '#f5f5f5',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '8px 12px',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <UserOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
            <Text className="company-text" style={{ color: '#262626', fontSize: '13px', fontWeight: '500' }}>
              Company : {selectedCompany} | FY : {selectedYear}
            </Text>
          </div>
        )}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            <span className="username-text">{user?.username || 'User'}</span>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;