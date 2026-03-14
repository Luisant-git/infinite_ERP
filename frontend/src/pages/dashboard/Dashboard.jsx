import React, { useState, useEffect } from 'react';
import { Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getApprovalsPending } from '../../api/dashboard';
import { ROUTES } from '../../constants/permissions';
import './Dashboard.css';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { IsMD } = useSelector(state => state.auth);
  const [approvals, setApprovals] = useState({
    rateQuotationApprovals: 0,
    partyApprovals: 0,
    designApprovals: 0,
    billApprovals: 0
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

  const cardData = [
    {
      title: 'Rate Quotation Approval',
      value: approvals.rateQuotationApprovals,
      route: ROUTES.RATE_QUOTATION_APPROVAL,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Party Approval',
      value: approvals.partyApprovals,
      route: ROUTES.PARTY_APPROVAL,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Design Approval',
      value: approvals.designApprovals,
      route: ROUTES.DESIGN_APPROVAL,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Bill Approval',
      value: approvals.billApprovals,
      route: ROUTES.BILL_APPROVAL,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  return (
    <div className="dashboard-container">
      <Title level={2} className="dashboard-title">Dashboard</Title>
      
      <div className="dashboard-grid">
        {cardData.map((card, index) => (
          <div 
            key={index}
            className={`dashboard-card ${IsMD !== 1 ? 'disabled' : ''}`}
            onClick={() => handleCardClick(card.route)}
            style={{ background: card.gradient }}
          >
            <div className="card-title">{card.title}</div>
            <div className="card-body">
              <div className="card-value">
                {loading ? '...' : card.value}
              </div>
              <div className="card-label">Pending</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;