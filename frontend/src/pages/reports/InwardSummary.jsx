import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Select,
  message,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const InwardSummary = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [parties, setParties] = useState([]);

  useEffect(() => {
    loadParties();
    loadData();
  }, []);

  const loadParties = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await getParties();
      // setParties(response.data || []);
      
      // Mock data for now
      setParties([
        { id: 1, partyName: 'Party A' },
        { id: 2, partyName: 'Party B' },
        { id: 3, partyName: 'Party C' },
      ]);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // This would be replaced with actual API call
      // const response = await getInwardSummary({
      //   fromDate: dateRange[0]?.toISOString(),
      //   toDate: dateRange[1]?.toISOString(),
      //   partyId: selectedParty
      // });
      // setData(response.data || []);

      // Mock data for now
      setTimeout(() => {
        setData([
          {
            id: 1,
            inwardNo: 'INW001',
            inwardDate: '2024-01-15',
            partyName: 'Party A',
            totalQty: 150.500,
            totalRolls: 25,
            totalAmount: 75250.00,
            fabricType: 'Cotton',
            grnNo: 'GRN001'
          },
          {
            id: 2,
            inwardNo: 'INW002',
            inwardDate: '2024-01-16',
            partyName: 'Party B',
            totalQty: 200.750,
            totalRolls: 30,
            totalAmount: 95375.00,
            fabricType: 'Polyester',
            grnNo: 'GRN002'
          },
          {
            id: 3,
            inwardNo: 'INW003',
            inwardDate: '2024-01-17',
            partyName: 'Party C',
            totalQty: 125.250,
            totalRolls: 20,
            totalAmount: 62625.00,
            fabricType: 'Silk',
            grnNo: 'GRN003'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Failed to load inward summary data');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Please select date range');
      return;
    }
    loadData();
  };

  const handleExport = () => {
    message.info('Export functionality will be implemented');
  };

  const handlePrint = () => {
    message.info('Print functionality will be implemented');
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => index + 1,
    },
    {
      title: 'Inward No',
      dataIndex: 'inwardNo',
      key: 'inwardNo',
      width: 120,
    },
    {
      title: 'Inward Date',
      dataIndex: 'inwardDate',
      key: 'inwardDate',
      width: 120,
      render: (date) => dayjs(date).format('DD-MM-YYYY'),
    },
    {
      title: 'GRN No',
      dataIndex: 'grnNo',
      key: 'grnNo',
      width: 100,
    },
    {
      title: 'Party Name',
      dataIndex: 'partyName',
      key: 'partyName',
      width: 200,
    },
    {
      title: 'Fabric Type',
      dataIndex: 'fabricType',
      key: 'fabricType',
      width: 120,
    },
    {
      title: 'Total Qty',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      align: 'right',
      render: (qty) => Number(qty).toFixed(3),
    },
    {
      title: 'Total Rolls',
      dataIndex: 'totalRolls',
      key: 'totalRolls',
      width: 100,
      align: 'right',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount) => `₹${Number(amount).toFixed(2)}`,
    },
  ];

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      totalQty: acc.totalQty + (Number(item.totalQty) || 0),
      totalRolls: acc.totalRolls + (Number(item.totalRolls) || 0),
      totalAmount: acc.totalAmount + (Number(item.totalAmount) || 0),
    }),
    { totalQty: 0, totalRolls: 0, totalAmount: 0 }
  );

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Inward Summary Report
        </Title>
      </div>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Date Range:
            </label>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD-MM-YYYY"
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Party:
            </label>
            <Select
              placeholder="Select Party"
              value={selectedParty}
              onChange={setSelectedParty}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {parties.map((party) => (
                <Option key={party.id} value={party.id}>
                  {party.partyName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={10}>
            <div style={{ marginTop: 24 }}>
              <Space>
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
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {data.length}
              </div>
              <div style={{ color: '#666' }}>Total Inwards</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {totals.totalQty.toFixed(3)}
              </div>
              <div style={{ color: '#666' }}>Total Quantity</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {totals.totalRolls}
              </div>
              <div style={{ color: '#666' }}>Total Rolls</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>
                ₹{totals.totalAmount.toFixed(2)}
              </div>
              <div style={{ color: '#666' }}>Total Amount</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          summary={() => (
            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={6}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <strong>{totals.totalQty.toFixed(3)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <strong>{totals.totalRolls}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <strong>₹{totals.totalAmount.toFixed(2)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Spin>
    </Card>
  );
};

export default InwardSummary;