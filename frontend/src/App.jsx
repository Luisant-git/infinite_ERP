import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import store from './store';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import MDRoute from './routes/MDRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import UserMaster from './pages/masters/UserMaster';
import ConcernMaster from './pages/masters/ConcernMaster';
import PartyMaster from './pages/masters/PartyMaster';
import PartyApproval from './pages/masters/PartyApproval';
import PartyTypeMaster from './pages/masters/PartyTypeMaster';
import ProcessMaster from './pages/masters/ProcessMaster';
import PartyProcessRateSetting from './pages/masters/PartyProcessRateSetting';
import PartyScreenRate from './pages/masters/PartyScreenRate';
import DesignMaster from './pages/masters/DesignMaster';
import DesignApproval from './pages/masters/DesignApproval';
import StrikeOffApproval from './pages/masters/StrikeOffApproval';
import MasterData from './pages/masters/MasterData';
import GstMaster from './pages/masters/GstMaster';
import Settings from './pages/masters/Settings';
import FabricInward from './pages/transactions/FabricInward';
import FabricDc from './pages/transactions/FabricDc';
import FabricReturn from './pages/transactions/FabricReturn';
import FabricBill from './pages/transactions/FabricBill';
import DirectBill from './pages/transactions/DirectBill';
import InwardCloser from './pages/transactions/InwardCloser';
import BillEinvoice from './pages/transactions/BillEinvoice';
import EinvoiceSettings from './pages/transactions/EinvoiceSettings';
import RateQuotation from './pages/transactions/RateQuotation';
import RateQuotationApproval from './pages/transactions/RateQuotationApproval';
import BillApproval from './pages/transactions/BillApproval';
import InwardSummary from './pages/reports/InwardSummary';
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
                    <Route path={ROUTES.PARTY_APPROVAL} element={<MDRoute><PartyApproval /></MDRoute>} />
                    <Route path={ROUTES.PARTY_TYPE_MASTER} element={<PartyTypeMaster />} />
                    <Route path={ROUTES.PROCESS_MASTER} element={<ProcessMaster />} />
                    <Route path={ROUTES.PARTY_PROCESS_RATE} element={<PartyProcessRateSetting />} />
                    <Route path={ROUTES.PARTY_SCREEN_RATE} element={<PartyScreenRate />} />
                    <Route path={ROUTES.DESIGN_MASTER} element={<DesignMaster />} />
                    <Route path={ROUTES.DESIGN_APPROVAL} element={<MDRoute><DesignApproval /></MDRoute>} />
                    <Route path={ROUTES.STRIKEOFF_APPROVAL} element={<StrikeOffApproval />} />
                    <Route path={ROUTES.MASTER_DATA} element={<MasterData />} />
                    <Route path={ROUTES.GST_MASTER} element={<GstMaster />} />
                    <Route path={ROUTES.FABRIC_INWARD} element={<FabricInward />} />
                    <Route path={ROUTES.FABRIC_DC} element={<FabricDc />} />
                    <Route path={ROUTES.FABRIC_RETURN} element={<FabricReturn />} />
                    <Route path={ROUTES.INWARD_CLOSER} element={<InwardCloser />} />
                    <Route path={ROUTES.FABRIC_BILL} element={<FabricBill />} />
                    <Route path={ROUTES.DIRECT_BILL} element={<DirectBill />} />
                    <Route path={ROUTES.BILL_EINVOICE} element={<BillEinvoice />} />
                    <Route path={ROUTES.EINVOICE_SETTINGS} element={<EinvoiceSettings />} />
                    <Route path={ROUTES.RATE_QUOTATION} element={<RateQuotation />} />
                    <Route path={ROUTES.RATE_QUOTATION_APPROVAL} element={<MDRoute><RateQuotationApproval /></MDRoute>} />
                    <Route path={ROUTES.BILL_APPROVAL} element={<MDRoute><BillApproval /></MDRoute>} />
                    <Route path={ROUTES.DC_ENTRY} element={<div>DC Entry</div>} />
                    <Route path={ROUTES.DC_CLOSE} element={<div>DC Close</div>} />
                    <Route path={ROUTES.REPORTS} element={<div>Reports</div>} />
                    <Route path={ROUTES.INWARD_SUMMARY} element={<InwardSummary />} />
                    <Route path={ROUTES.SETTINGS} element={<Settings />} />
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
