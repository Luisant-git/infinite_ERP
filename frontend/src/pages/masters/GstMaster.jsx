import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Modal, InputNumber, message, Space, Select, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { getGstMasters, createGstMaster, updateGstMaster, deleteGstMaster } from '../../api/gstMaster';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Option } = Select;

const GstMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [gstMasters, setGstMasters] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await getGstMasters('', 1, 100);
      setGstMasters(response.data || []);
    } catch (error) {
      console.error('Error loading GST masters:', error);
    }
  };

  const handleNew = () => {
    form.resetFields();
    form.setFieldsValue({
      isActive: 1,
      isLoadDefault: 0
    });
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      taxPercent: Number(record.taxPercent)
    });
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete GST Master',
      content: 'Are you sure you want to delete this record?',
      onOk: async () => {
        try {
          await deleteGstMaster(id);
          message.success('Deleted successfully');
          loadData();
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

      // Check for duplicate Tax Name
      const normalizedTaxName = values.taxName.trim().toLowerCase();
      const duplicate = gstMasters.find(g => 
        g.taxName.trim().toLowerCase() === normalizedTaxName && g.id !== editingId
      );
      if (duplicate) {
        Modal.error({
          title: 'Duplicate Tax Name',
          content: 'A GST with this tax name already exists!',
        });
        setLoading(false);
        return;
      }

      const data = {
        ...values,
        isActive: values.isActive ? 1 : 0,
        isLoadDefault: values.isLoadDefault ? 1 : 0
      };

      if (editingId) {
        await updateGstMaster(editingId, data);
        message.success('Updated successfully');
      } else {
        await createGstMaster(data);
        message.success('Created successfully');
      }
      
      setIsFormVisible(false);
      loadData();
    } catch (error) {
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => index + 1,
    },
    { title: 'Tax Name', dataIndex: 'taxName', width: 200 },
    { 
      title: 'Tax Percent', 
      dataIndex: 'taxPercent', 
      width: 120,
      render: (val) => Number(val).toFixed(2)
    },
    { title: 'Tax Type', dataIndex: 'taxType', width: 100 },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (val) => val === 1 ? 'Yes' : 'No'
    },
    {
      title: 'Load Default',
      dataIndex: 'isLoadDefault',
      width: 120,
      render: (val) => val === 1 ? 'Yes' : 'No'
    },
    {
      title: 'Actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {canEdit('gst_master') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          )}
          {canDelete('gst_master') && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          )}
        </Space>
      )
    }
  ];

  const filteredData = gstMasters.filter(item => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      item.taxName?.toLowerCase().includes(search) ||
      item.taxType?.toLowerCase().includes(search)
    );
  });

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
        }
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .page-header .ant-space { width: 100% !important; }
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>GST Master</h3>
        {!isFormVisible && (
          <Space>
            <Input 
              placeholder="Search GST" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, height: 32 }}
              size="small"
              allowClear
              autoComplete="off"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew} disabled={!canAdd('gst_master')}>New</Button>
          </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          size="small" 
          className="compact-table"
          scroll={{ x: 800 }}
        />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <div style={{ maxWidth: 600 }}>
            <Form.Item label="Tax Name" name="taxName" rules={[{ required: true, message: 'Tax Name is required' }]} style={{ marginBottom: 8 }}>
              <Input style={{ height: '32px' }} size="middle" autoComplete="off" />
            </Form.Item>

            <Form.Item label="Tax Percent" name="taxPercent" rules={[{ required: true, message: 'Tax Percent is required' }]} style={{ marginBottom: 8 }}>
              <InputNumber 
                style={{ width: '100%', height: '32px' }} 
                precision={2} 
                min={0} 
                max={100} 
                size="middle" 
                controls={false}
                parser={value => value.replace(/[^0-9.]/g, '')}
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item label="Type" name="taxType" rules={[{ required: true, message: 'Tax Type is required' }]} style={{ marginBottom: 8 }}>
              <Select style={{ height: '32px' }} size="middle">
                <Option value="SGST">SGST</Option>
                <Option value="CGST">CGST</Option>
                <Option value="IGST">IGST</Option>
              </Select>
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>Active Item</Checkbox>
            </Form.Item>

            <Form.Item name="isLoadDefault" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>Load Default</Checkbox>
            </Form.Item>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button icon={<CloseOutlined />} onClick={() => setIsFormVisible(false)}>Cancel</Button>
                <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit}>Save</Button>
              </Space>
            </div>
          </div>
        </Form>
      )}
    </Card>
  );
};

export default GstMaster;
