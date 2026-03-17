import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  message,
  Space,
  Input,
  Tag,
  Modal,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getBillsForEinvoice,
  generateEinvoice,
  getEinvoiceStatus,
  cancelEinvoice,
} from '../../api/billEinvoice';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Search } = Input;

const BillEinvoice = () => {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [einvoiceDetails, setEinvoiceDetails] = useState(null);
  const { canAdd, canEdit } = useMenuPermissions();

  useEffect(() => {
    loadBills();
  }, [pagination.current, pagination.pageSize]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await getBillsForEinvoice(
        searchText,
        pagination.current,
        pagination.pageSize
      );
      setBills(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch (error) {
      console.error('Error loading bills:', error);
      message.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadBills();
  };

  const handleGenerateEinvoice = async (billId) => {
    try {
      setLoading(true);
      await generateEinvoice(billId);
      message.success('E-invoice generated successfully');
      loadBills();
    } catch (error) {
      console.error('Error generating E-invoice:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate E-invoice';
      
      if (errorMessage.includes('not active')) {
        message.error('E-invoice settings are not active. Please check settings.');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bill) => {
    try {
      setSelectedBill(bill);
      if (bill.einvoice) {
        const details = await getEinvoiceStatus(bill.id);
        setEinvoiceDetails(details);
      } else {
        setEinvoiceDetails(null);
      }
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('Error loading E-invoice details:', error);
      message.error('Failed to load E-invoice details');
    }
  };

  const handleCancelEinvoice = async (billId, reason) => {
    try {
      setLoading(true);
      await cancelEinvoice(billId, reason);
      message.success('E-invoice cancelled successfully');
      loadBills();
    } catch (error) {
      console.error('Error cancelling E-invoice:', error);
      message.error('Failed to cancel E-invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (bill) => {
    if (!bill.einvoice) {
      return <Tag color="default">Not Generated</Tag>;
    }

    switch (bill.einvoice.status) {
      case 0:
        if (bill.einvoice.isCanceled === 1) {
          return <Tag color="red">Cancelled</Tag>;
        }
        return <Tag color="orange">Failed</Tag>;
      case 1:
        return <Tag color="green">Generated</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 100,
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      width: 120,
      render: (date) => dayjs(date).format('DD-MM-YYYY'),
    },
    {
      title: 'Party',
      dataIndex: ['party', 'partyName'],
      key: 'party',
      width: 200,
      render: (partyName) => partyName || '-',
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      align: 'right',
      render: (amount) => Number(amount || 0).toFixed(2),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'IRN No',
      key: 'irnNo',
      width: 150,
      render: (_, record) => record.einvoice?.irnNo || '-',
    },
    {
      title: 'Ack No',
      key: 'ackNo',
      width: 120,
      render: (_, record) => record.einvoice?.ackNo || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          {(!record.einvoice || (record.einvoice.status === 0 && record.einvoice.isCanceled === 0)) && canAdd('einvoice') && (
            <Tooltip title={record.einvoice?.status === 0 ? "Regenerate E-invoice" : "Generate E-invoice"}>
              <Button
                type="link"
                size="small"
                icon={<SyncOutlined />}
                onClick={() => handleGenerateEinvoice(record.id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          
          {record.einvoice?.status === 1 && 
           record.einvoice?.isCanceled === 0 && 
           canEdit('einvoice') && (
            <Popconfirm
              title="Cancel E-invoice"
              description="Are you sure you want to cancel this E-invoice?"
              onConfirm={() => {
                Modal.confirm({
                  title: 'Cancel E-invoice',
                  content: (
                    <Input.TextArea
                      placeholder="Enter cancellation reason"
                      rows={3}
                      onChange={(e) => {
                        Modal.destroyAll();
                        if (e.target.value.trim()) {
                          handleCancelEinvoice(record.id, e.target.value.trim());
                        }
                      }}
                    />
                  ),
                });
              }}
            >
              <Tooltip title="Cancel E-invoice">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table .ant-input,
        .compact-table .ant-input-number,
        .compact-table .ant-select-selector,
        .compact-table .ant-picker {
          font-size: 11px !important;
          min-height: 24px !important;
          height: 24px !important;
        }
        .compact-table .ant-input-number-input,
        .compact-table .ant-picker-input > input {
          height: 22px !important;
        }
      `}</style>
      <div className="page-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Bill E-invoice
        </Title>
        <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search by bill no, party name" 
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
          />
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={loadBills}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={bills}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize,
            }));
          },
        }}
        scroll={{ x: 1200 }}
        size="small"
        className="compact-table"
      />

      {/* Details Modal */}
      <Modal
        title={`E-invoice Details - ${selectedBill?.billNo}`}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedBill(null);
          setEinvoiceDetails(null);
        }}
        footer={null}
        width={800}
      >
        {selectedBill && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Bill Information:</strong>
              <div style={{ marginLeft: 16, marginTop: 8 }}>
                <p><strong>Bill No:</strong> {selectedBill.billNo}</p>
                <p><strong>Bill Date:</strong> {dayjs(selectedBill.billDate).format('DD-MM-YYYY')}</p>
                <p><strong>Party:</strong> {selectedBill.party?.partyName || '-'}</p>
                <p><strong>Net Amount:</strong> ₹{Number(selectedBill.netAmount || 0).toFixed(2)}</p>
              </div>
            </div>

            {einvoiceDetails ? (
              <div>
                <strong>E-invoice Information:</strong>
                <div style={{ marginLeft: 16, marginTop: 8 }}>
                  <p><strong>Status:</strong> {getStatusTag(selectedBill)}</p>
                  <p><strong>IRN No:</strong> {einvoiceDetails.irnNo || '-'}</p>
                  <p><strong>Ack No:</strong> {einvoiceDetails.ackNo || '-'}</p>
                  <p><strong>Ack Date:</strong> {einvoiceDetails.ackDate ? dayjs(einvoiceDetails.ackDate).format('DD-MM-YYYY HH:mm:ss') : '-'}</p>
                  <p><strong>E-way No:</strong> {einvoiceDetails.ewbNo || '-'}</p>
                  <p><strong>E-way Date:</strong> {einvoiceDetails.ewbDate ? dayjs(einvoiceDetails.ewbDate).format('DD-MM-YYYY HH:mm:ss') : '-'}</p>
                  <p><strong>E-way Valid Date:</strong> {einvoiceDetails.ewbValidDate ? dayjs(einvoiceDetails.ewbValidDate).format('DD-MM-YYYY HH:mm:ss') : '-'}</p>
                  
                  {einvoiceDetails.isCanceled === 1 && (
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
                      <p><strong>Cancellation Reason:</strong> {einvoiceDetails.cancelReason || '-'}</p>
                    </div>
                  )}
                  
                  {einvoiceDetails.errorMessage && (
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
                      <p><strong>Error:</strong> {einvoiceDetails.errorMessage}</p>
                    </div>
                  )}
                  
                  <p><strong>Created:</strong> {dayjs(einvoiceDetails.createdAt).format('DD-MM-YYYY HH:mm:ss')}</p>
                  <p><strong>Updated:</strong> {dayjs(einvoiceDetails.updatedAt).format('DD-MM-YYYY HH:mm:ss')}</p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                <ExclamationCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>E-invoice not generated for this bill</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default BillEinvoice;