import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Table, Modal, Checkbox, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPartyTypes, createPartyType, updatePartyType, deletePartyType } from '../../api/partyType';

const { Title } = Typography;

const PartyTypeMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPartyType, setEditingPartyType] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [partyTypes, setPartyTypes] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadPartyTypes();
  }, []);

  const loadPartyTypes = async (page = 1, pageSize = 10, search = searchText) => {
    try {
      const response = await getPartyTypes(search, page, pageSize);
      setPartyTypes(response.data || response);
      
      if (response.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      }
    } catch (error) {
      console.error('Error loading party types:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadPartyTypes(1, pagination.pageSize, value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingPartyType) {
        await updatePartyType(editingPartyType.id, values);
      } else {
        await createPartyType(values);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingPartyType(null);
      loadPartyTypes();
    } catch (error) {
      console.error('Error saving party type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingPartyType(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deletePartyType(id);
      loadPartyTypes();
    } catch (error) {
      console.error('Error deleting party type:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingPartyType(null);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Party Type Name',
      dataIndex: 'partyTypeName',
      key: 'partyTypeName',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => isActive ? 'Active' : 'Inactive',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Party Type Master</Title>
        <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search party types" 
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
          >
            Add Party Type
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={partyTypes} 
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadPartyTypes(page, pageSize),
          onShowSizeChange: (current, size) => loadPartyTypes(1, size)
        }}
      />

      <Modal
        title={editingPartyType ? 'Edit Party Type' : 'Add Party Type'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="clear" onClick={() => form.resetFields()}>
            Clear
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={() => form.submit()}
          >
            Save
          </Button>,
        ]}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            label="Party Type Name"
            name="partyTypeName"
            rules={[{ required: true, message: 'Please input party type name!' }]}
          >
            <Input placeholder="Enter party type name" maxLength={50} />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartyTypeMaster;