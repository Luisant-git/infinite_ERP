import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { setMobileView, toggleSidebar } from '../store/slices/uiSlice';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarCollapsed, isMobile } = useSelector(state => state.ui);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      dispatch(setMobileView(mobile));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const handleSidebarClose = () => {
    if (isMobile && !sidebarCollapsed) {
      dispatch(toggleSidebar());
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
      {isMobile && !sidebarCollapsed && (
        <div 
          onClick={handleSidebarClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999
          }}
        />
      )}
      <AppSidebar collapsed={sidebarCollapsed} isMobile={isMobile} />
      <Layout style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <AppHeader />
        <Content style={{ 
          margin: '16px', 
          padding: '16px', 
          background: '#fff',
          width: '100%',
          maxWidth: '100%',
          overflow: 'auto',
          height: 'calc(100vh - 96px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;