import React, { useState, useEffect } from "react";
import { Card, Typography, Space, Button, message, Table, Switch } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getUnDcList } from "../../api/inwardSummary";
import ReportTable from "../../components/ReportTable";

const { Title } = Typography;

const UnDcList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [showZero, setShowZero] = useState(false); // Default hide zero balance

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getUnDcList({ tenantId: localStorage.getItem("selectedCompanyId") });
      setData(response.data || []);
    } catch (error) {
      console.error("Error loading Un-DC list:", error);
      message.error("Failed to load Un-DC list");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Inward No", dataIndex: "inwardNo", width: 100, searchable: true },
    { title: "Inward Date", dataIndex: "inwardDate", width: 110, searchable: true, render: (val) => dayjs(val).format("DD-MM-YYYY") },
    { title: "Party Name", dataIndex: "partyName", width: 150, searchable: true },
    { title: "PDC No", dataIndex: "pdcNo", width: 100, searchable: true },
    { title: "Order No", dataIndex: "orderNo", width: 100, searchable: true },
    { title: "Fabric", dataIndex: "fabric", width: 120, searchable: true },
    { title: "Dia", dataIndex: "dia", width: 80, searchable: true },
    { title: "Color", dataIndex: "color", width: 100, searchable: true },
    { 
      title: "Inward Kgs", 
      dataIndex: "inwardKgs", 
      width: 100, 
      align: "right", 
      searchable: true,
      render: (val) => Number(val).toFixed(3) 
    },
    { 
      title: "DC Kgs", 
      dataIndex: "dcKgs", 
      width: 100, 
      align: "right", 
      searchable: true,
      render: (val) => Number(val).toFixed(3) 
    },
    { 
      title: "Return Kgs", 
      dataIndex: "returnKgs", 
      width: 100, 
      align: "right", 
      searchable: true,
      render: (val) => Number(val || 0).toFixed(3) 
    },
    { 
      title: "Balance Kgs", 
      dataIndex: "balanceKgs", 
      width: 100, 
      align: "right", 
      searchable: true,
      render: (val) => Number(val).toFixed(3) 
    },
    { title: "UOM", dataIndex: "uom", width: 100, searchable: true },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4}>Un-DC List (Pending Inwards)</Title>
        <Space>
          <Space>
            <span style={{ fontWeight: 500 }}>Show Zero Balance:</span>
            <Switch checked={showZero} onChange={setShowZero} checkedChildren="ON" unCheckedChildren="OFF" />
          </Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
        </Space>
      </div>
      <ReportTable 
        data={showZero ? data : data.filter(item => Number(item.balanceKgs) > 0)} 
        columns={columns} 
        loading={loading} 
        tableId="undc" 
        summary={(filteredData) => {
          const currentTotals = (filteredData || []).reduce((acc, item) => ({
            inwardKgs: acc.inwardKgs + (Number(item.inwardKgs) || 0),
            dcKgs: acc.dcKgs + (Number(item.dcKgs) || 0),
            returnKgs: acc.returnKgs + (Number(item.returnKgs) || 0),
            balanceKgs: acc.balanceKgs + (Number(item.balanceKgs) || 0),
          }), { inwardKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 });

          return (
            <Table.Summary.Row style={{ background: "#fafafa", fontWeight: "600" }}>
              <Table.Summary.Cell index={0} colSpan={8}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">{currentTotals.inwardKgs.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">{currentTotals.dcKgs.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">{currentTotals.returnKgs.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">{currentTotals.balanceKgs.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={12} />
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
};

export default UnDcList;
