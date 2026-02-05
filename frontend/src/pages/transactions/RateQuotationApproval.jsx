import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Checkbox, message, Space, Modal } from 'antd';
import { EyeOutlined, FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRateQuotations, updateRateQuotation } from '../../api/rateQuotation';

const { Title } = Typography;

const RateQuotationApproval = () => {
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const response = await getRateQuotations('', 1, 1000);
      const unapproved = (response.data || []).filter(q => q.isApproval === 0);
      setQuotations(unapproved);
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  const handleApprove = async (record) => {
    setLoading(true);
    try {
      await updateRateQuotation(record.id, { ...record, isApproval: 1 });
      message.success('Quotation approved successfully');
      loadQuotations();
    } catch (error) {
      message.error('Failed to approve quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttachment = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      message.info('No attachment available');
    }
  };

  const handleView = (record) => {
    Modal.info({
      title: 'Quotation Details',
      width: 700,
      content: (
        <div>
          <p><strong>Quot No:</strong> {record.quotNo}</p>
          <p><strong>Date:</strong> {dayjs(record.quotDate).format('DD-MM-YYYY')}</p>
          <p><strong>Customer:</strong> {record.party?.partyName || 'N/A'}</p>
          <p><strong>Payment Terms:</strong> {record.paymentTerms || 'N/A'}</p>
          <p><strong>Remarks:</strong> {record.remarks || 'N/A'}</p>
          <div style={{ marginTop: 16 }}>
            <strong>Process Details:</strong>
            <Table
              size="small"
              dataSource={record.details || []}
              pagination={false}
              columns={[
                { title: 'Process', dataIndex: ['process', 'processName'], key: 'process' },
                { title: 'Rate', dataIndex: 'rate', key: 'rate' },
                { title: 'Confirm Rate', dataIndex: 'confirmRate', key: 'confirmRate' },
                { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' }
              ]}
            />
          </div>
        </div>
      ),
    });
  };

  const columns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'Quot No', dataIndex: 'quotNo', width: 100 },
    { title: 'Date', dataIndex: 'quotDate', width: 100, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'Customer', dataIndex: ['party', 'partyName'], width: 180 },
    { 
      title: 'Process', 
      key: 'process', 
      width: 200,
      render: (_, record) => record.details?.map(d => d.process?.processName).filter(Boolean).join(', ') || 'N/A'
    },
    { 
      title: 'Rate', 
      key: 'rate', 
      width: 100,
      render: (_, record) => record.details?.[0]?.rate || 0
    },
    { 
      title: 'Confirm Rate', 
      key: 'confirmRate', 
      width: 120,
      render: (_, record) => record.details?.[0]?.confirmRate || 0
    },
    {
      title: 'Approval',
      key: 'approval',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={false}
          onChange={(e) => {
            if (e.target.checked) {
              handleApprove(record);
            }
          }}
        />
      ),
    },
    {
      title: 'View Attachment',
      key: 'attachment',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<FileOutlined />}
          onClick={() => handleViewAttachment(record.attachFile)}
          disabled={!record.attachFile}
        />
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
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Rate Quotation Approval</Title>
      </div>

      <Table
        columns={columns}
        dataSource={quotations}
        rowKey="id"
        size="small"
        loading={loading}
        className="compact-table"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
    </Card>
  );
};

export default RateQuotationApproval;
