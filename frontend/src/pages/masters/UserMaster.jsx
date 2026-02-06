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
  const [isMDUser, setIsMDUser] = useState(false);
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
      // Check for duplicate username
      if (!editingUser) {
        const duplicate = users.find(u => u.username.toLowerCase() === values.username.toLowerCase());
        if (duplicate) {
          Modal.error({
            title: 'Duplicate User',
            content: 'A user with this username already exists!',
          });
          setLoading(false);
          return;
        }
      }
      
      const submitData = {
        ...values,
        IsMD: values.IsMD ? 1 : 0
      };
      
      if (editingUser) {
        await updateUser(editingUser.id, submitData);
      } else {
        await createUser(submitData);
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      Modal.error({
        title: errorMessage.includes('already exists') ? 'Duplicate User' : 'Error',
        content: errorMessage.includes('already exists') ? 'A user with this username already exists!' : errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (record) => {
    try {
      const userData = await getUserById(record.id);
      setEditingUser(userData);
      setIsAdminUser(userData.adminUser);
      setIsMDUser(userData.IsMD === 1);
      setSelectedConcern(userData.concernIds || []);
      form.setFieldsValue({
        username: userData.username,
        password: '********',
        adminUser: userData.adminUser,
        IsMD: userData.IsMD === 1,
        isActive: userData.isActive,
        concernIds: userData.concernIds || [],
        canAdd: userData.canAdd,
        canEdit: userData.canEdit,
        canDelete: userData.canDelete
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteUser(id);
          loadUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
    setIsAdminUser(false);
    setIsMDUser(false);
    setSelectedConcern(null);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'User Name',
      dataIndex: 'username',
      key: 'username',
      width: 200,
    },
    {
      title: 'Admin',
      dataIndex: 'adminUser',
      key: 'adminUser',
      width: 80,
      render: (adminUser) => <Checkbox checked={adminUser} disabled />,
    },
    {
      title: 'MD',
      dataIndex: 'IsMD',
      key: 'IsMD',
      width: 80,
      render: (IsMD) => <Checkbox checked={IsMD === 1} disabled />,
    },
    {
      title: 'Add',
      dataIndex: 'canAdd',
      key: 'canAdd',
      width: 80,
      render: (canAdd) => <Checkbox checked={canAdd} disabled />,
    },
    {
      title: 'Edit',
      dataIndex: 'canEdit',
      key: 'canEdit',
      width: 80,
      render: (canEdit) => <Checkbox checked={canEdit} disabled />,
    },
    {
      title: 'Delete',
      dataIndex: 'canDelete',
      key: 'canDelete',
      width: 80,
      render: (canDelete) => <Checkbox checked={canDelete} disabled />,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => <Checkbox checked={isActive} disabled />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {canEdit() && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />}
          {canDelete() && <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />}
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
          // background: #fafafa !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          // font-weight: 600 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
        .compact-table .ant-space-item {
          line-height: 1 !important;
        }
      `}</style>
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
            disabled={!canAdd()}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id"
        size="small"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadUsers(page, pageSize),
          onShowSizeChange: (current, size) => loadUsers(1, size)
        }}
        className="compact-table"
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
          initialValues={{ isActive: true, canAdd: false, canEdit: false, canDelete: false, IsMD: 0 }}
          style={{ marginTop: '8px' }}
          autoComplete="off"
        >
          <Form.Item
            label="User Name"
            name="username"
            rules={[{ required: true, message: 'Please input user name!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input placeholder="Enter user name" autoComplete="off" />
          </Form.Item>
          
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: !editingUser, message: 'Please input password!' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input.Password placeholder="Enter password" autoComplete="new-password" />
          </Form.Item>

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
              }}
            >
              {concerns.map(concern => (
                <Option key={concern.id} value={concern.id}>
                  {concern.partyName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16, marginBottom: '0px' }}>
            <Form.Item name="adminUser" valuePropName="checked">
              <Checkbox 
                onChange={(e) => {
                  setIsAdminUser(e.target.checked);
                }}
              >
                Admin User
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="IsMD" valuePropName="checked">
              <Checkbox
                onChange={(e) => {
                  setIsMDUser(e.target.checked);
                  form.setFieldsValue({ IsMD: e.target.checked ? 1 : 0 });
                }}
              >
                MD User
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: '0px' }}>
            <Form.Item name="canAdd" valuePropName="checked">
              <Checkbox>Add</Checkbox>
            </Form.Item>
            
            <Form.Item name="canEdit" valuePropName="checked">
              <Checkbox>Edit</Checkbox>
            </Form.Item>
            
            <Form.Item name="canDelete" valuePropName="checked">
              <Checkbox>Delete</Checkbox>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserMaster;