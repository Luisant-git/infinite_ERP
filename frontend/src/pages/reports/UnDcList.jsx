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
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const selectedCompanyName = localStorage.getItem("selectedCompanyName") || "Infinite ERP";

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
    <Card className="undc-list-card">
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4 landscape; }
          .no-print { display: none !important; }
          .ant-layout-sider, .ant-layout-header, .ant-layout-footer { display: none !important; }
          body, #root, .ant-layout, .ant-layout-content, .ant-card, .ant-card-body {
            margin: 0 !important;
            padding: 0 !important;
            float: none !important;
            overflow: visible !important;
            display: block !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
          }
          .ant-card { border: none !important; box-shadow: none !important; }
          .ant-table-wrapper, .ant-table, .ant-table-container, .ant-table-content, table { 
            display: block !important; 
            overflow: visible !important;
            clear: both !important;
          }
          table { display: table !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
          thead { display: table-header-group !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td,
          .ant-table-summary td {
             font-size: 8pt !important;
             padding: 2pt 4pt !important;
             border: 0.5pt solid #888 !important;
             word-break: break-word !important;
          }
          .ant-table-thead > tr > th { 
            background-color: var(--primary-color) !important; 
            color: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ant-table-summary td { background-color: #fafafa !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-header { display: block !important; margin-bottom: 20px !important; }
          .ant-pagination { display: none !important; }
        }
        .print-header { display: none; }
        .undc-list-card .ant-card-body { padding: 16px !important; }
      `}</style>

      {/* Print Header */}
      <div className="print-header">
        <div style={{ borderBottom: "1.5px solid #333", paddingBottom: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Title level={4} style={{ margin: 0 }}>Un-DC List (Pending Inwards)</Title>
          <div style={{ fontSize: "11px", fontWeight: 500 }}>
            Date: {dayjs().format("DD-MM-YYYY HH:mm")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }} className="no-print">
        <Title level={4} style={{ margin: 0 }}>Un-DC List (Pending Inwards)</Title>
        <Space size="middle">
          <Space>
            <span style={{ fontWeight: 500 }}>Show Zero Balance:</span>
            <Switch checked={showZero} onChange={setShowZero} checkedChildren="ON" unCheckedChildren="OFF" />
          </Space>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
        </Space>
      </div>
      <ReportTable 
        data={showZero ? data : data.filter(item => Number(item.balanceKgs) > 0)} 
        columns={columns} 
        loading={loading} 
        tableId="undc" 
        showPagination={!isPrinting}
        scroll={isPrinting ? false : { x: 1200 }}
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
