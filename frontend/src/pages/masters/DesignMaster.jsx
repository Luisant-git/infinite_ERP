import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Table, Modal, Typography, Select, InputNumber, DatePicker, Row, Col, Upload, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { getDesigns, createDesign, updateDesign, deleteDesign } from '../../api/design';
import { getParties } from '../../api/party';
import { uploadImage, deleteFile } from '../../api/upload';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DesignMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [designs, setDesigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadDesigns();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await getParties('', 1, 1000);
      setCustomers(response.data || response);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadDesigns = async (page = 1, pageSize = 10, search = searchText) => {
    try {
      const response = await getDesigns(search, page, pageSize);
      setDesigns(response.data || response);
      
      if (response.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadDesigns(1, pagination.pageSize, value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (!editingDesign) {
        const normalizedDesignNo = values.designNo.replace(/\s+/g, '').toLowerCase();
        const duplicateNo = designs.find(d => 
          d.designNo.replace(/\s+/g, '').toLowerCase() === normalizedDesignNo
        );
        if (duplicateNo) {
          Modal.error({
            title: 'Duplicate Design',
            content: 'A design with this number already exists!',
          });
          setLoading(false);
          return;
        }

        const normalizedDesignName = values.designName.trim().replace(/\s+/g, '').toLowerCase();
        const duplicateName = designs.find(d => 
          d.designName.trim().replace(/\s+/g, '').toLowerCase() === normalizedDesignName
        );
        if (duplicateName) {
          Modal.error({
            title: 'Duplicate Design',
            content: 'A design with this name already exists!',
          });
          setLoading(false);
          return;
        }
      }

      const formData = {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        imagePath: fileList.length > 0 ? fileList[0].url : null,
      };

      if (editingDesign) {
        await updateDesign(editingDesign.id, formData);
      } else {
        await createDesign(formData);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingDesign(null);
      setFileList([]);
      loadDesigns();
    } catch (error) {
      console.error('Error saving design:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save design';
      Modal.error({
        title: errorMessage.includes('already exists') ? 'Duplicate Design' : 'Error',
        content: errorMessage.includes('already exists') ? errorMessage : errorMessage,
      });
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
          <p><strong>Ref No:</strong> {record.refNo || 'N/A'}</p>
          <p><strong>Date:</strong> {dayjs(record.date).format('DD/MM/YYYY')}</p>
          <p><strong>Customer:</strong> {record.customer?.partyName || 'N/A'}</p>
          <p><strong>Design No:</strong> {record.designNo}</p>
          <p><strong>Design Name:</strong> {record.designName}</p>
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

  const handleEdit = (record) => {
    setEditingDesign(record);
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : dayjs(),
    });
    if (record.imagePath) {
      setFileList([{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: record.imagePath,
      }]);
    }
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDesign(id);
      loadDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDesign(null);
    setFileList([]);
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const response = await uploadImage(file);
      setFileList([{
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: response.url,
      }]);
      message.success('Image uploaded successfully');
      onSuccess(response, file);
    } catch (error) {
      message.error('Failed to upload image');
      onError(error);
    }
  };

  const handleRemove = async (file) => {
    if (file.url) {
      try {
        await deleteFile(file.url);
        message.success('Image removed successfully');
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
    setFileList([]);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Design No',
      dataIndex: 'designNo',
      key: 'designNo',
    },
    {
      title: 'Design Name',
      dataIndex: 'designName',
      key: 'designName',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'partyName'],
      key: 'customer',
    },
    {
      title: 'Type of Print',
      dataIndex: 'typeOfPrint',
      key: 'typeOfPrint',
    },
    {
      title: 'Colors',
      dataIndex: 'noOfColor',
      key: 'noOfColor',
    },
    {
      title: 'Commercial Rate',
      dataIndex: 'commercialRate',
      key: 'commercialRate',
      render: (rate) => `₹${rate}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          {canEdit('design_master') && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />}
          {canDelete('design_master') && <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Design Master</Title>
        <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search designs" 
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
            disabled={!canAdd('design_master')}
          >
            Add Design
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={designs} 
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadDesigns(page, pageSize),
          onShowSizeChange: (current, size) => loadDesigns(1, size)
        }}
      />

      <Modal
        title={editingDesign ? 'Edit Design' : 'Add New Print Design'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={() => form.submit()}
          >
            {editingDesign ? 'Update' : 'Confirm Design Creation'}
          </Button>,
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            date: dayjs(),
            noOfColor: 1,
            noOfPrint: 1,
            commercialRate: 0,
            isActive: true
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="# Ref No" name="refNo">
                    <Input placeholder="External Reference" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Date" name="date">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Customer *" name="customerId" rules={[{ required: true, message: 'Please select customer!' }]}>
                    <Select placeholder="Select Customer" showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                      {customers.map(customer => (
                        <Option key={customer.id} value={customer.id}>{customer.partyName}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Design No" name="designNo" rules={[{ required: true, message: 'Please input design number!' }]}>
                    <Input placeholder="e.g. PRINT-2024-001" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Design Name *" name="designName" rules={[{ required: true, message: 'Please input design name!' }]}>
                    <Input placeholder="e.g. Mandala Blue Pattern" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Type of Print" name="typeOfPrint">
                    <Select placeholder="Select">
                      <Option value="Screen Print">Screen Print</Option>
                      <Option value="Digital Print">Digital Print</Option>
                      <Option value="Block Print">Block Print</Option>
                      <Option value="Rotary Print">Rotary Print</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="₹ Commercial Rate" name="commercialRate">
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }} 
                      precision={2}
                      keyboard={true}
                      controls={false}
                      parser={value => value.replace(/[^0-9.]/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="No of Color" name="noOfColor">
                    <InputNumber 
                      min={1} 
                      style={{ width: '100%' }} 
                      precision={0}
                      keyboard={true}
                      controls={false}
                      parser={value => value.replace(/[^0-9]/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="No of Print" name="noOfPrint">
                    <InputNumber 
                      min={1} 
                      style={{ width: '100%' }} 
                      precision={0}
                      keyboard={true}
                      controls={false}
                      parser={value => value.replace(/[^0-9]/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Description" name="description">
                    <TextArea rows={3} placeholder="Enter technical specifications or print requirements..." />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Remarks" name="remarks">
                    <TextArea rows={3} placeholder="Additional notes or internal instructions..." />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={8}>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '16px', 
                background: '#fafafa'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  marginBottom: '12px',
                  color: '#595959'
                }}>
                  DESIGN ARTWORK
                </div>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    customRequest={handleUpload}
                    onRemove={handleRemove}
                    maxCount={1}
                    accept="image/*"
                    style={{ width: '100%' }}
                  >
                    {fileList.length === 0 && (
                      <div style={{ padding: '20px 0' }}>
                        <UploadOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />
                        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>Upload Master Image</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>PNG, JPG (MAX 5MB)</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default DesignMaster;
