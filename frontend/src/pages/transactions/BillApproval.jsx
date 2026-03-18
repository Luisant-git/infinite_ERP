import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Typography, Button, Checkbox, message, Space, Modal } from 'antd';
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { getFabricBills, updateFabricBill } from '../../api/fabricBill';
import { getParties } from '../../api/party';
import { getConcerns } from '../../api/concern';
import { getGstMasters } from '../../api/gstMaster';
import { getEinvoiceStatus } from '../../api/billEinvoice';
import { useSelector } from 'react-redux';
import FabricBillPrint from '../../components/prints/FabricBillPrint';

const { Title } = Typography;

const BillApproval = () => {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [parties, setParties] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [gstMasters, setGstMasters] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const { IsMD } = useSelector(state => state.auth);
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [printPartyData, setPrintPartyData] = useState(null);
  const [printInvoiceToData, setPrintInvoiceToData] = useState(null);
  const [printEinvoiceData, setPrintEinvoiceData] = useState(null);
  const [concernData, setConcernData] = useState(null);

  useEffect(() => {
    loadBills();
    loadParties();
    loadConcerns();
    loadGstMasters();
    loadConcernData();
  }, []);

  const loadParties = async () => {
    try {
      const response = await getParties('', 1, 1000);
      setParties(response.data || []);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadConcerns = async () => {
    try {
      const response = await getConcerns('', 1, 1000);
      setConcerns(response.data || []);
    } catch (error) {
      console.error('Error loading concerns:', error);
    }
  };

  const loadGstMasters = async () => {
    try {
      const response = await getGstMasters('', 1, 100);
      setGstMasters(response.data?.filter((g) => g.isActive === 1) || []);
    } catch (error) {
      console.error('Error loading GST masters:', error);
    }
  };

  const loadConcernData = async () => {
    try {
      const concernId = localStorage.getItem('selectedCompanyId');
      if (concernId) {
        const response = await getConcerns('', 1, 1000);
        const concern = response.data?.find(c => c.id === parseInt(concernId));
        setConcernData(concern || null);
      }
    } catch (error) {
      console.error('Error loading concern data:', error);
    }
  };

  const loadBills = async () => {
    try {
      const response = await getFabricBills('', 1, 1000);
      const allBills = response.data || [];
      const unapproved = allBills.filter(b => !b.isApproval || b.isApproval === 0);
      setBills(unapproved.length > 0 ? unapproved : allBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const handleApprove = async (record) => {
    Modal.confirm({
      title: 'Confirm Approval',
      content: `Are you sure you want to approve Bill No: ${record.billNo}?`,
      onOk: async () => {
        setLoading(true);
        try {
          await updateFabricBill(record.id, { ...record, isApproval: 1 });
          message.success('Bill approved successfully');
          setSelectedRows([]);
          loadBills();
        } catch (error) {
          message.error('Failed to approve bill');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleView = (record) => {
    const party = parties.find(p => p.id === record.partyId);
    
    Modal.info({
      title: 'Bill Details',
      width: 900,
      content: (
        <div>
          <p><strong>Bill No:</strong> {record.billNo}</p>
          <p><strong>Bill Date:</strong> {dayjs(record.billDate).format('DD-MM-YYYY')}</p>
          <p><strong>Party:</strong> {party?.partyName || 'N/A'}</p>
          <p><strong>Bill Quantity:</strong> {Number(record.totalQty || 0).toFixed(3)}</p>
          <p><strong>Total Rolls:</strong> {record.totalRolls || 0}</p>
          <p><strong>Total Amount:</strong> ₹{Number(record.totalAmount || 0).toFixed(2)}</p>
          <p><strong>Screen Amount:</strong> ₹{Number(record.screenAmount || 0).toFixed(2)}</p>
          <p><strong>GST Amount:</strong> ₹{Number(record.gstAmount || 0).toFixed(2)}</p>
          <p><strong>Net Amount:</strong> ₹{Number(record.netAmount || 0).toFixed(2)}</p>
          <p><strong>E-way No:</strong> {record.ewayNo || 'N/A'}</p>
          <p><strong>HSN Code:</strong> {record.hsnCode || 'N/A'}</p>
          <div style={{ marginTop: 16 }}>
            <strong>Bill Details:</strong>
            <Table
              size="small"
              dataSource={record.details || []}
              pagination={false}
              scroll={{ x: 800 }}
              columns={[
                { title: 'Inward No', dataIndex: 'inwardNo', width: 100 },
                { title: 'DC No', dataIndex: 'dcNo', width: 100 },
                { title: 'Weight', dataIndex: 'weight', width: 100, render: (v) => Number(v || 0).toFixed(3) },
                { title: 'Rolls', dataIndex: 'rolls', width: 80 },
                { title: 'Rate', dataIndex: 'rate', width: 100, render: (v) => Number(v || 0).toFixed(2) },
                { title: 'Amount', dataIndex: 'amount', width: 120, render: (v) => Number(v || 0).toFixed(2) },
                { title: 'Process', dataIndex: 'process', width: 150 }
              ]}
            />
          </div>
        </div>
      ),
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrintBill = async (record) => {
    try {
      // Get party data
      const party = parties.find(p => p.id === record.partyId);
      const invoiceToParty = parties.find(p => p.id === record.invoiceTo);
      
      // Get E-invoice data if bill is approved
      let einvoiceData = null;
      if (record.isApproval === 1) {
        try {
          einvoiceData = await getEinvoiceStatus(record.id);
        } catch (error) {
          console.log('No E-invoice data found');
        }
      }
      
      // Set print data
      setPrintData(record);
      setPrintPartyData(party);
      setPrintInvoiceToData(invoiceToParty || party);
      setPrintEinvoiceData(einvoiceData);
      
      // Trigger print after data is set
      setTimeout(() => {
        if (printRef.current) {
          handlePrint();
        }
      }, 100);
      
    } catch (error) {
      message.error('Failed to prepare print data');
      console.error('Print error:', error);
    }
  };

  const getConcernName = (bill) => {
    // First check if concern is directly included in the bill
    if (bill.concern) {
      return bill.concern.partyName || '';
    }
    
    // Then check if concern is available through tenant
    if (bill.tenant?.concern) {
      return bill.tenant.concern.partyName || '';
    }
    
    // Fallback to concernId lookup
    if (bill.concernId) {
      const concern = concerns.find(c => c.id === bill.concernId);
      return concern?.partyName || '';
    }
    
    return '';
  };

  const columns = [
    { title: 'Bill No', dataIndex: 'billNo', width: 80 },
    { 
      title: 'Date', 
      dataIndex: 'billDate', 
      width: 100, 
      render: (val) => dayjs(val).format('DD-MM-YYYY') 
    },
    { 
      title: 'Concern', 
      key: 'concern',
      width: 100,
      render: (_, record) => getConcernName(record)
    },
    { 
      title: 'Party', 
      dataIndex: 'partyId', 
      width: 120,
      render: (val) => parties.find(p => p.id === val)?.partyName || ''
    },
    { 
      title: 'Process / Rate', 
      key: 'processRate', 
      width: 200,
      render: (_, record) => {
        // Group by unique process-rate combinations
        const processRateMap = new Map();
        
        record.details?.forEach(d => {
          const process = d.process || 'N/A';
          const rate = Number(d.rate || 0).toFixed(0);
          const key = `${process}-${rate}`;
          
          if (!processRateMap.has(key)) {
            processRateMap.set(key, { process, rate });
          }
        });
        
        const processRates = Array.from(processRateMap.values())
          .map(pr => `${pr.process} - ${pr.rate}`)
          .join(' / ');
        
        return <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{processRates || 'N/A'}</div>;
      }
    },
    { 
      title: 'Bill Qty', 
      dataIndex: 'totalQty', 
      width: 80,
      render: (v) => Number(v || 0).toFixed(0)
    },
    { 
      title: 'Rate', 
      key: 'avgRate', 
      width: 70,
      render: (_, record) => {
        const avgRate = record.totalQty > 0 ? record.totalAmount / record.totalQty : 0;
        return Number(avgRate).toFixed(0);
      }
    },
    { 
      title: 'Amount', 
      dataIndex: 'totalAmount', 
      width: 90,
      render: (v) => Number(v || 0).toFixed(0)
    },
    { 
      title: 'GST Amount', 
      dataIndex: 'gstAmount', 
      width: 90,
      render: (v) => Number(v || 0).toFixed(0)
    },
    { 
      title: 'Net Amount', 
      dataIndex: 'netAmount', 
      width: 90,
      render: (v) => Number(v || 0).toFixed(0)
    },
    {
      title: 'Approval',
      key: 'approval',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={selectedRows.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows([...selectedRows, record.id]);
            } else {
              setSelectedRows(selectedRows.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: 'Actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintBill(record)}
            style={{ color: "#722ed1" }}
          />
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleApprove(record)}
            disabled={!selectedRows.includes(record.id)}
          >
            Update
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Bill Approval</Title>
      </div>

      <Table
        columns={columns}
        dataSource={bills}
        rowKey="id"
        size="small"
        loading={loading}
        className="compact-table"
        scroll={{ x: 1400 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
      
      {/* Hidden Print Component */}
      <div style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px', 
        visibility: 'hidden',
        opacity: 0,
        height: 0,
        overflow: 'hidden'
      }}>
        {printData && (
          <FabricBillPrint
            ref={printRef}
            data={printData}
            concernData={concernData}
            partyData={printPartyData}
            invoiceToData={printInvoiceToData}
            einvoiceData={printEinvoiceData}
            gstMasters={gstMasters}
          />
        )}
      </div>
    </Card>
  );
};

export default BillApproval;
