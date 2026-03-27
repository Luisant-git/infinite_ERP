import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Checkbox,
  message,
  Input,
  Row,
  Col,
  Space,
} from "antd";
import { getFabricInwards, toggleInwardClose } from "../../api/fabricInward";
import { getParties } from "../../api/party";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const { Title } = Typography;

const InwardCloser = () => {
  const [loading, setLoading] = useState(false);
  const [inwards, setInwards] = useState([]);
  const [parties, setParties] = useState([]);
  const [searchText, setSearchText] = useState("");
  const { selectedCompany } = useSelector((state) => state.auth);

  useEffect(() => {
    loadData();
  }, [selectedCompany, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inwardsRes, partiesRes] = await Promise.all([
        getFabricInwards(searchText, 1, 1000),
        getParties("", 1, 1000),
      ]);
      setInwards(inwardsRes.data || []);
      setParties(partiesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Failed to load inwards");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClose = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await toggleInwardClose(id, newStatus);
      message.success(`Inward ${newStatus === 1 ? "closed" : "opened"} successfully`);
      loadData();
    } catch (error) {
      console.error("Error toggling close status:", error);
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "GRN No",
      dataIndex: "grnNo",
      width: 120,
      sorter: (a, b) => a.grnNo.localeCompare(b.grnNo),
    },
    {
      title: "GRN Date",
      dataIndex: "grnDate",
      width: 120,
      render: (val) => dayjs(val).format("DD-MM-YYYY"),
      sorter: (a, b) => new Date(a.grnDate) - new Date(b.grnDate),
    },
    {
      title: "Party",
      dataIndex: "partyId",
      width: 200,
      render: (partyId) =>
        parties.find((p) => p.id === partyId)?.partyName || "N/A",
    },
    {
      title: "PDC No",
      dataIndex: "pdcNo",
      width: 100,
    },
    {
      title: "Inward Kgs",
      dataIndex: "inwardKgs",
      width: 100,
      align: "right",
      render: (val) => Number(val || 0).toFixed(3),
    },
    {
      title: "Return Kgs",
      dataIndex: "returnKgs",
      width: 100,
      align: "right",
      render: (val) => Number(val || 0).toFixed(3),
    },
    {
      title: "Process Kgs",
      dataIndex: "processKgs",
      width: 100,
      align: "right",
      render: (val) => Number(val || 0).toFixed(3),
    },
    {
      title: "Dc Kgs",
      dataIndex: "dcKgs",
      width: 100,
      align: "right",
      render: (val) => Number(val || 0).toFixed(3),
    },
    {
      title: "Balance Kgs",
      dataIndex: "balanceKgs",
      width: 100,
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 600, color: Number(val) > 0 ? "#ff4d4f" : "inherit" }}>
          {Number(val || 0).toFixed(3)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isClosed",
      width: 90,
      render: (isClosed, record) => (
        <Checkbox
          checked={isClosed === 1}
          onChange={() => handleToggleClose(record.id, isClosed)}
        >
          {isClosed === 1 ? "Closed" : "Open"}
        </Checkbox>
      ),
      filters: [
        { text: "Open", value: 0 },
        { text: "Closed", value: 1 },
      ],
      onFilter: (value, record) => record.isClosed === value,
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table .ant-input,
        .compact-table .ant-input-number,
        .compact-table .ant-select-selector {
          font-size: 11px !important;
          min-height: 24px !important;
          height: 24px !important;
        }
        .compact-table .ant-input-number-input {
          height: 22px !important;
        }
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
        }
      `}</style>
      <div
        className="page-header"
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ margin: 0, whiteSpace: "nowrap" }}>
          Inward Closer Screen
        </Title>
        <Space>
          <Input
            placeholder="Search GRN / PDC No"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
            autoComplete="off"
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={inwards}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, size: "small" }}
        size="small"
        className="compact-table"
        bordered
      />
    </Card>
  );
};

export default InwardCloser;
