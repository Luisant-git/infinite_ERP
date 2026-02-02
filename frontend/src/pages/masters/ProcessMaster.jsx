import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Table, Modal, Checkbox, Typography, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProcesses, createProcess, updateProcess, deleteProcess } from '../../api/process';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const ProcessMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [processes, setProcesses] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  const categories = ['COMPACTING', 'WASHING', 'PRINTING'];

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async (page = 1, pageSize = 10, search = searchText) => {
    try {
      const response = await getProcesses(search, page, pageSize);
      setProcesses(response.data || response);
      
      if (response.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      }
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadProcesses(1, pagination.pageSize, value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const trimmedName = values.processName?.trim().replace(/\s+/g, ' ');
      
      if (!editingProcess) {
        const duplicate = processes.find(p => 
          p.processName.trim().replace(/\s+/g, ' ').toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
          Modal.error({
            title: 'Duplicate Process',
            content: 'A process with this name already exists!',
          });
          setLoading(false);
          return;
        }
      }

      const submitData = {
        ...values,
        processName: trimmedName,
        tallyName: values.tallyName?.trim()
      };

      if (editingProcess) {
        await updateProcess(editingProcess.id, submitData);
      } else {
        await createProcess(submitData);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingProcess(null);
      loadProcesses();
    } catch (error) {
      console.error('Error saving process:', error);
      Modal.error({
        title: 'Error',
        content: error.response?.data?.message || 'Failed to save process',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingProcess(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Process',
      content: 'Are you sure you want to delete this process?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteProcess(id);
          loadProcesses();
        } catch (error) {
          console.error('Error deleting process:', error);
        }
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingProcess(null);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Process Name',
      dataIndex: 'processName',
      key: 'processName',
    },
    {
      title: 'Tally Name',
      dataIndex: 'tallyName',
      key: 'tallyName',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Production Excess (%)',
      dataIndex: 'productionExcess',
      key: 'productionExcess',
      render: (val) => val || 0,
    },
    {
      title: 'Not Required Rate',
      dataIndex: 'notRequiredRate',
      key: 'notRequiredRate',
      render: (val) => <Checkbox checked={val} disabled />,
    },
    {
      title: 'Wet Condition',
      dataIndex: 'wetCondition',
      key: 'wetCondition',
      render: (val) => <Checkbox checked={val} disabled />,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val) => <Checkbox checked={val} disabled />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Process Master</Title>
        <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search processes" 
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
            Add Process
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={processes} 
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadProcesses(page, pageSize),
          onShowSizeChange: (current, size) => loadProcesses(1, size)
        }}
      />

      <Modal
        title={editingProcess ? 'Edit Process' : 'Add Process'}
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
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, productionExcess: 0, notRequiredRate: false, wetCondition: false }}
        >
          <Form.Item
            label="Process Name"
            name="processName"
            rules={[{ required: true, message: 'Please input process name!' }]}
          >
            <Input placeholder="Enter process name" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="Tally Name"
            name="tallyName"
          >
            <Input placeholder="Enter tally name" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category!' }]}
          >
            <Select placeholder="Select category">
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Production Excess (%)"
            name="productionExcess"
            rules={[{ type: 'number', message: 'Please enter a valid number!' }]}
          >
            <InputNumber 
              placeholder="Enter production excess" 
              style={{ width: '100%' }}
              precision={2}
              keyboard={true}
              controls={false}
              parser={value => value.replace(/[^0-9.]/g, '')}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16, marginBottom: '0px' }}>
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>

            <Form.Item name="notRequiredRate" valuePropName="checked">
              <Checkbox>Not Required Rate</Checkbox>
            </Form.Item>

            <Form.Item name="wetCondition" valuePropName="checked">
              <Checkbox>Wet Condition</Checkbox>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProcessMaster;
