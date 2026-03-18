import React, { useState, useEffect } from "react";
import { Card, DatePicker, Button, Typography, Space, message } from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined,
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
      setData(response.data || []);
      setTotals(
        response.totals || {
          inwardKgs: 0,
          processKgs: 0,
          dcKgs: 0,
          returnKgs: 0,
          balanceKgs: 0,
        },
      );
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
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

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "S.No",
      "Inward No",
      "Inward Date",
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
    const printWindow = window.open("", "", "height=600,width=800");

    // Use backend totals when available
    const totalsToUse = totals || {
      inwardKgs: 0,
      processKgs: 0,
      dcKgs: 0,
      returnKgs: 0,
      balanceKgs: 0,
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Summary Report</title>
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
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            th {
              background-color: #4472c4;
              color: white;
              padding: 6px 4px;
              text-align: left;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            td {
              padding: 4px;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            tr {
              page-break-inside: avoid;
            }
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            tfoot td {
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 6px 4px;
            }
            @media print {
              body { 
                margin: 10px;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              tr {
                page-break-inside: avoid;
              }
              h2 {
                page-break-after: avoid;
              }
              .date-range {
                page-break-after: avoid;
              }
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <h2>Inward Summary Report</h2>
          <div class="date-range">
            Period: ${dateRange[0].format("DD-MM-YYYY")} to ${dateRange[1].format("DD-MM-YYYY")}
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Inward No</th>
                <th>Inward Date</th>
                <th>PDC No</th>
                <th>Order No</th>
                <th>Fabric</th>
                <th>Dia</th>
                <th>Color</th>
                <th class="text-right">Inward Kgs</th>
                <th class="text-right">Process Kgs</th>
                <th class="text-right">DC Kgs</th>
                <th class="text-right">Return Kgs</th>
                <th class="text-right">Balance Kgs</th>
                <th>UOM</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.inwardNo}</td>
                  <td>${dayjs(item.inwardDate).format("DD-MM-YYYY")}</td>
                  <td>${item.pdcNo}</td>
                  <td>${item.orderNo}</td>
                  <td>${item.fabric}</td>
                  <td>${item.dia}</td>
                  <td>${item.color}</td>
                  <td class="text-right">${Number(item.inwardKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.processKgs || 0).toFixed(3)}</td>
                  <td class="text-right">${Number(item.dcKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.returnKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.balanceKgs).toFixed(3)}</td>
                  <td>${item.uom}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8">Total</td>
                <td class="text-right">${totals.inwardKgs.toFixed(3)}</td>
                <td class="text-right">${totals.processKgs.toFixed(3)}</td>
                <td class="text-right">${totals.dcKgs.toFixed(3)}</td>
                <td class="text-right">${totals.returnKgs.toFixed(3)}</td>
                <td class="text-right">${totals.balanceKgs.toFixed(3)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
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

  return (
    <Card>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Inward Summary Report
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD-MM-YYYY"
            style={{ width: 280 }}
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
        showPagination={true}
        tableId="main"
      />
    </Card>
  );
};

export default InwardSummary;
