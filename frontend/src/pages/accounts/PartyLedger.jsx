import React, { useState, useEffect } from 'react';
import { Card, Form, DatePicker, Button, Typography, Space, Row, Col, Select, message, Table, Divider, Spin } from 'antd';
import { FilePdfOutlined, WhatsAppOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { useReactToPrint } from 'react-to-print';
import PartyLedgerPrint from '../../components/prints/PartyLedgerPrint';
import { getPartyLedger } from '../../api/partyLedger';
import { getParties } from '../../api/party';
import { getConcerns } from '../../api/concern';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PartyLedger = () => {
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('year'), dayjs()]);
  const [partyLedgers, setPartyLedgers] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [printData, setPrintData] = useState(null);
  const printRef = React.useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const triggerPrint = (record) => {
    setPrintData(record);
    // Use a small timeout to ensure the state update renders before printing
    setTimeout(() => {
        handlePrint();
    }, 100);
  };

  useEffect(() => {
    loadInitialData();
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const concernId = localStorage.getItem('selectedCompanyId');
      const resp = await getConcerns('', 1, 1000);
      const allConcerns = resp.data || resp || [];
      
      const concern = concernId 
        ? allConcerns.find(c => c.id === parseInt(concernId)) 
        : allConcerns[0];

      if (concern) {
        setCompanyDetails(concern);
      }
    } catch (err) {
      console.error('Error fetching concern details:', err);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resp = await getParties('', 1, 1000);
      const allParties = resp.data || resp || [];
      // Filter only parties that have 'Customer' in their partyTypes (case-insensitive)
      const customerParties = allParties.filter(p => 
        p.partyTypes?.some(pt => pt.partyType?.partyTypeName?.toLowerCase().trim() === 'customer')
      );
      setParties(customerParties);
      
      const customerIds = customerParties.map(p => p.id);
      // Fetch ledger for ONLY customer parties by default
      if (customerIds.length > 0) {
        await fetchLedger(customerIds, dateRange);
      } else {
        setPartyLedgers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (partyIds, range) => {
    setLoading(true);
    try {
      const from = range[0].format('YYYY-MM-DD');
      const to = range[1].format('YYYY-MM-DD');
      
      // If partyIds is empty, fetch only Customers by default
      const idsToFetch = partyIds && partyIds.length > 0 ? partyIds : parties.map(p => p.id);
      
      if (idsToFetch.length === 0) {
        setPartyLedgers([]);
        return;
      }

      const response = await getPartyLedger(idsToFetch.join(','), from, to);
      setPartyLedgers(response.partyLedgers || []);
    } catch (error) {
      console.error('Error loading ledger:', error);
      message.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const handlePartyChange = (values) => {
    setSelectedParties(values);
    fetchLedger(values, dateRange);
  };

  const handleDateChange = (range) => {
    if (!range) return;
    setDateRange(range);
    fetchLedger(selectedParties, range);
  };

  const summaryColumns = [
    { title: 'SI', key: 'si', width: 50, align: 'center', render: (_, __, i) => i + 1 },
    { title: 'Party Name', dataIndex: 'partyName', key: 'partyName', width: 200 },
    { 
       title: 'Opening Balance', 
       dataIndex: 'initialBalance', 
       key: 'initialBalance', 
       align: 'right',
       render: (val) => parseFloat(val).toFixed(2)
    },
    { 
       title: 'Debit', 
       key: 'debit', 
       align: 'right',
       render: (_, p) => {
           let total = 0;
           p.ledger?.forEach(l => total += Number(l.debit || 0));
           return total.toFixed(2);
       }
    },
    { 
       title: 'Credit', 
       key: 'credit', 
       align: 'right',
       render: (_, p) => {
           let total = 0;
           p.ledger?.forEach(l => total += Number(l.credit || 0));
           return total.toFixed(2);
       }
    },
    { 
       title: 'Final Balance', 
       dataIndex: 'finalBalance', 
       key: 'finalBalance', 
       align: 'right',
       render: (val) => parseFloat(val).toFixed(2)
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            title="Download PDF"
            icon={<FilePdfOutlined />} 
            style={{ color: '#52c41a' }}
            onClick={() => handleDownloadPDF(record)} 
          />
          <Button 
            type="link" 
            size="small"
            title="Print"
            icon={<PrinterOutlined />} 
            style={{ color: '#722ed1' }}
            onClick={() => triggerPrint(record)} 
          />
          <Button 
            type="link" 
            size="small"
            title="WhatsApp Share"
            icon={<WhatsAppOutlined />} 
            style={{ color: '#25D366' }}
            onClick={() => shareWhatsApp(record)} 
          />
        </Space>
      ),
    },
  ];

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

  const generatePDF = async (record) => {
    if (!companyDetails) {
        message.warning('Company details not loaded yet. Waiting...');
        return null;
    }

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a5',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // 1. Outer Frame (1px equivalent)
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    let currentY = 12;

    // 2. Concern Section (Centered with Logo on absolute left)
    if (companyDetails.logo) {
        try {
            const logoBase64 = await getImageDataUrl(companyDetails.logo);
            if (logoBase64) {
               // Add logo on left side similar to print view
               doc.addImage(logoBase64, 'PNG', 10, 8, 14, 14, '', 'FAST');
            }
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
    currentY += 4.5;

    // 3. Party Section (Centered)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(record.partyName?.toUpperCase() || '', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    if (record.address) {
        const wrappedPartyAddr = doc.splitTextToSize(record.address, pageWidth - 30);
        wrappedPartyAddr.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 3.5;
        });
    }

    const partyContacts = record.mobileNo || record.email ? `Phone No.: ${[record.phoneNo, record.mobileNo].filter(Boolean).join(', ')}${record.email ? `, E-Mail: ${record.email}` : ''}` : null;
    if (partyContacts) {
        doc.text(partyContacts, pageWidth / 2, currentY, { align: 'center' });
        currentY += 3.5;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`GST No.: ${record.gstNo || ''}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 2;
    
    doc.setLineWidth(0.2);
    doc.line(5, currentY, pageWidth - 5, currentY); // Line after party
    currentY += 5;

    // 4. Period (Pink/Red Centered)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 0, 100); 
    doc.text(`From ${dateRange[0].format('DD-MM-YYYY')} To ${dateRange[1].format('DD-MM-YYYY')}`, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0);
    currentY += 3;

    // 5. Table (Using autoTable for pixel precision)
    const tableData = [];
    tableData.push([
        '-', 
        'Opening -', 
        Number(record.initialBalance) >= 0 ? parseFloat(record.initialBalance).toFixed(2) : '',
        Number(record.initialBalance) < 0 ? parseFloat(Math.abs(record.initialBalance)).toFixed(2) : ''
    ]);
    
    let totalDebit = Number(record.initialBalance) >= 0 ? Number(record.initialBalance) : 0;
    let totalCredit = Number(record.initialBalance) < 0 ? Math.abs(Number(record.initialBalance)) : 0;
    
    record.ledger.forEach(l => {
        const d = Number(l.debit || 0);
        const c = Number(l.credit || 0);
        totalDebit += d;
        totalCredit += c;
        tableData.push([
            dayjs(l.refDate).format('DD/MM/YYYY'),
            l.particulars,
            d > 0 ? parseFloat(d).toFixed(2) : '',
            c > 0 ? parseFloat(c).toFixed(2) : '',
        ]);
    });

    const finalBalanceVal = totalDebit - totalCredit;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 5, right: 5, bottom: 15 },
      head: [['Date', 'Particulars', 'Debit', 'Credit']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 1.5, font: 'helvetica', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] },
        3: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [0, 118, 0] },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
            if (data.column.index === 2) data.cell.styles.textColor = [200, 0, 0];
            if (data.column.index === 3) data.cell.styles.textColor = [0, 118, 0];
        }
      }
    });

    // Drawing the footer at the END of the table (wherever it finished)
    const finalY = doc.lastAutoTable.finalY;
    const finalPage = doc.internal.getCurrentPageInfo().pageNumber;
    
    // We add some spacing then draw our custom footer rows
    let footerY = finalY;

    // Check if we have enough space for the footer (approx 15mm needed)
    // pageHeight is 210 for A5? No, A5 is 148x210. 
    // Wait, with format: 'a5', pageWidth is 148, pageHeight is 210.
    if (footerY + 15 > pageHeight - 10) {
        doc.addPage();
        footerY = 15; // Start at top of new page
        // Redraw outer rect on new page
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setLineWidth(0.2);
    
    // Total Row
    doc.rect(5, footerY, pageWidth - 10, 7);
    doc.text('Total', 60, footerY + 5, { align: 'center' });
    doc.setTextColor(200, 0, 0);
    doc.text(totalDebit.toFixed(2), pageWidth - 32, footerY + 5, { align: 'right' });
    doc.setTextColor(0, 118, 0);
    doc.text(totalCredit.toFixed(2), pageWidth - 7, footerY + 5, { align: 'right' });
    
    // Closing Balance Row
    doc.setTextColor(0);
    doc.rect(5, footerY + 7, pageWidth - 10, 7);
    doc.text('Closing Balance', 60, footerY + 12, { align: 'center' });
    if (finalBalanceVal >= 0) {
      doc.setTextColor(200, 0, 0);
      doc.text(Math.abs(finalBalanceVal).toFixed(2), pageWidth - 32, footerY + 12, { align: 'right' });
    } else {
      doc.setTextColor(0, 118, 0);
      doc.text(Math.abs(finalBalanceVal).toFixed(2), pageWidth - 7, footerY + 12, { align: 'right' });
    }

    return doc;
  };

  const handleDownloadPDF = async (record) => {
    const doc = await generatePDF(record);
    if (doc) {
        doc.save(`${record.partyName}_Ledger_${dateRange[0].format('DDMMYYYY')}_${dateRange[1].format('DDMMYYYY')}.pdf`);
        message.success('PDF Downloaded');
    }
  };

  const shareWhatsApp = async (record) => {
    // Generate the PDF
    const doc = await generatePDF(record);
    if (!doc) return;
    
    const fileName = `${record.partyName}_Ledger.pdf`;
    const blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // Check if the browser supports sharing files
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Party Ledger',
            });
            return;
        } catch (error) {
            console.log('Error sharing:', error);
        }
    }

    // Fallback: Download and redirect to WhatsApp
    doc.save(fileName);
    const whatsappUrl = `https://wa.me/`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card>
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
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          border: 1px solid #f0f0f0 !important;
        }
        @media print {
          @page { margin: 10mm; size: A4; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
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
          .ant-table-wrapper, .ant-table, .ant-table-container, .ant-table-content, table { 
            display: block !important; 
            overflow: visible !important;
            clear: both !important;
          }
          table { display: table !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
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
          .party-section { display: block !important; overflow: visible !important; clear: both !important; margin-bottom: 20pt !important; }
          .party-section .ant-row { display: flex !important; flex-flow: row nowrap !important; justify-content: space-between !important; width: 100% !important; align-items: center !important; }
          .party-section .ant-col { flex: 0 0 auto !important; width: auto !important; }
          .party-section .ant-typography-strong { font-size: 11pt !important; color: #000 !important; font-weight: bold !important; }
          .party-section .ant-typography-secondary { font-size: 9pt !important; color: #333 !important; text-align: right !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }} className="no-print">
        <Title level={4} style={{ margin: 0 }}>Party Ledger</Title>
        <Space size="middle">
          <Select
            mode="multiple"
            showSearch
            placeholder="Search and Select Parties"
            style={{ minWidth: 250, maxWidth: 400 }}
            onChange={handlePartyChange}
            value={selectedParties}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {parties.map(p => (
              <Option key={p.id} value={p.id}>{p.partyName}</Option>
            ))}
          </Select>
          <RangePicker 
            value={dateRange} 
            onChange={handleDateChange} 
            format="DD/MM/YYYY" 
          />
        </Space>
      </div>

      <Spin spinning={loading} tip="Loading Party Ledgers...">
        <div className="no-print" style={{ marginBottom: 24 }}>
             <Table
                dataSource={partyLedgers}
                columns={summaryColumns}
                pagination={false}
                size="small"
                bordered
                rowKey="partyId"
                className="compact-table"
             />
        </div>

        {!loading && partyLedgers.length === 0 && (
           <div style={{ padding: '40px', textAlign: 'center' }}>
                <Text type="secondary">No ledger entries found for the selected period.</Text>
           </div>
        )}
       </Spin>
       <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
           <div ref={printRef}>
              <PartyLedgerPrint 
                 data={printData} 
                 fromDate={dateRange[0]} 
                 toDate={dateRange[1]} 
                 companyDetails={companyDetails}
              />
           </div>
       </div>
    </Card>
  );
};

export default PartyLedger;
