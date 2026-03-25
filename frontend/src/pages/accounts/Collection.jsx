import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getFYRange } from '../../utils/helpers';
import { Card, Form, Input, Button, Space, Table, Modal, DatePicker, Typography, Select, InputNumber, Checkbox, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCollections, createCollection, updateCollection, deleteCollection, getPartyBalance } from '../../api/collection';
import { getParties } from '../../api/party';
import { getMastersByType } from '../../api/fabricInward';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const Collection = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [data, setData] = useState([]);
  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);
  const [currentMode, setCurrentMode] = useState('CASH');
  const { canAdd, canEdit, canDelete } = useMenuPermissions();
  const { selectedYear } = useSelector((state) => state.auth);
  const [concernData, setConcernData] = useState(null);

  useEffect(() => {
    loadConcernData();
  }, []);

  const loadConcernData = async () => {
    try {
      const { getConcerns } = await import('../../api/concern');
      const concernId = localStorage.getItem('selectedCompanyId');
      if (concernId) {
        const response = await getConcerns('', 1, 1000);
        const concern = response.data?.find(c => c.id === parseInt(concernId));
        setConcernData(concern || null);
      }
    } catch (error) {
      console.error('Error loading concern data:', error);
    }
  };

  const fyRange = getFYRange(selectedYear, concernData);
  const disabledDate = (current) => {
    if (!fyRange || !current) return false;
    return current < dayjs(fyRange.startDate).startOf('day') || current > dayjs(fyRange.endDate).endOf('day');
  };

  useEffect(() => {
    loadData();
    loadParties();
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await getMastersByType('Bank');
      setBanks(response || []);
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

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
      const response = await getCollections();
      setData(response || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartyChange = async (partyId) => {
    if (!partyId) {
      form.setFieldsValue({ balanceAmount: 0 });
      return;
    }
    try {
      const response = await getPartyBalance(partyId);
      form.setFieldsValue({ balanceAmount: response.balance });
    } catch (error) {
      console.error('Error fetching balance:', error);
      message.error('Failed to fetch party balance');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { balanceAmount, ...rest } = values;
      const submitData = {
        ...rest,
        refDate: values.refDate ? values.refDate.toISOString() : dayjs().toISOString(),
        chequeDate: values.chequeDate ? values.chequeDate.toISOString() : null,
      };

      if (values.mode !== 'CHEQUE') {
        submitData.chequeReturn = false;
        submitData.returnCharges = 0;
      }

      if (editingRecord) {
        await updateCollection(editingRecord.id, submitData);
        message.success('Updated successfully');
      } else {
        await createCollection(submitData);
        message.success('Created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      loadData();
    } catch (error) {
      console.error('Error saving collection:', error);
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to save record' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setCurrentMode(record.mode);
    form.setFieldsValue({
      ...record,
      refDate: dayjs(record.refDate),
      chequeDate: record.chequeDate ? dayjs(record.chequeDate) : null,
    });
    handlePartyChange(record.partyId);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Collection',
      content: 'Are you sure you want to delete this collection record?',
      onOk: async () => {
        try {
          await deleteCollection(id);
          message.success('Deleted successfully');
          loadData();
        } catch (error) {
          console.error('Error deleting record:', error);
        }
      }
    });
  };

  const showBankDetails = ['CHEQUE', 'NEFT/RTGS'].includes(currentMode);

  const columns = [
    {
      title: 'Sl. No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Ref No',
      dataIndex: 'refNo',
      key: 'refNo',
      width: 100,
    },
    {
      title: 'Ref Date',
      dataIndex: 'refDate',
      key: 'refDate',
      width: 100,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Party',
      dataIndex: ['party', 'partyName'],
      key: 'party',
      width: 150,
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      align: 'right',
      render: (val) => parseFloat(val || 0).toFixed(2),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      minWidth: 150,
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
        .page-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #001529 !important;
          margin: 0 !important;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #001529;
          margin-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 4px;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="page-title">Collection</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingRecord(null);
            setCurrentMode('CASH');
            form.resetFields();
            form.setFieldsValue({ refDate: dayjs(), mode: 'CASH', amount: 0 });
            setIsModalVisible(true);
          }}
          disabled={!canAdd()}
        >
          Add Collection
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        size="small"
        loading={loading}
        className="compact-table"
        scroll={{ x: 800 }}
        pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
        }}
        bordered
      />

      <Modal
        title={editingRecord ? 'Edit Collection' : 'Add Collection'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ refDate: dayjs(), mode: 'CASH', amount: 0 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Form.Item label="Ref No" name="refNo" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Ref Date" name="refDate" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" showTime={{ format: 'hh:mm A' }} />
            </Form.Item>
            <Form.Item label="Mode" name="mode" rules={[{ required: true }]}>
              <Select onChange={(val) => setCurrentMode(val)}>
                <Option value="CASH">CASH</Option>
                <Option value="CHEQUE">CHEQUE</Option>
                <Option value="TDS">TDS</Option>
                <Option value="NEFT/RTGS">NEFT/RTGS</Option>
                <Option value="CREDIT">CREDIT</Option>
                <Option value="DEBIT">DEBIT</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Party" name="partyId" rules={[{ required: true }]}>
            <Select 
              showSearch 
              placeholder="Select Party" 
              optionFilterProp="children"
              onChange={handlePartyChange}
            >
              {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
            </Select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} precision={2} />
            </Form.Item>
            <Form.Item label="Balance Amount" name="balanceAmount">
              <InputNumber style={{ width: '100%' }} precision={2} disabled placeholder="Calculated/Ref Only" />
            </Form.Item>
          </div>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          {showBankDetails && (
            <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div className="section-title">Bank Details:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Form.Item label="Bank" name="bankName">
                  <Select showSearch placeholder="Select/Enter Bank" allowClear>
                    {banks.map(b => <Option key={b.id} value={b.masterName}>{b.masterName}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item label="Our Bank" name="ourBankName">
                   <Select showSearch placeholder="Select Our Bank" allowClear>
                    {banks.map(b => <Option key={b.id} value={b.masterName}>{b.masterName}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item label="Cheque No" name="chequeNo">
                  <Input />
                </Form.Item>
                <Form.Item label="Date" name="chequeDate">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
                {currentMode === 'CHEQUE' && (
                  <>
                    <Form.Item name="chequeReturn" valuePropName="checked">
                      <Checkbox>Cheque Return</Checkbox>
                    </Form.Item>
                    <Form.Item label="Return Charges" name="returnCharges">
                      <InputNumber style={{ width: '100%' }} precision={2} />
                    </Form.Item>
                  </>
                )}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default Collection;
