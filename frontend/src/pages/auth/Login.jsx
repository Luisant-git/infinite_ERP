import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, setCompanySelection, hideCompanySelection } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { ROUTES } from '../../constants/permissions';
import CompanySelectionModal from '../../components/common/CompanySelectionModal';
import logo from '../../assets/infinite.png';

const { Title } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, showCompanySelection } = useSelector(state => state.auth);

  const onFinish = async (values) => {
    dispatch(loginStart());
    try {
      // Static credentials for testing
      const validCredentials = [
        { userName: 'admin', password: 'admin123', permissions: { adminUser: true, dcClose: true, active: true, add: true, edit: true, delete: true } },
        { userName: 'user1', password: 'user123', permissions: { adminUser: false, dcClose: false, active: true, add: true, edit: false, delete: false } },
        { userName: 'manager', password: 'manager123', permissions: { adminUser: false, dcClose: true, active: true, add: true, edit: true, delete: true } }
      ];

      const user = validCredentials.find(u => u.userName === values.userName && u.password === values.password);
      
      if (!user) {
        dispatch(loginFailure('Invalid username or password'));
        return;
      }

      if (!user.permissions.active) {
        dispatch(loginFailure('User account is inactive'));
        return;
      }

      // Simulate API response
      const response = {
        token: 'mock-jwt-token-' + Date.now(),
        user: { userName: user.userName, ...user.permissions }
      };

      localStorage.setItem('token', response.token);
      dispatch(loginSuccess({
        user: response.user,
        permissions: user.permissions
      }));
      
      // Navigate only if not admin (admin will see company selection modal)
      if (!user.permissions.adminUser) {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      dispatch(loginFailure('Login failed'));
    }
  };

  const handleCompanySelection = (values) => {
    dispatch(setCompanySelection(values));
    navigate(ROUTES.DASHBOARD);
  };

  const handleCompanyCancel = () => {
    dispatch(hideCompanySelection());
    dispatch(logout());
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={logo} alt="Infinite ERP" style={{ height: '50px', marginBottom: '8px' }} />
            <Title level={4} type="secondary" style={{ margin: 0 }}>Login</Title>
          </div>

          {error && (
            <Alert title={error} type="error" showIcon closable />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="User Name"
              name="userName"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Enter username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                block
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
      
      <CompanySelectionModal
        visible={showCompanySelection}
        onSelect={handleCompanySelection}
        onCancel={handleCompanyCancel}
      />
    </div>
  );
};

export default Login;