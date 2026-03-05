import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space, Upload, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, UploadOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { getNextQuotNo, getRateQuotations, createRateQuotation, updateRateQuotation, deleteRateQuotation } from '../../api/rateQuotation';
import { getParties } from '../../api/party';
import { getProcesses } from '../../api/process';
import { getConcerns } from '../../api/concern';
import { getMastersByType } from '../../api/fabricInward';
import { uploadImage } from '../../api/upload';
import RateQuotationPrint from '../../components/prints/RateQuotationPrint';
import { useSelector } from 'react-redux';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

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
  const [concerns, setConcerns] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [details, setDetails] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [printData, setPrintData] = useState(null);
  const printRef = useRef();
  const { selectedCompany, selectedCompanyId, selectedYear, IsMD } = useSelector(state => state.auth);
  const { adminUser: isAdmin, canAdd, canEdit, canDelete } = useMenuPermissions();
  const isAdminOrMD = isAdmin || IsMD === 1;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

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

  const handlePartyChange = (partyId) => {
    const selectedParty = parties.find(p => p.id === partyId);
    if (selectedParty) {
      const paymentTerms = selectedParty.creditDays > 0 
        ? `${selectedParty.creditDays} Days` 
        : 'Advance';
      form.setFieldsValue({ paymentTerms });
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, processesRes, concernsRes, employeesRes] = await Promise.all([
        getParties('', 1, 1000),
        getProcesses('', 1, 1000),
        getConcerns('', 1, 1000),
        getMastersByType('Employee')
      ]);
      
      const customerParties = (partiesRes.data || []).filter(p => 
        p.partyTypes?.some(pt => pt.partyType.partyTypeName.toLowerCase() === 'customer')
      );
      setParties(customerParties);
      setProcesses(processesRes.data || []);
      setConcerns(concernsRes.data || []);
      setEmployees(employeesRes || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextQuotNo();
      form.resetFields();
      
      console.log('selectedCompanyId:', selectedCompanyId);
      
      if (!selectedCompanyId) {
        Modal.error({
          title: 'Error',
          content: 'Company information not found. Please login again to continue.'
        });
        return;
      }
      
      form.setFieldsValue({
        quotNo: response.quotNo,
        quotDate: dayjs(),
        concernId: selectedCompanyId
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
    if (record.isApproval === 1 && !isAdminOrMD) {
      message.warning('Only Admin/MD can edit approved quotations');
      return;
    }
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      quotDate: dayjs(record.quotDate)
    });
    setDetails(record.details?.map(d => ({ ...d, key: d.id })) || []);
    setIsFormVisible(true);
  };

  const handleView = (record) => {
    Modal.info({
      title: 'Rate Quotation Details',
      width: 700,
      content: (
        <div>
          <p><strong>Quot No:</strong> {record.quotNo}</p>
          <p><strong>Date:</strong> {dayjs(record.quotDate).format('DD-MM-YYYY')}</p>
          <p><strong>Concern:</strong> {record.concern?.partyName || 'N/A'}</p>
          <p><strong>Party:</strong> {record.party?.partyName || 'N/A'}</p>
          <p><strong>Payment Terms:</strong> {record.paymentTerms || 'N/A'}</p>
          <p><strong>Remarks:</strong> {record.remarks || 'N/A'}</p>
          {record.attachFile && (
            <p><strong>Attached File:</strong> <a href={record.attachFile} target="_blank" rel="noopener noreferrer">View File</a></p>
          )}
          <div style={{ marginTop: 16 }}>
            <strong>Process Details:</strong>
            <Table
              size="small"
              dataSource={record.details || []}
              pagination={false}
              columns={[
                { title: 'Process', dataIndex: ['process', 'processName'], key: 'process' },
                { title: 'Rate', dataIndex: 'rate', key: 'rate' },
                { title: 'Confirm Rate', dataIndex: 'confirmRate', key: 'confirmRate' },
                { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' }
              ]}
            />
          </div>
        </div>
      ),
    });
  };

  const handlePrintRecord = (record) => {
    setPrintData(record);
    setTimeout(() => handlePrint(), 100);
  };

  const handleDelete = (id) => {
    const quotation = quotations.find(q => q.id === id);
    if (quotation?.isApproval === 1 && !isAdminOrMD) {
      message.warning('Only Admin/MD can delete approved quotations');
      return;
    }
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

  const handleSubmit = async (shouldPrint = false) => {
    try {
      const values = await form.validateFields();
      
      // Trim quotNo
      const trimmedQuotNo = values.quotNo?.trim();
      if (!trimmedQuotNo) {
        message.error('Quotation number is required!');
        return;
      }
      
      // Validate at least one valid detail exists
      const validDetails = details.filter(d => d.processId && d.rate > 0);
      if (validDetails.length === 0) {
        message.error('Please add at least one process detail with valid Process and Rate!');
        return;
      }
      
      // Check for duplicate with trimmed quotNo
      if (!editingId) {
        const duplicate = quotations.find(q => q.quotNo?.trim() === trimmedQuotNo);
        if (duplicate) {
          message.error('Quotation number already exists!');
          return;
        }
      }
      
      setLoading(true);

      const data = {
        ...values,
        quotNo: trimmedQuotNo,
        quotDate: values.quotDate?.toISOString(),
        attachFile: fileList.length > 0 ? fileList[0].url : null,
        isApproval: editingId ? 0 : undefined,
        details: validDetails.map(d => ({
          processId: d.processId,
          rate: Number(d.rate) || 0,
          confirmRate: Number(d.confirmRate) || 0,
          remarks: d.remarks
        }))
      };

      let savedRecord;
      if (editingId) {
        savedRecord = await updateRateQuotation(editingId, data);
        message.success('Updated successfully - Sent for approval');
      } else {
        savedRecord = await createRateQuotation(data);
        message.success('Created successfully');
      }
      
      setIsFormVisible(false);
      loadData();
      
      if (shouldPrint && savedRecord) {
        setPrintData(savedRecord);
        setTimeout(() => handlePrint(), 500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save';
      Modal.error({
        title: 'Error',
        content: errorMessage
      });
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
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'rate', v)} style={{ width: '100%' }} precision={2} autoComplete="off" />
      )
    },
    {
      title: 'Confirm Rate',
      dataIndex: 'confirmRate',
      width: 120,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'confirmRate', v)} style={{ width: '100%' }} precision={2} autoComplete="off" />
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 200,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'remarks', e.target.value)} autoComplete="off" />
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

  const filteredQuotations = quotations.filter(q => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      q.quotNo?.toLowerCase().includes(search) ||
      dayjs(q.quotDate).format('DD-MM-YYYY').includes(search) ||
      q.party?.partyName?.toLowerCase().includes(search) ||
      q.paymentTerms?.toLowerCase().includes(search) ||
      q.details?.some(d => 
        d.process?.processName?.toLowerCase().includes(search) ||
        d.rate?.toString().includes(search) ||
        d.confirmRate?.toString().includes(search)
      )
    );
  });

  const listColumns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'Quot No', dataIndex: 'quotNo', width: 100 },
    { title: 'Date', dataIndex: 'quotDate', width: 100, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'Concern', dataIndex: ['concern', 'partyName'], width: 150 },
    { title: 'Party', dataIndex: ['party', 'partyName'], width: 150 },
    { title: 'Payment Terms', dataIndex: 'paymentTerms', width: 120 },
    {
      title: 'MD Approve',
      dataIndex: 'isApproval',
      key: 'isApproval',
      width: 100,
      align: 'center',
      render: (val) => <Checkbox checked={val === 1} disabled />,
    },
    { 
      title: 'Process/Rate', 
      key: 'processRate', 
      width: 200,
      render: (_, record) => {
        const processRates = record.details?.map(d => 
          `${d.process?.processName || 'N/A'}-${d.rate || 0}`
        ).join(', ') || 'N/A';
        return processRates;
      }
    },
    {
      title: 'Actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          {(record.isApproval === 0 || isAdminOrMD) && canEdit('rate_quotation') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          )}
          {(record.isApproval === 0 || isAdminOrMD) && canDelete('rate_quotation') && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          )}
          {(record.isApproval === 0 || isAdminOrMD) && (
            <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => handlePrintRecord(record)} style={{ color: '#722ed1' }} />
          )}
        </Space>
      )
    }
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table .ant-input,
        .compact-table .ant-input-number,
        .compact-table .ant-select-selector {
          font-size: 11px !important;
          min-height: 24px !important;
          height: 24px !important;
        }
        .compact-table .ant-input-number-input {
          height: 22px !important;
        }
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .page-header .ant-space { width: 100% !important; }
          .section-header { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; }
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>Rate Quotation</Title>
        {!isFormVisible && (
          <Space style={{ width: 'auto' }}>
          <Input 
            placeholder="Search quotations" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
            autoComplete="off"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNew} disabled={!canAdd('rate_quotation')}>New</Button>
        </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={filteredQuotations} rowKey="id" size="small" className="compact-table" />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item 
                label="Quot No" 
                name="quotNo" 
                rules={[{ max: 10, message: 'Quotation number cannot exceed 10 characters!' }]}
                style={{ marginBottom: 8 }}
              >
                <Input disabled={editingId ? true : !isAdmin} style={{ width: '100%', height: '32px' }} size="middle" autoComplete="off" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Quot Date" name="quotDate" style={{ marginBottom: 8 }}>
                <DatePicker style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
            <Form.Item name="concernId" hidden>
              <Input />
            </Form.Item>
            <Col span={8}>
              <Form.Item label="Party" name="partyId" rules={[{ required: true, message: 'Please select party!' }]} style={{ marginBottom: 8 }}>
                <Select 
                  showSearch 
                  filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} 
                  style={{ width: '100%', height: '32px' }} 
                  size="middle"
                  onChange={handlePartyChange}
                >
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Payment Terms" name="paymentTerms" style={{ marginBottom: 8 }}>
                <Input style={{ width: '100%', height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Followup" name="followupId" style={{ marginBottom: 8 }}>
                <Select 
                  showSearch 
                  filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} 
                  style={{ width: '100%', height: '32px' }} 
                  size="middle"
                  placeholder="Select Employee"
                >
                  {employees.filter(e => e.isActive).map(emp => <Option key={emp.id} value={emp.id}>{emp.masterName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Attach File" style={{ marginBottom: 8 }}>
                <Upload customRequest={handleUpload} fileList={fileList} onRemove={() => setFileList([])} accept="image/*,.pdf">
                  <Button icon={<UploadOutlined />} size="small">Upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 4 }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Process Details</Title>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddDetail} style={{ backgroundColor: '#031d38', color: '#fff', borderColor: '#031d38' }}>Add Row</Button>
            </div>
            <Table 
              columns={detailColumns} 
              dataSource={details} 
              pagination={false} 
              scroll={details.length > 0 ? { x: 800, y: 200 } : { x: 800 }}
              size="small"
              bordered
              className="compact-table"
              locale={{ emptyText: 'Click Add Row to add process details' }}
            />
          </div>

          <Row gutter={8} style={{ marginTop: 4 }}>
            <Col span={24}>
              <Form.Item label="Remarks / Terms" name="remarks" style={{ marginBottom: 8 }}>
                <TextArea rows={1} autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 4, textAlign: 'right' }}>
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setIsFormVisible(false)}>Cancel</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSubmit(false)}>Save</Button>
              <Button type="primary" icon={<PrinterOutlined />} loading={loading} onClick={() => handleSubmit(true)}>Save & Print</Button>
            </Space>
          </div>
        </Form>
      )}
      
      <div style={{ display: 'none' }}>
        {printData && (
          <RateQuotationPrint 
            ref={printRef} 
            data={{
              ...printData,
              partyName: parties.find(p => p.id === printData.partyId)?.partyName,
              address1: parties.find(p => p.id === printData.partyId)?.address1,
              address2: parties.find(p => p.id === printData.partyId)?.address2,
              address3: parties.find(p => p.id === printData.partyId)?.address3,
              address4: parties.find(p => p.id === printData.partyId)?.address4,
              district: parties.find(p => p.id === printData.partyId)?.district,
              state: parties.find(p => p.id === printData.partyId)?.state,
              pincode: parties.find(p => p.id === printData.partyId)?.pincode,
              gstNo: parties.find(p => p.id === printData.partyId)?.gstNo,
              stateCode: '33'
            }} 
            processes={processes}
          />
        )}
      </div>
    </Card>
  );
};

export default RateQuotation;
