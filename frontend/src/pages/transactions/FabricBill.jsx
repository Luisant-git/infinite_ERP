import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getNextBillNo, getFabricBills, createFabricBill, updateFabricBill, deleteFabricBill } from '../../api/fabricBill';
import { getParties } from '../../api/party';
import { getGstMasters } from '../../api/gstMaster';
import { getMastersByType } from '../../api/fabricInward';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const FabricBill = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fabricBills, setFabricBills] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { adminUser: isAdmin } = useMenuPermissions();
  
  const [parties, setParties] = useState([]);
  const [gstMasters, setGstMasters] = useState([]);
  const [masters, setMasters] = useState([]);
  const [details, setDetails] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
    loadMasters();
  }, []);

  const loadData = async () => {
    try {
      const response = await getFabricBills('', 1, 100);
      setFabricBills(response.data || []);
    } catch (error) {
      console.error('Error loading fabric bills:', error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, gstRes, fabricRes, colorRes, diaRes, uomRes] = await Promise.all([
        getParties('', 1, 1000),
        getGstMasters('', 1, 100),
        getMastersByType('Fabric', true),
        getMastersByType('Color', true),
        getMastersByType('Dia', true),
        getMastersByType('UOM', true)
      ]);
      
      const allParties = partiesRes.data || [];
      setParties(allParties.filter(p => p.partyTypes?.some(pt => 
        pt.partyType.partyTypeName.toLowerCase() === 'customer'
      )));
      setGstMasters(gstRes.data?.filter(g => g.isActive === 1) || []);
      setMasters([...fabricRes, ...colorRes, ...diaRes, ...uomRes]);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextBillNo();
      form.resetFields();
      form.setFieldsValue({
        billNo: response.billNo,
        billDate: dayjs(),
        creditDays: 0
      });
      setDetails([]);
      setTaxes([]);
      setEditingId(null);
      setIsFormVisible(true);
    } catch (error) {
      message.error('Failed to generate bill number');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      billDate: dayjs(record.billDate)
    });
    setDetails(record.details?.map(d => ({ ...d, key: d.id, dcDate: d.dcDate ? dayjs(d.dcDate) : null })) || []);
    setTaxes(record.taxes?.map(t => ({ ...t, key: t.id })) || []);
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Fabric Bill',
      content: 'Are you sure?',
      onOk: async () => {
        try {
          await deleteFabricBill(id);
          message.success('Deleted successfully');
          loadData();
        } catch (error) {
          message.error('Failed to delete');
        }
      }
    });
  };

  const calculateTotals = () => {
    const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
    const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);
    const totalAmount = details.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const gstAmount = taxes.reduce((sum, t) => sum + (Number(t.taxAmount) || 0), 0);
    
    const designAmount = (form.getFieldValue('noOfDesign') || 0) * (form.getFieldValue('designRate') || 0);
    const screenAmount = (form.getFieldValue('noOfScreen') || 0) * (form.getFieldValue('screenRate') || 0);
    const otherCharges = form.getFieldValue('otherCharges') || 0;
    
    const netBeforeRound = totalAmount + gstAmount + designAmount + screenAmount + otherCharges;
    const roundOff = Math.round(netBeforeRound) - netBeforeRound;
    const netAmount = Math.round(netBeforeRound);

    form.setFieldsValue({
      totalQty,
      totalRolls,
      totalAmount,
      designAmount,
      screenAmount,
      gstAmount,
      roundOff: roundOff.toFixed(2),
      netAmount
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        ...values,
        billDate: values.billDate?.toISOString(),
        details: details.map(d => ({
          inwardNo: d.inwardNo,
          grnId: d.grnId,
          pdcNo: d.pdcNo,
          dcNo: d.dcNo,
          dcId: d.dcId,
          dcDate: d.dcDate,
          fabricId: d.fabricId,
          colorId: d.colorId,
          diaId: d.diaId,
          gsm: d.gsm,
          designNo: d.designNo,
          designName: d.designName,
          noOfColor: d.noOfColor,
          weight: Number(d.weight) || 0,
          rolls: d.rolls || 0,
          uomId: d.uomId,
          rate: Number(d.rate) || 0,
          amount: Number(d.amount) || 0,
          process: d.process,
          processList: d.processList,
          remarks: d.remarks
        })),
        taxes: taxes.map(t => ({
          taxName: t.taxName,
          taxPercentage: Number(t.taxPercentage) || 0,
          taxAmount: Number(t.taxAmount) || 0
        }))
      };

      if (editingId) {
        await updateFabricBill(editingId, data);
        message.success('Updated successfully');
      } else {
        await createFabricBill(data);
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
      weight: 0,
      rolls: 0,
      rate: 0,
      amount: 0
    }]);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter(d => d.key !== key));
    setTimeout(calculateTotals, 100);
  };

  const handleDetailChange = (key, field, value) => {
    setDetails(details.map(d => {
      if (d.key === key) {
        const updated = { ...d, [field]: value };
        if (field === 'weight' || field === 'rate') {
          updated.amount = (updated.weight || 0) * (updated.rate || 0);
        }
        return updated;
      }
      return d;
    }));
    setTimeout(calculateTotals, 100);
  };

  const handleLoadTaxes = () => {
    const totalAmount = form.getFieldValue('totalAmount') || 0;
    const loadedTaxes = gstMasters.filter(g => g.isLoadDefault === 1).map(g => ({
      key: Date.now() + g.id,
      taxName: g.id,
      taxPercentage: Number(g.taxPercent),
      taxAmount: (totalAmount * Number(g.taxPercent)) / 100
    }));
    setTaxes(loadedTaxes);
    setTimeout(calculateTotals, 100);
  };

  const handleDeleteTax = (key) => {
    setTaxes(taxes.filter(t => t.key !== key));
    setTimeout(calculateTotals, 100);
  };

  const detailColumns = [
    { title: 'Sl', width: 50, render: (_, r, i) => i + 1 },
    { title: 'Inward No', dataIndex: 'inwardNo', width: 100, render: (v, r) => <Input value={v} onChange={(e) => handleDetailChange(r.key, 'inwardNo', e.target.value)} size="small" /> },
    { title: 'Our DC No', dataIndex: 'dcNo', width: 100, render: (v, r) => <Input value={v} onChange={(e) => handleDetailChange(r.key, 'dcNo', e.target.value)} size="small" /> },
    { title: 'Our DC Date', dataIndex: 'dcDate', width: 120, render: (v, r) => <DatePicker value={v ? dayjs(v) : null} onChange={(date) => handleDetailChange(r.key, 'dcDate', date?.toISOString())} format="DD-MM-YYYY" size="small" style={{ width: '100%' }} /> },
    { title: 'Fabric', dataIndex: 'fabricId', width: 120, render: (v, r) => <Select value={v} onChange={(val) => handleDetailChange(r.key, 'fabricId', val)} showSearch size="small" style={{ width: '100%' }}>{masters.filter(m => m.masterType === 'Fabric').map(m => <Option key={m.id} value={m.id}>{m.masterName}</Option>)}</Select> },
    { title: 'Dia', dataIndex: 'diaId', width: 80, render: (v, r) => <Select value={v} onChange={(val) => handleDetailChange(r.key, 'diaId', val)} showSearch size="small" style={{ width: '100%' }}>{masters.filter(m => m.masterType === 'Dia').map(m => <Option key={m.id} value={m.id}>{m.masterName}</Option>)}</Select> },
    { title: 'Color', dataIndex: 'colorId', width: 100, render: (v, r) => <Select value={v} onChange={(val) => handleDetailChange(r.key, 'colorId', val)} showSearch size="small" style={{ width: '100%' }}>{masters.filter(m => m.masterType === 'Color').map(m => <Option key={m.id} value={m.id}>{m.masterName}</Option>)}</Select> },
    { title: 'Rolls', dataIndex: 'rolls', width: 80, render: (v, r) => <InputNumber value={v} onChange={(val) => handleDetailChange(r.key, 'rolls', val)} style={{ width: '100%' }} size="small" /> },
    { title: 'Bill Weight', dataIndex: 'weight', width: 100, render: (v, r) => <InputNumber value={v} onChange={(val) => handleDetailChange(r.key, 'weight', val)} style={{ width: '100%' }} precision={3} size="small" /> },
    { title: 'Rate', dataIndex: 'rate', width: 100, render: (v, r) => <InputNumber value={v} onChange={(val) => handleDetailChange(r.key, 'rate', val)} style={{ width: '100%' }} precision={2} size="small" /> },
    { title: 'Amount', dataIndex: 'amount', width: 120, render: (v) => <InputNumber value={v} disabled style={{ width: '100%' }} precision={2} size="small" /> },
    { title: 'Process', dataIndex: 'process', width: 120, render: (v, r) => <Input value={v} onChange={(e) => handleDetailChange(r.key, 'process', e.target.value)} size="small" /> },
    { title: 'Process List', dataIndex: 'processList', width: 150, render: (v, r) => <Input value={v} onChange={(e) => handleDetailChange(r.key, 'processList', e.target.value)} size="small" /> },
    { title: 'Remarks', dataIndex: 'remarks', width: 120, render: (v, r) => <Input value={v} onChange={(e) => handleDetailChange(r.key, 'remarks', e.target.value)} size="small" /> },
    { title: 'Action', width: 60, fixed: 'right', render: (_, r) => <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(r.key)} size="small" /> }
  ];

  const taxColumns = [
    { title: 'Sl', width: 50, render: (_, r, i) => i + 1 },
    { title: 'Tax Name', dataIndex: 'taxName', width: 150, render: (v) => gstMasters.find(g => g.id === v)?.taxName || '' },
    { title: '%', dataIndex: 'taxPercentage', width: 80, render: (v) => Number(v).toFixed(2) },
    { title: 'Value', dataIndex: 'taxAmount', width: 120, render: (v) => Number(v).toFixed(2) },
    { title: 'Action', width: 60, render: (_, r) => <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTax(r.key)} /> }
  ];

  const listColumns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, r, i) => i + 1 },
    { title: 'Bill No', dataIndex: 'billNo', width: 100 },
    { title: 'Bill Date', dataIndex: 'billDate', width: 120, render: (v) => dayjs(v).format('DD-MM-YYYY') },
    { title: 'Party', dataIndex: 'partyId', width: 150, render: (v) => parties.find(p => p.id === v)?.partyName || '' },
    { title: 'Total Qty', dataIndex: 'totalQty', width: 100, render: (v) => Number(v).toFixed(3) },
    { title: 'Net Amount', dataIndex: 'netAmount', width: 120, render: (v) => Number(v).toFixed(2) },
    {
      title: 'Actions',
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      )
    }
  ];

  const filteredBills = fabricBills.filter(item => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return item.billNo?.toLowerCase().includes(search);
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
          .section-header { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; }
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>Fabric Bill</Title>
        {!isFormVisible && (
          <Space>
            <Input 
              placeholder="Search" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, height: 32 }}
              size="small"
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>New</Button>
          </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={filteredBills} rowKey="id" size="small" className="compact-table" scroll={{ x: 800 }} />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={4}>
              <Form.Item label="Bill No" name="billNo" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <Input disabled={!isAdmin} style={{ height: '32px' }} size="middle" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Bill Date" name="billDate" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <DatePicker style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Party" name="partyId" style={{ marginBottom: 6 }}>
                <Select showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="E-way No" name="ewayNo" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="HSN Code" name="hsnCode" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={6}>
              <Form.Item label="Invoice To" name="invoiceTo" style={{ marginBottom: 6 }}>
                <Select showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Credit Days" name="creditDays" style={{ marginBottom: 6 }}>
                <InputNumber style={{ width: '100%', height: '32px' }} size="middle" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Order No" name="orderNo" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={24}>
              <Form.Item label="Remarks" name="remarks" style={{ marginBottom: 6 }}>
                <Input.TextArea rows={1} size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 4 }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Details</Title>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddDetail} style={{ backgroundColor: '#031d38', color: '#fff', borderColor: '#031d38' }}>Add Row</Button>
            </div>
            <Table 
              columns={detailColumns} 
              dataSource={details} 
              pagination={false} 
              scroll={{ x: 2000, y: 200 }}
              size="small"
              bordered
              className="compact-table"
            />
          </div>

          <Row gutter={8} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Title level={5} style={{ margin: 0, fontSize: '14px' }}>GST</Title>
                  <Button type="dashed" size="small" onClick={handleLoadTaxes}>Load Taxes</Button>
                </div>
                <Table 
                  columns={taxColumns} 
                  dataSource={taxes} 
                  pagination={false}
                  size="small"
                  className="compact-table"
                />
              </div>
            </Col>
            <Col span={12}>
              <Row gutter={8}>
                <Col span={8}><Form.Item label="Total Rolls" name="totalRolls" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Total Qty" name="totalQty" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={3} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Total Amount" name="totalAmount" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
                <Col span={8}><Form.Item label="No of Design" name="noOfDesign" style={{ marginBottom: 6 }}><InputNumber style={{ width: '100%' }} onChange={calculateTotals} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Design Rate" name="designRate" style={{ marginBottom: 6 }}><InputNumber style={{ width: '100%' }} precision={2} onChange={calculateTotals} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Design Amount" name="designAmount" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
                <Col span={8}><Form.Item label="No of Screen" name="noOfScreen" style={{ marginBottom: 6 }}><InputNumber style={{ width: '100%' }} onChange={calculateTotals} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Screen Rate" name="screenRate" style={{ marginBottom: 6 }}><InputNumber style={{ width: '100%' }} precision={2} onChange={calculateTotals} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Screen Amount" name="screenAmount" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
                <Col span={8}><Form.Item label="GST Amount" name="gstAmount" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Other Charges" name="otherCharges" style={{ marginBottom: 6 }}><InputNumber style={{ width: '100%' }} precision={2} onChange={calculateTotals} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Round Off" name="roundOff" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Net Amount" name="netAmount" style={{ marginBottom: 6 }}><InputNumber disabled style={{ width: '100%' }} precision={2} /></Form.Item></Col>
              </Row>
            </Col>
          </Row>

          <div style={{ marginTop: 8, textAlign: 'right' }}>
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

export default FabricBill;
