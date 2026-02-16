import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Modal, message, Row, Col, Checkbox, Select, Input } from 'antd';
import { EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { getDesigns, updateDesign } from '../../api/design';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const StrikeOffApproval = () => {
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [editingRows, setEditingRows] = useState({});
  const [strikeOffStatus, setStrikeOffStatus] = useState({});
  const [strikeOffComments, setStrikeOffComments] = useState({});
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async (page = 1, pageSize = 10) => {
    try {
      const response = await getDesigns('', page, 1000);
      const allDesigns = response.data || response;
      
      const completedDesigns = allDesigns.filter(d => {
        return d.designCompleted === 1 && 
               (d.strikeOffApproval === 0 || d.strikeOffApproval === undefined || d.strikeOffApproval === null) && 
               (d.strikeOffRejected === 0 || d.strikeOffRejected === undefined || d.strikeOffRejected === null);
      });
      
      setDesigns(completedDesigns);
      
      setPagination({
        current: page,
        pageSize: pageSize,
        total: completedDesigns.length
      });
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const handleStrikeOffChange = (recordId, checked) => {
    setEditingRows(prev => ({
      ...prev,
      [recordId]: checked
    }));
    if (!checked) {
      setStrikeOffStatus(prev => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
      setStrikeOffComments(prev => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
    }
  };

  const handleOpenUpdateModal = (record) => {
    if (!editingRows[record.id]) {
      message.warning('Please check the Strike Off checkbox first');
      return;
    }
    setSelectedRecord(record);
    setIsUpdateModalVisible(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalVisible(false);
    setSelectedRecord(null);
    if (selectedRecord) {
      setStrikeOffStatus(prev => {
        const newState = { ...prev };
        delete newState[selectedRecord.id];
        return newState;
      });
      setStrikeOffComments(prev => {
        const newState = { ...prev };
        delete newState[selectedRecord.id];
        return newState;
      });
    }
  };

  const handleStatusChange = (recordId, value) => {
    setStrikeOffStatus(prev => ({
      ...prev,
      [recordId]: value
    }));
    if (value === 'approve') {
      setStrikeOffComments(prev => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
    }
  };

  const handleCommentChange = (recordId, value) => {
    setStrikeOffComments(prev => ({
      ...prev,
      [recordId]: value
    }));
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;

    const status = strikeOffStatus[selectedRecord.id];
    const comment = strikeOffComments[selectedRecord.id];

    if (!status) {
      message.warning('Please select Approve or Reject');
      return;
    }

    if (status === 'reject' && !comment?.trim()) {
      message.warning('Strike-off comment is mandatory for rejection');
      return;
    }

    setLoading(true);
    try {
      await updateDesign(selectedRecord.id, {
        ...selectedRecord,
        strikeOffApproval: status === 'approve' ? 1 : 0,
        strikeOffRejected: status === 'reject' ? 1 : 0,
        strikeOffComment: status === 'reject' ? comment : null,
        date: selectedRecord.date
      });
      message.success(`Strike off ${status === 'approve' ? 'approved' : 'rejected'} successfully`);
      setEditingRows(prev => {
        const newState = { ...prev };
        delete newState[selectedRecord.id];
        return newState;
      });
      setStrikeOffStatus(prev => {
        const newState = { ...prev };
        delete newState[selectedRecord.id];
        return newState;
      });
      setStrikeOffComments(prev => {
        const newState = { ...prev };
        delete newState[selectedRecord.id];
        return newState;
      });
      handleCloseUpdateModal();
      loadDesigns();
    } catch (error) {
      message.error('Failed to update strike off');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record) => {
    Modal.info({
      title: 'Design Details',
      width: 700,
      content: (
        <div>
          <Row gutter={[16, 8]}>
            <Col span={12}><strong>Ref No:</strong> {record.refNo || 'N/A'}</Col>
            <Col span={12}><strong>Date:</strong> {dayjs(record.date).format('DD/MM/YYYY')}</Col>
            <Col span={12}><strong>Design No:</strong> {record.designNo}</Col>
            <Col span={12}><strong>Design Name:</strong> {record.designName}</Col>
            <Col span={12}><strong>Customer:</strong> {record.customer?.partyName || 'N/A'}</Col>
            <Col span={12}><strong>Type of Print:</strong> {record.typeOfPrint || 'N/A'}</Col>
            <Col span={12}><strong>No of Color:</strong> {record.noOfColor}</Col>
            <Col span={12}><strong>No of Print:</strong> {record.noOfPrint}</Col>
            <Col span={12}><strong>Commercial Rate:</strong> ₹{record.commercialRate}</Col>
            <Col span={12}><strong>Confirm Rate:</strong> ₹{record.confirmRate || 0}</Col>
            <Col span={24}><strong>Description:</strong> {record.description || 'N/A'}</Col>
            <Col span={24}><strong>Remarks:</strong> {record.remarks || 'N/A'}</Col>
          </Row>
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
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Design No',
      dataIndex: 'designNo',
      key: 'designNo',
      width: 140,
    },
    {
      title: 'Design Name',
      dataIndex: 'designName',
      key: 'designName',
      width: 180,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'partyName'],
      key: 'customer',
      width: 180,
    },
    {
      title: 'Type of Print',
      dataIndex: 'typeOfPrint',
      key: 'typeOfPrint',
      width: 130,
    },
    {
      title: 'Colors',
      dataIndex: 'noOfColor',
      key: 'noOfColor',
      width: 80,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Design Completed',
      dataIndex: 'designCompleted',
      key: 'designCompleted',
      width: 130,
      align: 'center',
      render: (val) => <Checkbox checked={val === 1} disabled />,
    },
    {
      title: 'MD Approve',
      dataIndex: 'isApproval',
      key: 'isApproval',
      width: 110,
      align: 'center',
      render: (val) => <Checkbox checked={val === 1} disabled />,
    },
    {
      title: 'Strike Off',
      key: 'strikeOff',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Checkbox 
          checked={editingRows[record.id] || false}
          onChange={(e) => handleStrikeOffChange(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button 
            type="primary" 
            size="small" 
            icon={<SaveOutlined />}
            onClick={() => handleOpenUpdateModal(record)}
            loading={loading}
            disabled={!editingRows[record.id]}
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
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table .ant-btn {
          padding: 0 8px !important;
          height: 24px !important;
          font-size: 12px !important;
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Strike Off Approval</Title>
      </div>

      <Table 
        columns={columns} 
        dataSource={designs} 
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        className="compact-table"
      />

      <Modal
        title="Update Strike Off Status"
        open={isUpdateModalVisible}
        onCancel={handleCloseUpdateModal}
        footer={[
          <Button key="cancel" onClick={handleCloseUpdateModal}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={handleUpdate}
          >
            Submit
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Action *</label>
            <Select
              placeholder="Select Action"
              style={{ width: '100%' }}
              value={selectedRecord ? strikeOffStatus[selectedRecord.id] : undefined}
              onChange={(value) => selectedRecord && handleStatusChange(selectedRecord.id, value)}
            >
              <Select.Option value="approve">Approve</Select.Option>
              <Select.Option value="reject">Reject</Select.Option>
            </Select>
          </div>
          {selectedRecord && strikeOffStatus[selectedRecord.id] === 'reject' && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Strike Off Comment *</label>
              <TextArea
                placeholder="Enter rejection comment"
                rows={4}
                value={strikeOffComments[selectedRecord.id] || ''}
                onChange={(e) => handleCommentChange(selectedRecord.id, e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default StrikeOffApproval;
