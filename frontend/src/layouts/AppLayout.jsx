import React from 'react';
import { Layout } from 'antd';
import { useSelector } from 'react-redux';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const { sidebarCollapsed } = useSelector(state => state.ui);

  return (
    <Layout style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw' }}>
      <AppSidebar collapsed={sidebarCollapsed} />
      <Layout style={{ width: '100%' }}>
        <AppHeader />
        <Content style={{ 
          margin: '16px', 
          padding: '16px', 
          background: '#fff',
          width: '100%',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;