import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  FileTextOutlined,
  CloseOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { usePermissions } from '../hooks/usePermissions';
import { useMenuPermissions } from '../hooks/useMenuPermissions';
import { ROUTES } from '../constants/permissions';

const { Sider } = Layout;

const AppSidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canDCClose } = usePermissions();
  const { canView } = useMenuPermissions();
  const { user } = useSelector(state => state.auth);
  console.log('AppSidebar - user:', user);

  const menuItems = [
    ...(canView('dashboard') ? [{
      key: ROUTES.DASHBOARD,
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    }] : []),
    {
      key: 'masters',
      icon: <TeamOutlined />,
      label: 'Masters',
      children: [
        ...(user?.adminUser === true ? [
          ...(canView('user_master') ? [{
            key: ROUTES.USER_MASTER,
            icon: <UserOutlined />,
            label: 'Login Creation'
          }] : []),
          ...(canView('concern_master') ? [{
            key: ROUTES.CONCERN_MASTER,
            icon: <ShopOutlined />,
            label: 'Concern Master'
          }] : [])
        ] : []),
        ...(canView('party_master') ? [{
          key: ROUTES.PARTY_MASTER,
          icon: <TeamOutlined />,
          label: 'Party Master'
        }] : []),
        ...(canView('party_type_master') ? [{
          key: ROUTES.PARTY_TYPE_MASTER,
          icon: <TeamOutlined />,
          label: 'Party Type'
        }] : [])
      ].filter(item => item)
    },
    {
      key: 'transactions',
      icon: <FileTextOutlined />,
      label: 'Transactions',
      children: [
        // {
        //   key: ROUTES.DC_ENTRY,
        //   icon: <FileTextOutlined />,
        //   label: 'DC Entry'
        // },
        // ...(canDCClose() ? [{
        //   key: ROUTES.DC_CLOSE,
        //   icon: <CloseOutlined />,
        //   label: 'DC Close'
        // }] : [])
      ]
    },
    {
      key: ROUTES.REPORTS,
      icon: <BarChartOutlined />,
      label: 'Reports'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        ...(user?.adminUser === true ? [
          {
            key: ROUTES.MENU_PERMISSION,
            icon: <SettingOutlined />,
            label: 'Menu Permission'
          }
        ] : [])
      ]
    }
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      style={{ background: '#001529' }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default AppSidebar;