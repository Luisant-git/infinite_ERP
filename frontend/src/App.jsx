import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import store from './store';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import UserMaster from './pages/masters/UserMaster';
import ConcernMaster from './pages/masters/ConcernMaster';
import PartyMaster from './pages/masters/PartyMaster';
import PartyTypeMaster from './pages/masters/PartyTypeMaster';
import { ROUTES } from './constants/permissions';
import './App.css';
import './styles/mobile.css';

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <Router>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                    <Route path={ROUTES.USER_MASTER} element={<UserMaster />} />
                    <Route path={ROUTES.CONCERN_MASTER} element={<ConcernMaster />} />
                    <Route path={ROUTES.PARTY_MASTER} element={<PartyMaster />} />
                    <Route path={ROUTES.PARTY_TYPE_MASTER} element={<PartyTypeMaster />} />
                    <Route path={ROUTES.DC_ENTRY} element={<div>DC Entry</div>} />
                    <Route path={ROUTES.DC_CLOSE} element={<div>DC Close</div>} />
                    <Route path={ROUTES.REPORTS} element={<div>Reports</div>} />
                    <Route path={ROUTES.SETTINGS} element={<div>Settings</div>} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
