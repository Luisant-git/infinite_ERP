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
    const printWindow = window.open("", "", "height=600,width=800");

    let tablesHtml = "";
    data.concerns.forEach((concern) => {
      tablesHtml += `
        <div style="page-break-before: always; margin-bottom: 30px;">
          <h3 style="margin-bottom: 15px; color: #1890ff;">${concern.concernName}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #4472c4; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">S.No</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Inward No</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Inward Date</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Party Name</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">PDC No</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Order No</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Fabric</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Dia</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Color</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">Inward Kgs</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">Process Kgs</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">DC Kgs</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">Return Kgs</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">Balance Kgs</th>
                <th style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">UOM</th>
              </tr>
            </thead>
            <tbody>
              ${concern.data
                .map(
                  (item, index) => `
                <tr style="${index % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${index + 1}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.inwardNo}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${dayjs(item.inwardDate).format("DD-MM-YYYY")}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.partyName || ""}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.pdcNo}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.orderNo}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.fabric}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.dia}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.color}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: right;">${Number(item.inwardKgs).toFixed(3)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: right;">${Number(item.processKgs || 0).toFixed(3)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: right;">${Number(item.dcKgs).toFixed(3)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: right;">${Number(item.returnKgs).toFixed(3)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: right;">${Number(item.balanceKgs).toFixed(3)}</td>
                  <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${item.uom}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="9" style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;">Total</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">${concern.totals.inwardKgs.toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">${concern.totals.processKgs.toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">${concern.totals.dcKgs.toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">${concern.totals.returnKgs.toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px; text-align: right;">${concern.totals.balanceKgs.toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 6px 4px; font-size: 10px;"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Summary Report - All Concerns</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h2 {
              text-align: center;
              margin-bottom: 10px;
            }
            .date-range {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .grand-totals {
              margin-top: 20px;
              padding: 15px;
              background-color: #e6f7ff;
              border: 2px solid #1890ff;
              border-radius: 5px;
            }
            .grand-totals h3 {
              margin: 0 0 10px 0;
              color: #1890ff;
            }
            .totals-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
            }
            .total-item {
              text-align: center;
            }
            .total-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .total-value {
              font-size: 16px;
              font-weight: bold;
              color: #1890ff;
            }
            @media print {
              body { 
                margin: 10px;
              }
              .grand-totals {
                page-break-inside: avoid;
              }
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <h2>Inward Summary Report - All Concerns</h2>
          <div class="date-range">
            Period: ${dateRange[0].format("DD-MM-YYYY")} to ${dateRange[1].format("DD-MM-YYYY")}
          </div>
          
          ${tablesHtml}
          
          <div class="grand-totals">
            <h3>Grand Totals (All Concerns)</h3>
            <div class="totals-grid">
              <div class="total-item">
                <div class="total-label">Inward Kgs</div>
                <div class="total-value">${data.grandTotals.inwardKgs?.toFixed(3) || "0.000"}</div>
              </div>
              <div class="total-item">
                <div class="total-label">Process Kgs</div>
                <div class="total-value">${data.grandTotals.processKgs?.toFixed(3) || "0.000"}</div>
              </div>
              <div class="total-item">
                <div class="total-label">DC Kgs</div>
                <div class="total-value">${data.grandTotals.dcKgs?.toFixed(3) || "0.000"}</div>
              </div>
              <div class="total-item">
                <div class="total-label">Return Kgs</div>
                <div class="total-value">${data.grandTotals.returnKgs?.toFixed(3) || "0.000"}</div>
              </div>
              <div class="total-item">
                <div class="total-label">Balance Kgs</div>
                <div class="total-value">${data.grandTotals.balanceKgs?.toFixed(3) || "0.000"}</div>
              </div>
            </div>
          </div>

        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCollapseChange = (keys) => {
    setActiveKeys(keys);
  };

  return (
    <Card>
      <div
        className="page-header"
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
                showPagination={true}
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
