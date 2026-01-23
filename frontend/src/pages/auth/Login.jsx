import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, setCompanySelection, hideCompanySelection } from '../../store/slices/authSlice';
import { login } from '../../api/auth';
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
      console.log('Sending login request:', values);
      const response = await login(values.username, values.password);
      console.log('Login response:', response);
      
      localStorage.setItem('token', response.access_token);
      
      if (response.autoSelectTenant) {
        // Auto-select tenant for users with concern mapping
        dispatch(loginSuccess({
          user: response.user,
          autoSelectTenant: response.autoSelectTenant
        }));
        navigate(ROUTES.DASHBOARD);
      } else {
        // Show company selection for admin users
        dispatch(loginSuccess({
          user: response.user,
          tenants: response.tenants
        }));
        dispatch(setCompanySelection({ showModal: true }));
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.response?.status === 401) {
        errorMessage = error.response.data.message || 'Invalid credentials';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch(loginFailure(errorMessage));
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

  console.log('Modal visibility:', showCompanySelection);
  
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
              name="username"
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