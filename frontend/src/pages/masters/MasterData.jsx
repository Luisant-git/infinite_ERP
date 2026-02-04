import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Modal, message, Space, Tabs, Checkbox, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMastersByType, createMaster, updateMaster, deleteMaster } from '../../api/fabricInward';

const { TabPane } = Tabs;
const { Title } = Typography;

const MasterData = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [currentType, setCurrentType] = useState('Fabric');
  
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [dias, setDias] = useState([]);
  const [uoms, setUoms] = useState([]);

  useEffect(() => {
    loadAllMasters();
  }, []);

  const loadAllMasters = async () => {
    try {
      const [fabricsRes, colorsRes, diasRes, uomsRes] = await Promise.all([
        getMastersByType('Fabric'),
        getMastersByType('Color'),
        getMastersByType('Dia'),
        getMastersByType('UOM')
      ]);
      setFabrics(fabricsRes || []);
      setColors(colorsRes || []);
      setDias(diasRes || []);
      setUoms(uomsRes || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const handleAdd = (type) => {
    setCurrentType(type);
    setEditingMaster(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record, type) => {
    setCurrentType(type);
    setEditingMaster(record);
    form.setFieldsValue({
      masterName: record.masterName
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Master',
      content: 'Are you sure you want to delete this?',
      onOk: async () => {
        try {
          await deleteMaster(id);
          message.success('Deleted successfully');
          loadAllMasters();
        } catch (error) {
          message.error('Failed to delete');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingMaster) {
        await updateMaster(editingMaster.id, {
          masterName: values.masterName
        });
        message.success('Updated successfully');
      } else {
        await createMaster({
          masterType: currentType,
          masterName: values.masterName
        });
        message.success('Created successfully');
      }

      setIsModalVisible(false);
      loadAllMasters();
    } catch (error) {
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const columns = (type) => [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => index + 1,
    },
    { title: 'Name', dataIndex: 'masterName', key: 'masterName', width: 300 },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 100, render: (val) => val ? 'Active' : 'Inactive' },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record, type)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
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
        .compact-table .ant-space-item {
          line-height: 1 !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Master Data Management</Title>
      </div>
      <Tabs defaultActiveKey="Fabric">
        <TabPane tab="Fabric" key="Fabric">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('Fabric')} style={{ marginBottom: 16 }}>
            Add Fabric
          </Button>
          <Table columns={columns('Fabric')} dataSource={fabrics} rowKey="id" size="small" className="compact-table" />
        </TabPane>
        <TabPane tab="Color" key="Color">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('Color')} style={{ marginBottom: 16 }}>
            Add Color
          </Button>
          <Table columns={columns('Color')} dataSource={colors} rowKey="id" size="small" className="compact-table" />
        </TabPane>
        <TabPane tab="Dia" key="Dia">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('Dia')} style={{ marginBottom: 16 }}>
            Add Dia
          </Button>
          <Table columns={columns('Dia')} dataSource={dias} rowKey="id" size="small" className="compact-table" />
        </TabPane>
        <TabPane tab="UOM" key="UOM">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('UOM')} style={{ marginBottom: 16 }}>
            Add UOM
          </Button>
          <Table columns={columns('UOM')} dataSource={uoms} rowKey="id" size="small" className="compact-table" />
        </TabPane>
      </Tabs>

      <Modal
        title={`${editingMaster ? 'Edit' : 'Add'} ${currentType}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>Save</Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={`${currentType} Name`}
            name="masterName"
            rules={[{ required: true, message: 'Please input name!' }]}
          >
            <Input placeholder={`Enter ${currentType.toLowerCase()} name`} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MasterData;
