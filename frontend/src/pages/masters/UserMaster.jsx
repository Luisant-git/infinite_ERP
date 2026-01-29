import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Table, Modal, Checkbox, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, getUserById } from '../../api/user';
import { getConcerns } from '../../api/concern';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const UserMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadUsers();
    loadConcerns();
  }, []);

  const loadConcerns = async () => {
    try {
      const response = await getConcerns('', 1, 100);
      setConcerns(response.data || response);
    } catch (error) {
      console.error('Error loading concerns:', error);
    }
  };

  const loadUsers = async (page = 1, pageSize = 10, search = searchText) => {
    try {
      const response = await getUsers(search, page, pageSize);
      setUsers(response.data || response);
      
      if (response.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadUsers(1, pagination.pageSize, value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
      } else {
        await createUser(values);
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (record) => {
    try {
      const userData = await getUserById(record.id);
      setEditingUser(userData);
      setIsAdminUser(userData.adminUser);
      setSelectedConcern(userData.concernIds || []);
      form.setFieldsValue({
        username: userData.username,
        password: '********',
        adminUser: userData.adminUser,
        dcClose: userData.dcClose,
        isActive: userData.isActive,
        concernIds: userData.concernIds || []
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
    setIsAdminUser(false);
    setSelectedConcern(null);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'User Name',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Admin User',
      dataIndex: 'adminUser',
      key: 'adminUser',
      render: (adminUser) => adminUser ? 'Yes' : 'No',
    },
    {
      title: 'DC Close',
      dataIndex: 'dcClose',
      key: 'dcClose',
      render: (dcClose) => dcClose ? 'Yes' : 'No',
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
          {canEdit('user_master') && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />}
          {canDelete('user_master') && <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>User Master</Title>
        <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search users" 
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
            disabled={!canAdd('user_master')}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadUsers(page, pageSize),
          onShowSizeChange: (current, size) => loadUsers(1, size)
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
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
            OK
          </Button>,
        ]}
        width={450}
        bodyStyle={{ paddingBottom: '16px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
          style={{ marginTop: '8px' }}
        >
          <Form.Item
            label="User Name"
            name="username"
            rules={[{ required: true, message: 'Please input user name!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input placeholder="Enter user name" disabled={editingUser} />
          </Form.Item>
          
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: !editingUser, message: 'Please input password!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input.Password placeholder="Enter password" disabled={editingUser} />
          </Form.Item>

          {!isAdminUser && (
            <Form.Item
              label="Concern"
              name="concernIds"
              style={{ marginBottom: '16px' }}
            >
              <Select 
                mode="multiple"
                placeholder="Select concerns" 
                allowClear
                onChange={(value) => {
                  setSelectedConcern(value && value.length > 0 ? value : null);
                  if (value && value.length > 0) {
                    form.setFieldsValue({ adminUser: false });
                  }
                }}
              >
                {concerns.map(concern => (
                  <Option key={concern.id} value={concern.id}>
                    {concern.partyName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <div style={{ display: 'flex', gap: 16, marginBottom: '0px' }}>
            {!selectedConcern && (
              <Form.Item name="adminUser" valuePropName="checked">
                <Checkbox 
                  onChange={(e) => {
                    setIsAdminUser(e.target.checked);
                    if (e.target.checked) {
                      form.setFieldsValue({ concernIds: [] });
                      setSelectedConcern(null);
                    }
                  }}
                >
                  Admin User
                </Checkbox>
              </Form.Item>
            )}
            
            <Form.Item name="dcClose" valuePropName="checked">
              <Checkbox>DC Close</Checkbox>
            </Form.Item>
            
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserMaster;