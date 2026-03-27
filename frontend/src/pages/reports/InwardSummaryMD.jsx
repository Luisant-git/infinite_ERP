import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  DatePicker,
  Button,
  Typography,
  Space,
  message,
  Collapse,
  Badge,
  Row,
  Col,
  Statistic,
  Switch,
} from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  CaretRightOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getInwardSummaryForMD } from "../../api/inwardSummary";
import InwardSummaryTable from "../../components/InwardSummaryTable";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const InwardSummaryMD = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ concerns: [], grandTotals: {} });
  const [allData, setAllData] = useState({ concerns: [], grandTotals: {} }); // Store all data
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [activeKeys, setActiveKeys] = useState([]);
  const [selectedConcernId, setSelectedConcernId] = useState(null);
  const [exceptBalanceZero, setExceptBalanceZero] = useState(true); // Default enabled
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // If navigated here with a selected concern, apply it
    if (location?.state?.concernId) {
      setSelectedConcernId(location.state.concernId);
    }
  }, [location]);

  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      loadData();
    }
  }, [dateRange, selectedConcernId]);

  const loadData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        fromDate: dateRange[0].toISOString(),
        toDate: dateRange[1].toISOString(),
        ...(selectedConcernId ? { concernId: selectedConcernId } : {}),
      };

      const response = await getInwardSummaryForMD(params);
      setAllData(response);
      
      // Filter data based on exceptBalanceZero toggle
      const filteredResponse = {
        concerns: response.concerns.map(concern => {
          const filteredData = exceptBalanceZero
            ? concern.data.filter(item => Number(item.balanceKgs) !== 0)
            : concern.data;
          
          // Recalculate totals for this concern
          const totals = filteredData.reduce(
            (acc, item) => ({
              inwardKgs: acc.inwardKgs + Number(item.inwardKgs || 0),
              processKgs: acc.processKgs + Number(item.processKgs || 0),
              dcKgs: acc.dcKgs + Number(item.dcKgs || 0),
              returnKgs: acc.returnKgs + Number(item.returnKgs || 0),
              balanceKgs: acc.balanceKgs + Number(item.balanceKgs || 0),
              distinctInwardCount: new Set(filteredData.map(d => d.inwardNo)).size,
            }),
            { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0, distinctInwardCount: 0 }
          );
          
          return {
            ...concern,
            data: filteredData,
            totals,
          };
        }),
        grandTotals: {},
      };
      
      // Recalculate grand totals
      filteredResponse.grandTotals = filteredResponse.concerns.reduce(
        (acc, concern) => ({
          inwardKgs: acc.inwardKgs + concern.totals.inwardKgs,
          processKgs: acc.processKgs + concern.totals.processKgs,
          dcKgs: acc.dcKgs + concern.totals.dcKgs,
          returnKgs: acc.returnKgs + concern.totals.returnKgs,
          balanceKgs: acc.balanceKgs + concern.totals.balanceKgs,
        }),
        { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
      );
      
      setData(filteredResponse);

      // Auto-expand relevant concern (either selected or first available)
      if (selectedConcernId) {
        setActiveKeys([selectedConcernId.toString()]);
      } else if (response.concerns && response.concerns.length > 0) {
        setActiveKeys([response.concerns[0].concernId.toString()]);
      }
    } catch (error) {
      message.error("Failed to load inward summary data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning("Please select date range");
      return;
    }
    loadData();
  };

  const handleToggleBalanceZero = (checked) => {
    setExceptBalanceZero(checked);
    
    // Filter data based on toggle
    const filteredResponse = {
      concerns: allData.concerns.map(concern => {
        const filteredData = checked
          ? concern.data.filter(item => Number(item.balanceKgs) !== 0)
          : concern.data;
        
        // Recalculate totals for this concern
        const totals = filteredData.reduce(
          (acc, item) => ({
            inwardKgs: acc.inwardKgs + Number(item.inwardKgs || 0),
            processKgs: acc.processKgs + Number(item.processKgs || 0),
            dcKgs: acc.dcKgs + Number(item.dcKgs || 0),
            returnKgs: acc.returnKgs + Number(item.returnKgs || 0),
            balanceKgs: acc.balanceKgs + Number(item.balanceKgs || 0),
            distinctInwardCount: new Set(filteredData.map(d => d.inwardNo)).size,
          }),
          { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0, distinctInwardCount: 0 }
        );
        
        return {
          ...concern,
          data: filteredData,
          totals,
        };
      }),
      grandTotals: {},
    };
    
    // Recalculate grand totals
    filteredResponse.grandTotals = filteredResponse.concerns.reduce(
      (acc, concern) => ({
        inwardKgs: acc.inwardKgs + concern.totals.inwardKgs,
        processKgs: acc.processKgs + concern.totals.processKgs,
        dcKgs: acc.dcKgs + concern.totals.dcKgs,
        returnKgs: acc.returnKgs + concern.totals.returnKgs,
        balanceKgs: acc.balanceKgs + concern.totals.balanceKgs,
      }),
      { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
    );
    
    setData(filteredResponse);
  };

  const handleExportAll = () => {
    // Create CSV content for all concerns
    const headers = [
      "Concern",
      "S.No",
      "Inward No",
      "Inward Date",
      "Party Name",
      "PDC No",
      "Order No",
      "Fabric",
      "Dia",
      "Color",
      "Inward Kgs",
      "Process Kgs",
      "DC Kgs",
      "Return Kgs",
      "Balance Kgs",
      "UOM",
    ];

    let csvData = [];

    data.concerns.forEach((concern) => {
      concern.data.forEach((item, index) => {
        csvData.push([
          concern.concernName,
          index + 1,
          item.inwardNo,
          dayjs(item.inwardDate).format("DD-MM-YYYY"),
          item.partyName || "",
          item.pdcNo,
          item.orderNo,
          item.fabric,
          item.dia,
          item.color,
          Number(item.inwardKgs).toFixed(3),
          Number(item.processKgs || 0).toFixed(3),
          Number(item.dcKgs).toFixed(3),
          Number(item.returnKgs).toFixed(3),
          Number(item.balanceKgs).toFixed(3),
          item.uom,
        ]);
      });

      // Add concern totals
      csvData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        concern.totals.inwardKgs.toFixed(3),
        concern.totals.processKgs.toFixed(3),
        concern.totals.dcKgs.toFixed(3),
        concern.totals.returnKgs.toFixed(3),
        concern.totals.balanceKgs.toFixed(3),
        "",
      ]);

      // Add empty row for separation
      csvData.push(["", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    });

    // Add grand totals
    csvData.push([
      "Grand Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      data.grandTotals.inwardKgs?.toFixed(3) || "0.000",
      data.grandTotals.processKgs?.toFixed(3) || "0.000",
      data.grandTotals.dcKgs?.toFixed(3) || "0.000",
      data.grandTotals.returnKgs?.toFixed(3) || "0.000",
      data.grandTotals.balanceKgs?.toFixed(3) || "0.000",
      "",
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `\"${cell}\"`).join(",")),
    ].join("\\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Inward_Summary_All_Concerns_${dayjs().format("YYYY-MM-DD")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("CSV exported successfully");
  };

  const handlePrintAll = () => {
    if (!data.concerns || data.concerns.length === 0) return;

    setIsPrinting(true);
    const prevActiveKeys = activeKeys;
    setActiveKeys(data.concerns.map(c => c.concernId.toString()));

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setActiveKeys(prevActiveKeys);
    }, 500);
  };

  const handleCollapseChange = (keys) => {
    setActiveKeys(keys);
  };

  return (
    <Card className="inward-summary-card">
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
            page-break-inside: auto !important;
          }
          table { display: table !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; page-break-inside: avoid !important; }
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

          /* For InwardSummaryMD Collapse borders */
          .ant-collapse { border: none !important; background: transparent !important; }
          .ant-collapse-item { border: none !important; page-break-inside: avoid !important; }
          .ant-collapse-header { padding: 0 !important; background: transparent !important; margin-bottom: 5px !important; display: flex !important; }
          .ant-collapse-content { border: none !important; padding: 0 !important; }
          .ant-collapse-content-box { padding: 0 !important; }
          .ant-collapse-expand-icon { display: none !important; }
        }
        .print-header { display: none; }
        .inward-summary-card .ant-card-body { padding: 16px !important; }
      `}</style>

      {/* Print Header */}
      <div className="print-header">
        <div style={{ borderBottom: "1.5px solid #333", paddingBottom: "8px", margin: "0 0 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Title level={4} style={{ margin: 0 }}>Inward Summary Report - All Concerns</Title>
          <div style={{ fontSize: "11px", fontWeight: 500, textAlign: "right" }}>
            Period: {dateRange[0]?.format("DD-MM-YYYY")} to {dateRange[1]?.format("DD-MM-YYYY")}
          </div>
        </div>
      </div>

      <div
        className="page-header no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Inward Summary Report
        </Title>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD-MM-YYYY"
            style={{ width: "100%", maxWidth: 280 }}
            size="small"
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
          <Space>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Except Balance Zero:</span>
            <Switch
              checked={exceptBalanceZero}
              onChange={handleToggleBalanceZero}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportAll}
            disabled={!data.concerns || data.concerns.length === 0}
          >
            Export All
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrintAll}
            disabled={!data.concerns || data.concerns.length === 0}
          >
            Print All
          </Button>
        </Space>
      </div>

      {/* Grand Totals Summary */}
      {/* {data.grandTotals && (
        <Card 
          size="small" 
          style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
        >
          <Title level={5} style={{ margin: '0 0 12px 0', color: '#52c41a' }}>
            Grand Totals (All Concerns)
          </Title>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Inward Kgs"
                value={data.grandTotals.inwardKgs || 0}
                precision={3}
                valueStyle={{ color: '#1890ff', fontSize: '18px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="DC Kgs"
                value={data.grandTotals.dcKgs || 0}
                precision={3}
                valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Return Kgs"
                value={data.grandTotals.returnKgs || 0}
                precision={3}
                valueStyle={{ color: '#f5222d', fontSize: '18px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Balance Kgs"
                value={data.grandTotals.balanceKgs || 0}
                precision={3}
                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
              />
            </Col>
          </Row>
        </Card>
      )} */}

      {/* Concerns Accordion */}
      <Collapse
        activeKey={activeKeys}
        onChange={handleCollapseChange}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        size="small"
      >
        {data.concerns &&
          data.concerns.map((concern) => (
            <Panel
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "14px", minWidth: "120px" }}>
                    {concern.concernName}
                  </span>
                  <div
                    className="no-print"
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginRight: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        No of Lots:
                      </span>
                      <Badge
                        count={concern.totals.distinctInwardCount}
                        showZero
                        color="#ff4d4f"
                      />
                    </div>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      pending : {concern.totals.balanceKgs.toFixed(3)} Kgs
                    </span>
                  </div>
                </div>
              }
              key={concern.concernId.toString()}
              style={{ marginBottom: 8 }}
            >
              <InwardSummaryTable
                data={concern.data}
                loading={loading}
                showPagination={!isPrinting}
                scroll={isPrinting ? false : undefined}
                tableId={concern.concernId}
              />
            </Panel>
          ))}
      </Collapse>

      {loading && (
        <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
      )}

      {!loading && (!data.concerns || data.concerns.length === 0) && (
        <div style={{ textAlign: "center", padding: "50px", color: "#999" }}>
          No data found for the selected date range
        </div>
      )}
    </Card>
  );
};

export default InwardSummaryMD;
