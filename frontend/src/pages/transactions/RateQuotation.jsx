import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getNextQuotNo, getRateQuotations, createRateQuotation, updateRateQuotation, deleteRateQuotation } from '../../api/rateQuotation';
import { getParties } from '../../api/party';
import { getProcesses } from '../../api/process';
import { uploadImage } from '../../api/upload';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RateQuotation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [parties, setParties] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [details, setDetails] = useState([]);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadData();
    loadMasters();
  }, []);

  const loadData = async () => {
    try {
      const response = await getRateQuotations('', 1, 100);
      setQuotations(response.data || []);
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, processesRes] = await Promise.all([
        getParties('', 1, 1000),
        getProcesses('', 1, 1000)
      ]);
      
      const customerParties = (partiesRes.data || []).filter(p => 
        p.partyTypes?.some(pt => pt.partyType.partyTypeName.toLowerCase() === 'customer')
      );
      setParties(customerParties);
      setProcesses(processesRes.data || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextQuotNo();
      form.resetFields();
      form.setFieldsValue({
        quotNo: response.quotNo,
        quotDate: dayjs()
      });
      setDetails([]);
      setFileList([]);
      setEditingId(null);
      setIsFormVisible(true);
    } catch (error) {
      message.error('Failed to generate quotation number');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      quotDate: dayjs(record.quotDate)
    });
    setDetails(record.details?.map(d => ({ ...d, key: d.id })) || []);
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Rate Quotation',
      content: 'Are you sure?',
      onOk: async () => {
        try {
          await deleteRateQuotation(id);
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

      const data = {
        ...values,
        quotDate: values.quotDate?.toISOString(),
        attachFile: fileList.length > 0 ? fileList[0].url : null,
        details: details.map(d => ({
          processId: d.processId,
          rate: Number(d.rate) || 0,
          confirmRate: Number(d.confirmRate) || 0,
          remarks: d.remarks
        }))
      };

      if (editingId) {
        await updateRateQuotation(editingId, data);
        message.success('Updated successfully');
      } else {
        await createRateQuotation(data);
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

  const handleAddDetail = () => {
    setDetails([...details, { 
      key: Date.now(),
      processId: null,
      rate: 0,
      confirmRate: 0,
      remarks: ''
    }]);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter(d => d.key !== key));
  };

  const handleDetailChange = (key, field, value) => {
    setDetails(details.map(d => d.key === key ? { ...d, [field]: value } : d));
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const response = await uploadImage(file);
      setFileList([{ uid: file.uid, name: file.name, status: 'done', url: response.url }]);
      message.success('File uploaded');
      onSuccess(response, file);
    } catch (error) {
      message.error('Upload failed');
      onError(error);
    }
  };

  const detailColumns = [
    {
      title: 'Process',
      dataIndex: 'processId',
      width: 200,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'processId', v)}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
        >
          {processes.map(p => <Option key={p.id} value={p.id}>{p.processName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 120,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'rate', v)} style={{ width: '100%' }} precision={2} />
      )
    },
    {
      title: 'Confirm Rate',
      dataIndex: 'confirmRate',
      width: 120,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'confirmRate', v)} style={{ width: '100%' }} precision={2} />
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 200,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'remarks', e.target.value)} />
      )
    },
    {
      title: 'Action',
      width: 60,
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(record.key)} />
      )
    }
  ];

  const listColumns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'Quot No', dataIndex: 'quotNo', width: 120 },
    { title: 'Quot Date', dataIndex: 'quotDate', width: 120, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'Party', dataIndex: ['party', 'partyName'], width: 180 },
    { title: 'Payment Terms', dataIndex: 'paymentTerms', width: 120 },
    {
      title: 'Actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>Rate Quotation</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>New</Button>
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={quotations} rowKey="id" size="small" className="compact-table" />
      ) : (
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item label="Quot No" name="quotNo">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Quot Date" name="quotDate">
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Party" name="partyId">
                <Select showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Payment Terms" name="paymentTerms">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Attach File">
                <Upload customRequest={handleUpload} fileList={fileList} onRemove={() => setFileList([])} accept="image/*,.pdf">
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Accepted: JPG, PNG, PDF (Max 5MB)</div>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Title level={5}>Process Details</Title>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddDetail}>Add Row</Button>
            </div>
            <Table 
              columns={detailColumns} 
              dataSource={details} 
              pagination={false} 
              scroll={{ x: 800, y: 400 }}
              size="small"
            />
          </div>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Form.Item label="Remarks / Terms" name="remarks">
                <TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setIsFormVisible(false)}>Cancel</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit}>Save</Button>
            </Space>
          </div>
        </Form>
      )}
    </Card>
  );
};

export default RateQuotation;
