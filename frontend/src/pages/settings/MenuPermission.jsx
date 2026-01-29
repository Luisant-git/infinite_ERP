import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, Table, Checkbox, Typography, message } from 'antd';
import { getUsers, getMenus, getUserPermissions, updatePermissions } from '../../api/menuPermission';

const { Title } = Typography;
const { Option } = Select;

const MenuPermission = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    loadUsers();
    loadMenus();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMenus = async () => {
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  };

  const handleUserChange = async (userId) => {
    setSelectedUser(userId);
    try {
      const userPermissions = await getUserPermissions(userId);
      const permissionMap = {};
      userPermissions.forEach(p => {
        permissionMap[p.menuName] = p;
      });

      const formattedPermissions = menus.map(menu => ({
        menuName: menu.key,
        menuLabel: menu.name,
        canView: permissionMap[menu.key]?.canView || false,
        canAdd: permissionMap[menu.key]?.canAdd || false,
        canEdit: permissionMap[menu.key]?.canEdit || false,
        canDelete: permissionMap[menu.key]?.canDelete || false
      }));

      setPermissions(formattedPermissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const handlePermissionChange = (menuName, permission, checked) => {
    setPermissions(prev => prev.map(p => 
      p.menuName === menuName ? { ...p, [permission]: checked } : p
    ));
  };

  const handleSave = async () => {
    if (!selectedUser) {
      message.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const permissionsToSave = permissions.map(p => ({
        userId: selectedUser,
        menuName: p.menuName,
        canView: p.canView,
        canAdd: p.canAdd,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      }));

      await updatePermissions(permissionsToSave);
      message.success('Permissions updated successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      message.error('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Menu',
      dataIndex: 'menuLabel',
      key: 'menuLabel',
    },
    {
      title: 'View',
      key: 'canView',
      render: (_, record) => (
        <Checkbox
          checked={record.canView}
          onChange={(e) => handlePermissionChange(record.menuName, 'canView', e.target.checked)}
        />
      ),
    },
    {
      title: 'Add',
      key: 'canAdd',
      render: (_, record) => (
        <Checkbox
          checked={record.canAdd}
          onChange={(e) => handlePermissionChange(record.menuName, 'canAdd', e.target.checked)}
        />
      ),
    },
    {
      title: 'Edit',
      key: 'canEdit',
      render: (_, record) => (
        <Checkbox
          checked={record.canEdit}
          onChange={(e) => handlePermissionChange(record.menuName, 'canEdit', e.target.checked)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'canDelete',
      render: (_, record) => (
        <Checkbox
          checked={record.canDelete}
          onChange={(e) => handlePermissionChange(record.menuName, 'canDelete', e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Menu Permission</Title>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item label="Select User" style={{ width: 300 }}>
          <Select
            placeholder="Choose user"
            onChange={handleUserChange}
            value={selectedUser}
          >
            {users.filter(user => !user.adminUser).map(user => (
              <Option key={user.id} value={user.id}>
                {user.username}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      {selectedUser && (
        <>
          <Table
            columns={columns}
            dataSource={permissions}
            rowKey="menuName"
            pagination={false}
            style={{ marginBottom: 16 }}
          />
          
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
          >
            Save Permissions
          </Button>
        </>
      )}
    </Card>
  );
};

export default MenuPermission;