import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Typography,
  message,
  Row,
  Col,
  Space,
} from "antd";
import { SearchOutlined, PrinterOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getParties } from "../../api/party";
import { getPartyAgeing } from "../../api/partyLedger";
import { getConcerns } from "../../api/concern";
import PartyLedger from "./PartyLedger";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
const { Title } = Typography;
const { Option } = Select;

const PartyBalance = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportType, setReportType] = useState("Party with Ageing");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [companyDetails, setCompanyDetails] = useState(null);
  const printRef = React.useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Customer Balance Report'
  });

  useEffect(() => {
    loadParties();
    fetchCompanyDetails();
    // Set default dates
    form.setFieldsValue({
      fromDate: dayjs().startOf("month"),
      toDate: dayjs(),
      partyType: "Customer Only",
      reportType: "Party with Ageing",
    });
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const concernId = localStorage.getItem('selectedCompanyId');
      const resp = await getConcerns('', 1, 1000);
      const allConcerns = resp.data || resp || [];
      const concern = concernId 
        ? allConcerns.find(c => c.id === parseInt(concernId)) 
        : allConcerns[0];
      if (concern) setCompanyDetails(concern);
    } catch (err) {
      console.error('Error fetching concern details:', err);
    }
  };

  const loadParties = async () => {
    try {
      const response = await getParties("", 1, 1000);
      const allParties = response.data || [];
      const customers = allParties.filter(p => 
        p.partyTypes && p.partyTypes.some(pt => pt.partyType?.partyTypeName?.toLowerCase().trim() === 'customer')
      );
      setParties(customers);
    } catch (error) {
      console.error("Error loading parties:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let partyIds = values.partyId ? values.partyId.join(",") : "";
      if (!partyIds && parties && parties.length > 0) {
        partyIds = parties.map(p => p.id).join(",");
      }
      
      const toDate = values.toDate ? values.toDate.toISOString() : new Date().toISOString();
      const partyType = values.partyType || "Customer Only";
      setReportType(values.reportType);
      setSearchTrigger(prev => prev + 1);

      if (values.reportType === "Party Summary") {
        setLoading(false);
        return; // Handled by embedded PartyLedger component
      }

      const response = await getPartyAgeing(partyIds, toDate, partyType);
      
      if (response && response.ageingData) {
        let filtered = response.ageingData;
        if (values.reportType === "Bill Wise Ageing") {
          filtered = filtered.filter(party => party.unpaidBills && party.unpaidBills.length > 0);
        } else {
          filtered = filtered.filter(party => Math.abs(party.netAmount) > 0.001 || party.advance > 0.001);
        }
        setReportData(filtered);
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Error fetching ageing report:", error);
      message.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    let headers = [];
    let excelData = [];
    
    if (reportType === "Party with Ageing") {
      headers = [
        "S.No",
        "Customer",
        "Mobile No",
        "Advance",
        "0-30 days",
        "31-60 days",
        "61-90 days",
        "91-120 days",
        ">120 days",
        "Net Amount"
      ];
      
      const filteredData = reportData;
      excelData = filteredData.map((row, index) => [
        index + 1,
        row.partyName || '',
        row.mobileNo || '',
        Number(row.advance || 0),
        Number(row.thirty || 0),
        Number(row.sixty || 0),
        Number(row.ninety || 0),
        Number(row.oneTwenty || 0),
        Number(row.aboveOneTwenty || 0),
        Number(row.netAmount || 0)
      ]);
    } else {
      // Bill Wise Ageing
      headers = [
        "S.No",
        "Customer",
        "Bill No",
        "Bill Date",
        "Bill Amount",
        "Age (Days)"
      ];
      
      const filteredData = reportData;
      let sNo = 1;
      filteredData.forEach((party) => {
        if (party.unpaidBills && party.unpaidBills.length > 0) {
          party.unpaidBills.forEach((bill) => {
            excelData.push([
              sNo++,
              party.partyName || '',
              bill.refNo || '',
              dayjs(bill.date).format("DD-MM-YYYY"),
              Number(bill.amount || 0),
              bill.ageDays || 0
            ]);
          });
        } else {
          excelData.push([
            sNo++,
            party.partyName || '',
            '-',
            '-',
            0,
            0
          ]);
        }
      });
    }

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Balance");
    XLSX.writeFile(workbook, `Customer_Balance_${dayjs().format('DD_MM_YYYY')}.xlsx`);
  };

  const getImageDataUrl = async (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      let currentY = 12;

      if (companyDetails) {
        if (companyDetails.logo) {
            try {
                const logoBase64 = await getImageDataUrl(companyDetails.logo);
                if (logoBase64) doc.addImage(logoBase64, 'PNG', 18, 8, 14, 14, '', 'FAST');
            } catch (e) {}
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(companyDetails.partyName?.toUpperCase() || '', pageWidth / 2, currentY, { align: 'center' });
        currentY += 4.5;
        
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        
        const bizAddress = [companyDetails.address1, companyDetails.address2, companyDetails.address3, companyDetails.address4].filter(Boolean).join(', ');
        if (bizAddress) {
            const wrappedAddr = doc.splitTextToSize(bizAddress, pageWidth - 30);
            wrappedAddr.forEach(line => {
                doc.text(line, pageWidth / 2, currentY, { align: 'center' });
                currentY += 3.5;
            });
        }
        
        const bizLoc = [companyDetails.district, companyDetails.state, companyDetails.pincode].filter(Boolean).join(', ');
        if (bizLoc) {
            doc.text(bizLoc, pageWidth / 2, currentY, { align: 'center' });
            currentY += 3.5;
        }
        
        const bizContacts = `Phone No.: ${[companyDetails.phoneNo, companyDetails.mobileNo].filter(Boolean).join(', ')}${companyDetails.email ? `, E-Mail: ${companyDetails.email}` : ''}`;
        doc.text(bizContacts, pageWidth / 2, currentY, { align: 'center' });
        currentY += 3.5;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`GST No.: ${companyDetails.gstNo || ''}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 2;
        
        doc.setLineWidth(0.2);
        doc.line(5, currentY, pageWidth - 5, currentY); // Line after concern
        currentY += 5;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`CUSTOMER BALANCE - ${reportType.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;

      doc.setFontSize(10);
      doc.setTextColor(200, 0, 100); 
      doc.text(`From ${dayjs(form.getFieldValue("fromDate")).format('DD-MM-YYYY')} To ${dayjs(form.getFieldValue("toDate")).format('DD-MM-YYYY')}`, pageWidth / 2, currentY, { align: 'center' });
      doc.setTextColor(0);
      currentY += 4;

      let head = [];
      let body = [];

      if (reportType === "Party with Ageing") {
        head = [["S.No", "Customer", "Mobile No", "Advance", "0-30", "31-60", "61-90", ">90", "Net Amount"]];
        
        const filteredData = reportData;
        
        body = filteredData.map((row, index) => {
          return [
            index + 1,
            row.partyName || '',
            row.mobileNo || '',
            Number(row.advance || 0).toFixed(2),
            Number(row.below30 || 0).toFixed(2),
            Number(row.b30to60 || 0).toFixed(2),
            Number(row.b61to90 || 0).toFixed(2),
            Number(row.above90 || 0).toFixed(2),
            Number(row.netAmount || 0).toFixed(2)
          ];
        });

      } else {
        head = [["S.No", "Customer", "Bill No", "Bill Date", "Bill Amount", "Age (Days)"]];
        const filteredData = reportData;
        let sNo = 1;
        let totAmt = 0;
        filteredData.forEach((party) => {
          if (party.unpaidBills && party.unpaidBills.length > 0) {
            party.unpaidBills.forEach((bill) => {
              totAmt += Number(bill.amount || 0);
              body.push([
                sNo++,
                party.partyName || '',
                bill.refNo || '',
                dayjs(bill.date).format("DD-MM-YYYY"),
                Number(bill.amount || 0).toFixed(2),
                bill.ageDays || 0
              ]);
            });
          } else {
            body.push([
              sNo++,
              party.partyName || '',
              '-',
              '-',
              '0.00',
              0
            ]);
          }
        });

        body.push([
          '',
          `Total Bills: ${sNo - 1}`,
          '',
          '',
          totAmt.toFixed(2),
          ''
        ]);
      }

      autoTable(doc, {
        startY: currentY,
        margin: { left: 5, right: 5, bottom: 5 },
        head: head,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, font: 'helvetica', lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.2 },
        didParseCell: function(data) {
          if (data.section === 'body') {
            const isTotalRow = data.row.index === body.length - 1;
            if (isTotalRow) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
            if (reportType === "Party with Ageing") {
              if (data.column.index >= 3) data.cell.styles.halign = 'right';
            } else {
              if (data.column.index === 4) data.cell.styles.halign = 'right';
              if (data.column.index === 5 && !isTotalRow) {
                const age = Number(data.cell.raw);
                if (age > 60) data.cell.styles.textColor = [245, 34, 45]; // red
                else if (age > 30) data.cell.styles.textColor = [250, 173, 20]; // orange
              }
            }
          }
        },
        didDrawPage: (data) => {
          doc.setDrawColor(0);
          doc.setLineWidth(0.3);
          doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
        }
      });

      doc.save(`Customer_Balance_${dayjs().format('DD_MM_YYYY')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      message.error("Failed to generate PDF");
    }
  };

  const partyColumns = [
    {
      title: "S.No",
      key: "sno",
      width: 60,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Customer",
      dataIndex: "partyName",
      key: "partyName",
    },
    {
      title: "Mobile No",
      dataIndex: "mobileNo",
      key: "mobileNo",
      width: 120,
      render: (val) => val || "-",
    },
    {
      title: "Advance",
      dataIndex: "advance",
      key: "advance",
      align: "right",
      width: 100,
      render: (val) => Number(val || 0).toFixed(2),
    },
    {
      title: "Below 30 Days",
      dataIndex: "below30",
      key: "below30",
      align: "right",
      width: 120,
      render: (val) => Number(val || 0).toFixed(2),
    },
    {
      title: "30 to 60 Days",
      dataIndex: "b30to60",
      key: "b30to60",
      align: "right",
      width: 120,
      render: (val) => (
        <span style={{ color: Number(val) > 0 ? "#faad14" : "inherit" }}>
          {Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "61 to 90 Days",
      dataIndex: "b61to90",
      key: "b61to90",
      align: "right",
      width: 120,
      render: (val) => (
        <span style={{ color: Number(val) > 0 ? "#fa8c16" : "inherit" }}>
          {Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Above 90 Days",
      dataIndex: "above90",
      key: "above90",
      align: "right",
      width: 120,
      render: (val) => (
        <span style={{ color: Number(val) > 0 ? "#f5222d" : "inherit" }}>
          {Number(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Amount",
      dataIndex: "netAmount",
      key: "netAmount",
      align: "right",
      width: 120,
      render: (val) => (
        <strong style={{ color: Number(val) > 0 ? "#cf1322" : "inherit" }}>
          {Number(val || 0).toFixed(2)} Dr
        </strong>
      ),
    },
  ];

  // Bill Wise Columns structure using nested table
  const expandedRowRender = (record) => {
    const columns = [
      {
        title: "S.No",
        key: "sno",
        width: 60,
        render: (text, rec, index) => index + 1,
      },
      {
        title: "Bill No",
        dataIndex: "refNo",
        key: "refNo",
      },
      {
        title: "Bill Date",
        dataIndex: "date",
        key: "date",
        render: (date) => dayjs(date).format("DD-MM-YYYY"),
      },
      {
        title: "Bill Amount",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        render: (val) => Number(val || 0).toFixed(2),
      },
      {
        title: "Age (Days)",
        dataIndex: "ageDays",
        key: "ageDays",
        align: "right",
        render: (val) => (
          <span style={{ color: val > 60 ? "#f5222d" : val > 30 ? "#faad14" : "inherit" }}>
            {val} days
          </span>
        ),
      },
    ];

    return (
      <Table
        className="compact-table inner-compact-table"
        columns={columns}
        dataSource={record.unpaidBills || []}
        pagination={false}
        rowKey="id"
        size="small"
        summary={(pageData) => {
          let totalAmt = 0;
          pageData.forEach(({ amount }) => {
            totalAmt += amount;
          });
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3} align="right">
                <strong style={{ color: "#8c8c8c", fontSize: '14px' }}>{record.partyName} Total Outstanding:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ fontSize: '15px', color: '#cf1322' }}>₹ {totalAmt.toFixed(2)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          );
        }}
      />
    );
  };

  const billWiseColumns = [
    {
      title: "Customer",
      dataIndex: "partyName",
      key: "partyName",
      render: (text, record) => (
        <strong style={{ fontSize: '15px' }}>
          <span style={{ marginRight: 8, fontSize: '16px' }}>👤</span>
          <span style={{ color: '#1e3f73' }}>{text}</span> <span style={{ color: '#8c8c8c', fontSize: '13px' }}>({record.unpaidBills?.length || 0} bills)</span>
        </strong>
      ),
    },
  ];

  return (
    <Card
      className="party-balance-card"
    >
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          background-color: var(--primary-color) !important;
          color: white !important;
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          border: 1px solid #1e3f73 !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 8px 8px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          border: 1px solid #f0f0f0 !important;
        }
        .inner-compact-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
        }
        .inner-compact-table .ant-table-tbody > tr > td {
          padding: 4px 6px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }} className="no-print">
        <Title level={5} style={{ margin: 0 }}>Customer Balance</Title>
      </div>
      <Form form={form} layout="vertical" className="filter-form" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4} lg={3}>
            <Form.Item name="fromDate" label="FROM DATE">
              <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={4} lg={3}>
            <Form.Item name="toDate" label="TO DATE">
              <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="partyId" label="PARTY NAME">
              <Select
                mode="multiple"
                placeholder="All Customer parties selected"
                allowClear
                showSearch
                maxTagCount="responsive"
                optionFilterProp="children"
              >
                {parties.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.partyName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={4} lg={4}>
            <Form.Item name="reportType" label="REPORT TYPE">
              <Select>
                <Option value="Party with Ageing">Party with Ageing</Option>
                <Option value="Bill Wise Ageing">Bill Wise Ageing</Option>
                <Option value="Party Summary">Party Summary</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={3} lg={3}>
            <Form.Item label=" ">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                block
              >
                Search
              </Button>
            </Form.Item>
          </Col>
          {reportType !== "Party Summary" && (
            <Col xs={24} sm={24} md={4} lg={5}>
              <Form.Item label=" ">
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <Button 
                    style={{ flex: 1, borderColor: '#52c41a' }} 
                    icon={<FileExcelOutlined style={{ color: '#52c41a' }} />} 
                    onClick={handleExportExcel}
                    title="Export to Excel"
                  />
                  <Button 
                    style={{ flex: 1, borderColor: '#f5222d' }} 
                    icon={<FilePdfOutlined style={{ color: '#f5222d' }} />} 
                    onClick={handleExportPDF}
                    title="Export to PDF"
                  />
                  <Button 
                    style={{ flex: 1, borderColor: '#722ed1' }} 
                    icon={<PrinterOutlined style={{ color: '#722ed1' }} />} 
                    onClick={() => handlePrint()}
                    title="Print"
                  />
                </div>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>

      {reportType === "Party Summary" ? (
        <div style={{ marginTop: 20 }}>
          <PartyLedger 
            isEmbedded={true} 
            embeddedParties={form.getFieldValue("partyId")}
            embeddedDateRange={[form.getFieldValue("fromDate"), form.getFieldValue("toDate")]}
            triggerSearch={searchTrigger}
          />
        </div>
      ) : (
        <>
          {/* Print View (Hidden on web) */}
          <div style={{ display: 'none' }}>
            <div ref={printRef} className="print-wrapper">
              <style>{`
                @media print {
                    .print-wrapper { border: 1px solid #000; background-color: white; display: flex; flex-direction: column; margin: 5mm; }
                    @page { margin: 0mm; size: A4; }
                    body { margin: 0; }
                    
                    .section-border { border-bottom: 1px solid #000; padding: 8px 10px; text-align: center; }
                    .concern-section { position: relative; min-height: 80px; }
                    .logo-container { position: absolute; left: 50px; top: 50%; transform: translateY(-50%); }
                    .logo-container img { width: 70px; height: 70px; object-fit: contain; }
                    .biz-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; text-transform: uppercase; }
                    .biz-details { font-size: 9px; line-height: 1.4; color: #000; }
                    .date-range { color: #C80064; font-weight: bold; font-size: 11px; padding: 4px; }
                    .report-title { font-size: 14px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
                    
                    .ledger-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 5px; }
                    .ledger-table th, .ledger-table td { border: 1px solid #000; padding: 4px 8px; font-size: 10px; line-height: 1.2; }
                    .ledger-table th { font-weight: bold; text-align: center; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-bold { font-weight: bold; }
                }
              `}</style>
              
              <div className="section-border concern-section">
                  {companyDetails?.logo && (
                      <div className="logo-container">
                          <img src={companyDetails.logo} alt="logo" />
                      </div>
                  )}
                  <div className="biz-name">{companyDetails?.partyName}</div>
                  <div className="biz-details">
                      {[companyDetails?.address1, companyDetails?.address2, companyDetails?.address3, companyDetails?.address4].filter(Boolean).join(', ')}
                  </div>
                  <div className="biz-details">
                      {[companyDetails?.district, companyDetails?.state, companyDetails?.pincode].filter(Boolean).join(', ')}
                  </div>
                  <div className="biz-details">
                      Phone No.: {[companyDetails?.phoneNo, companyDetails?.mobileNo].filter(Boolean).join(', ')} 
                      {companyDetails?.email ? `, E-Mail: ${companyDetails.email}` : ''}
                  </div>
                  <div className="biz-details">
                      <b>GST No.: {companyDetails?.gstNo}</b>
                  </div>
              </div>
              <div className="section-border text-center">
                  <div className="report-title">CUSTOMER BALANCE - {reportType}</div>
                  <div className="date-range">
                      From {dayjs(form.getFieldValue("fromDate")).format('DD-MM-YYYY')} To {dayjs(form.getFieldValue("toDate")).format('DD-MM-YYYY')}
                  </div>
              </div>
              
              <div style={{ padding: '5px' }}>
                <table className="ledger-table">
                  <thead>
                    {reportType === "Party with Ageing" ? (
                      <tr>
                        <th>S.No</th>
                        <th>Customer</th>
                        <th>Mobile No</th>
                        <th>Advance</th>
                        <th>0-30</th>
                        <th>31-60</th>
                        <th>61-90</th>
                        <th>&gt;90</th>
                        <th>Net Amount</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>S.No</th>
                        <th>Customer</th>
                        <th>Bill No</th>
                        <th>Bill Date</th>
                        <th>Bill Amount</th>
                        <th>Age (Days)</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {reportType === "Party with Ageing" 
                      ? (() => {
                          const filteredData = reportData;
                          const rows = filteredData.map((row, index) => {
                            return (
                              <tr key={index}>
                                <td className="text-center">{index + 1}</td>
                                <td>{row.partyName}</td>
                                <td className="text-center">{row.mobileNo}</td>
                                <td className="text-right">{Number(row.advance || 0).toFixed(2)}</td>
                                <td className="text-right">{Number(row.below30 || 0).toFixed(2)}</td>
                                <td className="text-right">{Number(row.b30to60 || 0).toFixed(2)}</td>
                                <td className="text-right">{Number(row.b61to90 || 0).toFixed(2)}</td>
                                <td className="text-right">{Number(row.above90 || 0).toFixed(2)}</td>
                                <td className="text-right text-bold">{Number(row.netAmount || 0).toFixed(2)}</td>
                              </tr>
                            );
                          });
                          return rows;
                        })()
                      : (() => {
                          const filteredData = reportData;
                          let sNo = 1;
                          let totAmt = 0;
                          const rows = [];
                          filteredData.forEach((party) => {
                            if (party.unpaidBills && party.unpaidBills.length > 0) {
                              party.unpaidBills.forEach((bill) => {
                                totAmt += Number(bill.amount || 0);
                                const val = bill.ageDays || 0;
                                const ageColor = val > 60 ? "#f5222d" : val > 30 ? "#faad14" : "inherit";
                                rows.push(
                                  <tr key={`${party.partyId}-${bill.refNo}`}>
                                    <td className="text-center">{sNo++}</td>
                                    <td>{party.partyName}</td>
                                    <td className="text-center">{bill.refNo}</td>
                                    <td className="text-center">{dayjs(bill.date).format("DD-MM-YYYY")}</td>
                                    <td className="text-right">{Number(bill.amount || 0).toFixed(2)}</td>
                                    <td className="text-center" style={{ color: ageColor, fontWeight: val > 30 ? 'bold' : 'normal' }}>{val}</td>
                                  </tr>
                                );
                              });
                            } else {
                              rows.push(
                                <tr key={`empty-${party.partyId}`}>
                                  <td className="text-center">{sNo++}</td>
                                  <td>{party.partyName}</td>
                                  <td className="text-center">-</td>
                                  <td className="text-center">-</td>
                                  <td className="text-right">0.00</td>
                                  <td className="text-center">0</td>
                                </tr>
                              );
                            }
                          });
                          rows.push(
                            <tr key="total" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                              <td colSpan={4} className="text-center">Total Bills: {sNo - 1}</td>
                              <td className="text-right">{totAmt.toFixed(2)}</td>
                              <td></td>
                            </tr>
                          );
                          return rows;
                        })()
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Web View */}
          <div className="web-view" style={{ overflowX: 'auto' }}>
            <Table
              className="compact-table"
              columns={reportType === "Party with Ageing" ? partyColumns : billWiseColumns}
              dataSource={reportData}
              rowKey="partyId"
              loading={loading}
              size="small"
              bordered
              scroll={{ x: 'max-content' }}
              expandable={reportType === "Bill Wise Ageing" ? {
                expandedRowRender,
                defaultExpandAllRows: true,
                rowExpandable: (record) => record.unpaidBills?.length > 0,
              } : undefined}
              pagination={false}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default PartyBalance;
