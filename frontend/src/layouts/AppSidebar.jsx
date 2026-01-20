import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { ROUTES } from '../constants/permissions';

const { Sider } = Layout;

const AppSidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canDCClose } = usePermissions();

  const menuItems = [
    {
      key: ROUTES.DASHBOARD,
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'masters',
      icon: <TeamOutlined />,
      label: 'Masters',
      children: [
        {
          key: ROUTES.USER_MASTER,
          icon: <UserOutlined />,
          label: 'Login Creation'
        },
        {
          key: ROUTES.CONCERN_MASTER,
          icon: <ShopOutlined />,
          label: 'Concern Master'
        },
        {
          key: ROUTES.PARTY_MASTER,
          icon: <TeamOutlined />,
          label: 'Party Master'
        },
        {
          key: ROUTES.PARTY_TYPE_MASTER,
          icon: <TeamOutlined />,
          label: 'Party Type Master'
        }
      ]
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
      key: ROUTES.SETTINGS,
      icon: <SettingOutlined />,
      label: 'Settings'
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