import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getPartyScreenRates,
  createPartyScreenRate,
  updatePartyScreenRate,
  deletePartyScreenRate,
} from '../../api/partyScreenRate';
import { getParties } from '../../api/party';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const PartyScreenRate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [parties, setParties] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState('');

  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadData();
    loadParties();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getPartyScreenRates(searchText, 1, 1000);
      setData(response.data || []);
    } catch (error) {
      message.error('Failed to load party screen rates');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParties = async () => {
    try {
      const response = await getParties('', 1, 1000);
      const allParties = response.data || [];
      setParties(
        allParties.filter((p) =>
          p.partyTypes?.some(
            (pt) => pt.partyType.partyTypeName.toLowerCase() === 'customer'
          )
        )
      );
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadData();
  };

  const handleNew = () => {
    if (!canAdd('party_screen_rate')) {
      message.warning('You do not have permission to add');
      return;
    }
    form.resetFields();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    if (!canEdit('party_screen_rate')) {
      message.warning('You do not have permission to edit');
      return;
    }
    form.setFieldsValue({
      partyId: record.partyId,
      screenRate: Number(record.screenRate),
    });
    setEditingId(record.id);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    if (!canDelete('party_screen_rate')) {
      message.warning('You do not have permission to delete');
      return;
    }
    Modal.confirm({
      title: 'Delete Party Screen Rate',
      content: 'Are you sure you want to delete this?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deletePartyScreenRate(id);
          message.success('Deleted successfully');
          loadData();
        } catch (error) {
          message.error('Failed to delete');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingId) {
        await updatePartyScreenRate(editingId, values);
        message.success('Updated successfully');
      } else {
        await createPartyScreenRate(values);
        message.success('Created successfully');
      }

      setIsModalVisible(false);
      loadData();
    } catch (error) {
      if (error.response?.status === 400) {
        message.error('Party screen rate already exists for this party');
      } else {
        message.error('Failed to save');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => index + 1,
    },
    {
      title: 'Party Name',
      dataIndex: ['party', 'partyName'],
      key: 'partyName',
      width: 300,
    },
    {
      title: 'Screen Rate',
      dataIndex: 'screenRate',
      key: 'screenRate',
      width: 120,
      render: (rate) => `${Number(rate).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {canEdit('party_screen_rate') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#52c41a' }}
            />
          )}
          {canDelete('party_screen_rate') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const filteredData = data.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return item.party?.partyName?.toLowerCase().includes(search);
  });

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
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Screen Rate Fixing
        </Title>
        <Space style={{ width: 'auto' }}>
          <Input
            placeholder="Search party name"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNew}
            disabled={!canAdd('party_screen_rate')}
          >
            Add Screen Rate Fixing
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        size="small"
        className="compact-table"
        pagination={false}
      />

      <Modal
        title={editingId ? 'Edit Party Screen Rate' : 'Add Party Screen Rate'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Save
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="Party"
            name="partyId"
            rules={[{ required: true, message: 'Please select a party' }]}
          >
            <Select
              placeholder="Select Party"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              disabled={editingId}
            >
              {parties.map((party) => (
                <Option key={party.id} value={party.id}>
                  {party.partyName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Screen Rate"
            name="screenRate"
            rules={[
              { required: true, message: 'Please enter screen rate' },
              { type: 'number', min: 0, message: 'Screen rate must be positive' },
            ]}
          >
            <InputNumber
              placeholder="Enter screen rate"
              style={{ width: '100%' }}
              precision={2}
              min={0}
              addonBefore="₹"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartyScreenRate;