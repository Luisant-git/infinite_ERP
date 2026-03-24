import React, { useState, useEffect } from 'react';
import { Card, Form, DatePicker, Button, Typography, Space, Row, Col, Select, message, Table, Divider, Spin } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPartyLedger } from '../../api/partyLedger';
import { getParties } from '../../api/party';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PartyLedger = () => {
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('year'), dayjs()]);
  const [partyLedgers, setPartyLedgers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resp = await getParties('', 1, 1000);
      setParties(resp.data || []);
      // Fetch ALL parties by default on load
      await fetchLedger([], dateRange);
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
      const response = await getPartyLedger(partyIds.join(','), from, to);
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

  const columns = [
    { title: 'Ref No', dataIndex: 'refNo', key: 'refNo', width: '8%', searchable: true },
    { 
      title: 'Ref Date', 
      dataIndex: 'refDate', 
      key: 'refDate', 
      width: '12%', 
      searchable: true,
      render: (date) => dayjs(date).format('DD/MM/YYYY') 
    },
    { title: 'Particulars', dataIndex: 'particulars', key: 'particulars', width: '40%', searchable: true },
    { 
      title: 'Debit', 
      dataIndex: 'debit', 
      key: 'debit', 
      width: '10%', 
      align: 'right',
      render: (val) => val > 0 ? parseFloat(val).toFixed(2) : '0.00' 
    },
    { 
      title: 'Credit', 
      dataIndex: 'credit', 
      key: 'credit',      
      width: '10%', 
      align: 'right',
      render: (val) => val > 0 ? parseFloat(val).toFixed(2) : '0.00' 
    },
    { 
      title: 'Running Balance', 
      dataIndex: 'runningBalance', 
      key: 'runningBalance', 
      width: '20%', 
      align: 'center',
      render: (val) => parseFloat(val).toFixed(2)
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-ledger-table .ant-table-thead > tr > th {
          background-color: var(--primary-color) !important;
          color: white !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          border: 1px solid #1e3f73 !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .compact-ledger-table .ant-table-thead > tr > th.ant-table-cell {
          background-color: var(--primary-color) !important;
          background: var(--primary-color) !important;
          color: white !important;
        }
        .compact-ledger-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 11px !important;
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
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
        </Space>
      </div>

      <Spin spinning={loading} tip="Loading Party Ledgers...">
        {partyLedgers.map((pData, pIdx) => (
          <div key={pData.partyId} className="party-section" style={{ marginBottom: 16 }}>
             <div style={{ marginBottom: 4, padding: '4px 12px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <Row justify="space-between" align="middle">
                    <Col><Text strong style={{ fontSize: '16px' }}>Party: {pData.partyName}</Text></Col>
                    <Col><Text type="secondary" style={{ fontSize: '13px' }}>Period: {dateRange[0].format('DD/MM/YYYY')} to {dateRange[1].format('DD/MM/YYYY')}</Text></Col>
                </Row>
             </div>
             
             <Table
               columns={columns}
               dataSource={pData.ledger || []}
               pagination={false}
               size="small"
               className="compact-ledger-table"
               rowKey={(record, index) => `${record.refNo}-${index}`}
               bordered
               summary={rows => {
                   let totalDebit = 0;
                   let totalCredit = 0;
                   rows.forEach(({ debit, credit }) => {
                     totalDebit += (Number(debit) || 0);
                     totalCredit += (Number(credit) || 0);
                   });
                   return (
                     <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                       <Table.Summary.Cell index={0} colSpan={3} align="right">Total</Table.Summary.Cell>
                       <Table.Summary.Cell index={1} align="right">{totalDebit.toFixed(2)}</Table.Summary.Cell>
                       <Table.Summary.Cell index={2} align="right">{totalCredit.toFixed(2)}</Table.Summary.Cell>
                       <Table.Summary.Cell index={3} align="center">
                            {(totalDebit - totalCredit).toFixed(2)}
                       </Table.Summary.Cell>
                     </Table.Summary.Row>
                   );
                 }}
             />
             {pIdx < partyLedgers.length - 1 && <Divider style={{ margin: '12px 0' }} className="no-print" />}
          </div>
        ))}
        {!loading && partyLedgers.length === 0 && (
           <div style={{ padding: '40px', textAlign: 'center' }}>
                <Text type="secondary">No ledger entries found for the selected period.</Text>
           </div>
        )}
      </Spin>
    </Card>
  );
};

export default PartyLedger;
