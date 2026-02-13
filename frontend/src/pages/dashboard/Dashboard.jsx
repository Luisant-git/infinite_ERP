import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { FileTextOutlined, UserOutlined, PictureOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getApprovalsPending } from '../../api/dashboard';
import { ROUTES } from '../../constants/permissions';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
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

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => navigate(ROUTES.RATE_QUOTATION_APPROVAL)}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Rate Quotation Approval Pending"
              value={approvals.rateQuotationApprovals}
              prefix={<FileTextOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => navigate(ROUTES.PARTY_APPROVAL)}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Party Approval Pending"
              value={approvals.partyApprovals}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => navigate(ROUTES.DESIGN_APPROVAL)}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="Design Approval Pending"
              value={approvals.designApprovals}
              prefix={<PictureOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;