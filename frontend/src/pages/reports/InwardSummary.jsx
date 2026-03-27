import React, { useState, useEffect } from "react";
import { Card, DatePicker, Button, Typography, Space, message, Switch } from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { getInwardSummary } from "../../api/inwardSummary";
import InwardSummaryTable from "../../components/InwardSummaryTable";
import InwardSummaryMD from "./InwardSummaryMD";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const InwardSummary = () => {
  const { IsMD } = useSelector((state) => state.auth);
  const location = useLocation();

  // If user is MD, show the accordion view
  if (IsMD === 1) {
    return <InwardSummaryMD />;
  }

  // Regular user view
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]); // Store all data
  const [totals, setTotals] = useState({
    inwardKgs: 0,
    processKgs: 0,
    dcKgs: 0,
    returnKgs: 0,
    balanceKgs: 0,
  });
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [exceptBalanceZero, setExceptBalanceZero] = useState(true); // Default enabled
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (location?.state?.fromDate && location?.state?.toDate) {
      setDateRange([
        dayjs(location.state.fromDate),
        dayjs(location.state.toDate),
      ]);
    }
  }, [location]);

  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      loadData();
    }
  }, [dateRange, pagination.current, pagination.pageSize]);

  const loadData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        fromDate: dateRange[0].toISOString(),
        toDate: dateRange[1].toISOString(),
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const response = await getInwardSummary(params);
      const fetchedData = response.data || [];
      setAllData(fetchedData);
      
      // Filter data based on exceptBalanceZero toggle
      const filteredData = exceptBalanceZero 
        ? fetchedData.filter(item => Number(item.balanceKgs) !== 0)
        : fetchedData;
      
      setData(filteredData);
      
      // Recalculate totals based on filtered data
      const calculatedTotals = filteredData.reduce(
        (acc, item) => ({
          inwardKgs: acc.inwardKgs + Number(item.inwardKgs || 0),
          processKgs: acc.processKgs + Number(item.processKgs || 0),
          dcKgs: acc.dcKgs + Number(item.dcKgs || 0),
          returnKgs: acc.returnKgs + Number(item.returnKgs || 0),
          balanceKgs: acc.balanceKgs + Number(item.balanceKgs || 0),
        }),
        { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
      );
      
      setTotals(calculatedTotals);
      setPagination((prev) => ({
        ...prev,
        total: filteredData.length,
      }));
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
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  };

  const handleToggleBalanceZero = (checked) => {
    setExceptBalanceZero(checked);
    
    // Filter data based on toggle
    const filteredData = checked 
      ? allData.filter(item => Number(item.balanceKgs) !== 0)
      : allData;
    
    setData(filteredData);
    
    // Recalculate totals based on filtered data
    const calculatedTotals = filteredData.reduce(
      (acc, item) => ({
        inwardKgs: acc.inwardKgs + Number(item.inwardKgs || 0),
        processKgs: acc.processKgs + Number(item.processKgs || 0),
        dcKgs: acc.dcKgs + Number(item.dcKgs || 0),
        returnKgs: acc.returnKgs + Number(item.returnKgs || 0),
        balanceKgs: acc.balanceKgs + Number(item.balanceKgs || 0),
      }),
      { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
    );
    
    setTotals(calculatedTotals);
    setPagination((prev) => ({
      ...prev,
      total: filteredData.length,
    }));
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
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

    const csvData = data.map((item, index) => [
      index + 1,
      item.inwardNo,
      dayjs(item.inwardDate).format("DD-MM-YYYY"),
      item.partyName,
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

    // Use totals from backend (if provided) so frontend doesn't re-sum and potentially double-count
    const totalsToUse = totals || {
      inwardKgs: 0,
      processKgs: 0,
      dcKgs: 0,
      returnKgs: 0,
      balanceKgs: 0,
    };

    // Add totals row
    csvData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Total",
      totalsToUse.inwardKgs.toFixed(3),
      totalsToUse.processKgs.toFixed(3),
      totalsToUse.dcKgs.toFixed(3),
      totalsToUse.returnKgs.toFixed(3),
      totalsToUse.balanceKgs.toFixed(3),
      "",
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Inward_Summary_${dayjs().format("YYYY-MM-DD")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("CSV exported successfully");
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
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
        .inward-summary-card .ant-card-body { padding: 16px !important; }
      `}</style>

      {/* Print Header */}
      <div className="print-header">
        <div style={{ borderBottom: "1.5px solid #333", paddingBottom: "8px", margin: "0 0 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Title level={4} style={{ margin: 0 }}>Inward Summary Report</Title>
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
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Export
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={data.length === 0}
          >
            Print
          </Button>
        </Space>
      </div>

      <InwardSummaryTable
        data={data}
        loading={loading}
        totals={totals}
        showPagination={!isPrinting}
        scroll={isPrinting ? false : { x: 1200 }}
        tableId="main"
      />
    </Card>
  );
};

export default InwardSummary;
