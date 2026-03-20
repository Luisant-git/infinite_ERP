import React, { useState, useEffect } from "react";
import {
  Typography,
  message,
  Spin,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { getApprovalsPending } from "../../api/dashboard";
import { getInwardSummaryForMD } from "../../api/inwardSummary";
import { ROUTES } from "../../constants/permissions";
import "./Dashboard.css";

const { Title } = Typography;
const { Option } = Select;
const { MonthPicker } = DatePicker;

const Dashboard = () => {
  const navigate = useNavigate();
  const { IsMD } = useSelector((state) => state.auth);
  const [approvals, setApprovals] = useState({
    rateQuotationApprovals: 0,
    partyApprovals: 0,
    designApprovals: 0,
    billApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const [concerns, setConcerns] = useState([]);
  const [selectedConcernId, setSelectedConcernId] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [mdSummary, setMdSummary] = useState([]);
  const [mdLoading, setMdLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
    loadMdSummary();
  }, []);

  useEffect(() => {
    loadMdSummary();
  }, [selectedConcernId, month]);

  const loadApprovals = async () => {
    try {
      const data = await getApprovalsPending();
      setApprovals(data);
    } catch (error) {
      console.error("Error loading approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  // note: concerns list comes from the MD summary API response
  // and is stored in state for the dropdown.

  const loadMdSummary = async () => {
    setMdLoading(true);
    try {
      const fromDate = month.startOf("month").toISOString();
      const toDate = month.endOf("month").toISOString();

      const params = {
        fromDate,
        toDate,
        ...(selectedConcernId ? { concernId: selectedConcernId } : {}),
      };

      const response = await getInwardSummaryForMD(params);
      const fetchedConcerns = response.concerns || [];
      
      const filteredConcerns = fetchedConcerns.map(concern => {
        // Dashboard acts like "Except Balance Zero" is ON by default
        const filteredData = concern.data.filter(item => Number(item.balanceKgs) !== 0);
        
        const totals = filteredData.reduce(
          (acc, item) => ({
            balanceKgs: acc.balanceKgs + Number(item.balanceKgs || 0),
          }),
          { balanceKgs: 0 }
        );
        totals.distinctInwardCount = new Set(filteredData.map(d => d.inwardNo)).size;
        
        return {
          ...concern,
          totals: {
            ...concern.totals,
            balanceKgs: totals.balanceKgs,
            distinctInwardCount: totals.distinctInwardCount,
          }
        };
      });

      setMdSummary(filteredConcerns);
      setConcerns(fetchedConcerns);
    } catch (error) {
      console.error("Error loading MD inward summary:", error);
    } finally {
      setMdLoading(false);
    }
  };

  const handleCardClick = (route) => {
    if (IsMD !== 1) {
      message.warning("Only MD users can access approval pages");
      return;
    }
    navigate(route);
  };

  const handleViewSummary = (concern) => {
    if (IsMD !== 1) {
      message.warning("Only MD users can access this report");
      return;
    }

    const fromDate = month.startOf("month").toISOString();
    const toDate = month.endOf("month").toISOString();

    navigate(ROUTES.INWARD_SUMMARY, {
      state: {
        fromDate,
        toDate,
        concernId: concern.concernId,
      },
    });
  };

  const cardData = [
    {
      title: "Rate Quotation Approval",
      value: approvals.rateQuotationApprovals,
      route: ROUTES.RATE_QUOTATION_APPROVAL,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "Party Approval",
      value: approvals.partyApprovals,
      route: ROUTES.PARTY_APPROVAL,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "Design Approval",
      value: approvals.designApprovals,
      route: ROUTES.DESIGN_APPROVAL,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      title: "Bill Approval",
      value: approvals.billApprovals,
      route: ROUTES.BILL_APPROVAL,
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
  ];

  const renderSummaryRows = () => {
    if (!mdSummary || mdSummary.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="inward-summary-empty">
            No data available for the selected period.
          </td>
        </tr>
      );
    }

    return mdSummary.map((record) => (
      <tr key={record.concernId} className="inward-summary-row">
        <td className="inward-summary-cell">
          <strong>{record.concernName}</strong>
        </td>
        <td className="inward-summary-cell">
          {record.totals?.distinctInwardCount || 0}
        </td>
        <td className="inward-summary-cell text-right">
          {Number(record.totals?.balanceKgs || 0).toFixed(3)}
        </td>
        <td className="inward-summary-cell">
          <a
            className="inward-summary-action"
            onClick={() => handleViewSummary(record)}
          >
            View
          </a>
        </td>
      </tr>
    ));
  };

  return (
    <div className="dashboard-container">
      <Title level={2} className="dashboard-title">
        Dashboard
      </Title>

      <div className="dashboard-grid">
        {cardData.map((card, index) => (
          <div
            key={index}
            className={`dashboard-card ${IsMD !== 1 ? "disabled" : ""}`}
            onClick={() => handleCardClick(card.route)}
            style={{ background: card.gradient }}
          >
            <div className="card-title">{card.title}</div>
            <div className="card-body">
              <div className="card-value">{loading ? "..." : card.value}</div>
              <div className="card-label">Pending</div>
            </div>
          </div>
        ))}
      </div>

      <Row style={{ marginTop: 30 }} gutter={16}>
        <Col xs={24} lg={12}>
          <div className="inward-summary-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Inward Summary
              </Title>
              <Space size="middle" wrap style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
                <Select
                  allowClear
                  placeholder="Select Concern"
                  style={{ width: "100%", minWidth: 140, maxWidth: 180 }}
                  value={selectedConcernId}
                  onChange={(value) => setSelectedConcernId(value)}
                >
                  {concerns.map((c) => (
                    <Option key={c.concernId} value={c.concernId}>
                      {c.concernName}
                    </Option>
                  ))}
                </Select>
                <MonthPicker
                  value={month}
                  onChange={(value) => value && setMonth(value)}
                  format="MMM YYYY"
                  allowClear={false}
                  style={{ width: "100%", maxWidth: 140 }}
                />
              </Space>
            </div>

            <Spin spinning={mdLoading} tip="Loading...">
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table className="inward-summary-table" style={{ minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th>Concern</th>
                      <th>No of Lots</th>
                      <th className="text-right">Pending Kgs</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderSummaryRows()}</tbody>
                </table>
              </div>
            </Spin>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
