import React, { useState, useEffect } from "react";
import { Card, Typography, Space, Button, message, Table } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getUnBillList } from "../../api/inwardSummary";
import ReportTable from "../../components/ReportTable";

const { Title } = Typography;

const UnBillList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getUnBillList({ tenantId: localStorage.getItem("selectedCompanyId") });
      setData(response.data || []);
    } catch (error) {
      console.error("Error loading Un-Bill list:", error);
      message.error("Failed to load Un-Bill list");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "DC No", dataIndex: "dcNo", width: 100, searchable: true },
    { title: "DC Date", dataIndex: "dcDate", width: 110, searchable: true, render: (val) => dayjs(val).format("DD-MM-YYYY") },
    { title: "Inward No", dataIndex: "inwardNo", width: 100, searchable: true },
    { title: "Party", dataIndex: "partyName", width: 150, searchable: true },
    { title: "Fabric", dataIndex: "fabric", width: 120, searchable: true },
    { title: "Dia", dataIndex: "dia", width: 80, searchable: true },
    { title: "Color", dataIndex: "color", width: 100, searchable: true },
    { title: "GSM", dataIndex: "gsm", width: 80, searchable: true },
    { 
      title: "DC Weight", 
      dataIndex: "dcWeight", 
      width: 100, 
      align: "right", 
      searchable: true,
      render: (val) => Number(val).toFixed(3) 
    },
    { 
      title: "Rolls", 
      dataIndex: "rolls", 
      width: 80, 
      align: "right",
      searchable: true
    },
    { title: "UOM", dataIndex: "uom", width: 80, searchable: true },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4}>Un-Bill List (Pending DCs)</Title>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
        </Space>
      </div>
      <ReportTable 
        data={data} 
        columns={columns} 
        loading={loading} 
        tableId="unbill"
        summary={(filteredData) => {
          const currentTotals = (filteredData || []).reduce((acc, item) => ({
            dcWeight: acc.dcWeight + (Number(item.dcWeight) || 0),
            rolls: acc.rolls + (Number(item.rolls) || 0),
          }), { dcWeight: 0, rolls: 0 });

          return (
            <Table.Summary.Row style={{ background: "#fafafa", fontWeight: "600" }}>
              <Table.Summary.Cell index={0} colSpan={8}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">{currentTotals.dcWeight.toFixed(3)}</Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">{currentTotals.rolls}</Table.Summary.Cell>
              <Table.Summary.Cell index={10} />
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
};

export default UnBillList;
