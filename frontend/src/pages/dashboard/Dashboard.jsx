import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, message } from 'antd';
import { FileTextOutlined, UserOutlined, PictureOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getApprovalsPending } from '../../api/dashboard';
import { ROUTES } from '../../constants/permissions';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { IsMD } = useSelector(state => state.auth);
  const [approvals, setApprovals] = useState({
    rateQuotationApprovals: 0,
    partyApprovals: 0,
    designApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const data = await getApprovalsPending();
      setApprovals(data);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (route) => {
    if (IsMD !== 1) {
      message.warning('Only MD users can access approval pages');
      return;
    }
    navigate(route);
  };

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable={IsMD === 1}
            onClick={() => handleCardClick(ROUTES.RATE_QUOTATION_APPROVAL)}
            style={{ cursor: IsMD === 1 ? 'pointer' : 'not-allowed', opacity: IsMD === 1 ? 1 : 0.6 }}
          >
            <Statistic
              title="Rate Quotation Approval Pending"
              value={approvals.rateQuotationApprovals}
              prefix={<FileTextOutlined />}
              loading={loading}
              // valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable={IsMD === 1}
            onClick={() => handleCardClick(ROUTES.PARTY_APPROVAL)}
            style={{ cursor: IsMD === 1 ? 'pointer' : 'not-allowed', opacity: IsMD === 1 ? 1 : 0.6 }}
          >
            <Statistic
              title="Party Approval Pending"
              value={approvals.partyApprovals}
              prefix={<UserOutlined />}
              loading={loading}
              // valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable={IsMD === 1}
            onClick={() => handleCardClick(ROUTES.DESIGN_APPROVAL)}
            style={{ cursor: IsMD === 1 ? 'pointer' : 'not-allowed', opacity: IsMD === 1 ? 1 : 0.6 }}
          >
            <Statistic
              title="Design Approval Pending"
              value={approvals.designApprovals}
              prefix={<PictureOutlined />}
              loading={loading}
              // valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;