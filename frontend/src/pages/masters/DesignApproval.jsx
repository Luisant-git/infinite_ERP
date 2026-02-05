import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Checkbox, message, Space, Modal } from 'antd';
import { EyeOutlined, FileImageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDesigns, updateDesign } from '../../api/design';

const { Title } = Typography;

const DesignApproval = () => {
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const response = await getDesigns('', 1, 1000);
      const unapproved = (response.data || []).filter(d => d.isApproval === 0);
      setDesigns(unapproved);
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const handleApprove = async (record) => {
    setLoading(true);
    try {
      await updateDesign(record.id, { ...record, isApproval: 1 });
      message.success('Design approved successfully');
      loadDesigns();
    } catch (error) {
      message.error('Failed to approve design');
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      message.info('No image available');
    }
  };

  const handleView = (record) => {
    Modal.info({
      title: 'Design Details',
      width: 700,
      content: (
        <div>
          <p><strong>Design No:</strong> {record.designNo}</p>
          <p><strong>Design Name:</strong> {record.designName}</p>
          <p><strong>Customer:</strong> {record.customer?.partyName || 'N/A'}</p>
          <p><strong>Type of Print:</strong> {record.typeOfPrint || 'N/A'}</p>
          <p><strong>No of Color:</strong> {record.noOfColor}</p>
          <p><strong>No of Print:</strong> {record.noOfPrint}</p>
          <p><strong>Commercial Rate:</strong> ₹{record.commercialRate}</p>
          <p><strong>Description:</strong> {record.description || 'N/A'}</p>
          <p><strong>Remarks:</strong> {record.remarks || 'N/A'}</p>
          {record.imagePath && (
            <div style={{ marginTop: 16 }}>
              <strong>Design Image:</strong>
              <div style={{ marginTop: 8 }}>
                <img src={record.imagePath} alt="Design" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>
      ),
    });
  };

  const columns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'Design No', dataIndex: 'designNo', width: 140 },
    { title: 'Design Name', dataIndex: 'designName', width: 180 },
    { title: 'Customer', dataIndex: ['customer', 'partyName'], width: 180 },
    { title: 'Print Type', dataIndex: 'typeOfPrint', width: 130 },
    { 
      title: 'NoofColor/NoofPrint', 
      key: 'colorPrint', 
      width: 150,
      render: (_, record) => `${record.noOfColor} / ${record.noOfPrint}`
    },
    { title: 'Rate', dataIndex: 'commercialRate', width: 100, render: (val) => `₹${val}` },
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
      title: 'Actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => handleViewImage(record.imagePath)}
            disabled={!record.imagePath}
          />
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
        <Title level={3} style={{ margin: 0 }}>Design Approval</Title>
      </div>

      <Table
        columns={columns}
        dataSource={designs}
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

export default DesignApproval;
