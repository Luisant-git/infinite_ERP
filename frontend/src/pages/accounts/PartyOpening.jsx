import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Table, Modal, DatePicker, Typography, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPartyOpenings, createPartyOpening, updatePartyOpening, deletePartyOpening } from '../../api/partyOpening';
import { getParties } from '../../api/party';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const PartyOpening = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [data, setData] = useState([]);
  const [parties, setParties] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadData();
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      const response = await getParties('', 1, 1000);
      const allParties = response.data || response;
      setParties(allParties.filter(p => p.partyTypes?.some(pt =>
        pt.partyType.partyTypeName.toLowerCase() === 'customer'
      )));
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getPartyOpenings();
      setData(response || []);
    } catch (error) {
      console.error('Error loading party openings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const submitData = {
        ...values,
        billDate: values.billDate ? values.billDate.toISOString() : dayjs().toISOString(),
        debitAmount: values.debitAmount || 0,
        creditAmount: values.creditAmount || 0,
      };

      if (editingRecord) {
        await updatePartyOpening(editingRecord.id, submitData);
      } else {
        await createPartyOpening(submitData);
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      loadData();
    } catch (error) {
      console.error('Error saving party opening:', error);
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to save record' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      partyId: record.partyId,
      billNo: record.billNo,
      billDate: dayjs(record.billDate),
      debitAmount: record.debitAmount,
      creditAmount: record.creditAmount,
      remarks: record.remarks,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Record',
      content: 'Are you sure you want to delete this opening balance?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deletePartyOpening(id);
          loadData();
        } catch (error) {
          console.error('Error deleting record:', error);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Sl. No',
      key: 'sno',
      width: 60,
      render: (_, record, index) => index + 1,
    },
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 100,
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      width: 100,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Party',
      dataIndex: ['party', 'partyName'],
      key: 'party',
      width: 130,
    },
    {
      title: 'Bill Amount (Debit)',
      dataIndex: 'debitAmount',
      key: 'debitAmount',
      width: 150,
      align: 'right',
      render: (val) => parseFloat(val || 0).toFixed(2),
    },
    {
      title: 'Advance (Credit)',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      width: 130,
      align: 'right',
      render: (val) => parseFloat(val || 0).toFixed(2),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      minWidth: 200,
    },
    {
      title: 'Action',
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {canEdit() && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />}
          {canDelete() && (
            <Button
              type="text"
              size="small"
              icon={<span style={{ color: 'red', fontWeight: 'bold', border: '1px solid red', padding: '0 4px', borderRadius: '4px' }}>X</span>}
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th,
        .compact-table .ant-table-thead .ant-table-cell {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          height: auto !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
        .compact-table .ant-btn-text {
          padding: 0 4px !important;
          height: 24px !important;
          min-width: 24px !important;
        }
        .page-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #001529 !important;
          margin: 0 !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="page-title">Party Opening</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            form.setFieldsValue({ billNo: '', billDate: dayjs() });
            setIsModalVisible(true);
          }}
          disabled={!canAdd()}
        >
          Add Opening
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="small"
        loading={loading}
        className="compact-table"
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        bordered
      />

      <Modal
        title={editingRecord ? 'Edit Party Opening' : 'Add Party Opening'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ billNo: '', billDate: dayjs(), debitAmount: 0, creditAmount: 0 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Bill No" name="billNo">
              <Input />
            </Form.Item>
            <Form.Item label="Bill Date" name="billDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item label="Party" name="partyId" rules={[{ required: true, message: 'Please select party' }]}>
            <Select
              showSearch
              placeholder="Select Party"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Debit Amount" name="debitAmount">
              <InputNumber style={{ width: '100%' }} precision={2} />
            </Form.Item>
            <Form.Item label="Credit Amount" name="creditAmount">
              <InputNumber style={{ width: '100%' }} precision={2} />
            </Form.Item>
          </div>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartyOpening;
