import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermissions } from '../../hooks/usePermissions';
import UserForm from './UserForm';

const { Title } = Typography;

const UserMaster = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { canAdd, canEdit, canDelete } = usePermissions();

  const columns = [
    {
      title: 'User Name',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Admin User',
      dataIndex: 'adminUser',
      key: 'adminUser',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Concern',
      dataIndex: 'concernName',
      key: 'concernName',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure to delete this user?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    // API call to delete user
    console.log('Delete user:', id);
  };

  const handleFormSubmit = (values) => {
    // API call to save user
    console.log('Save user:', values);
    setModalVisible(false);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>User Master</Title>
        {canAdd() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add User
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <UserForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        initialValues={editingUser}
      />
    </Card>
  );
};

export default UserMaster;