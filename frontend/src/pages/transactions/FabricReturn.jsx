import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getNextDcNo, getFabricReturns, createFabricReturn, updateFabricReturn, deleteFabricReturn } from '../../api/fabricReturn';
import { getParties } from '../../api/party';
import { getFabricInwards } from '../../api/fabricInward';
import { getMastersByType } from '../../api/fabricInward';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FabricReturn = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fabricReturns, setFabricReturns] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { adminUser: isAdmin } = useMenuPermissions();
  
  const [parties, setParties] = useState([]);
  const [allParties, setAllParties] = useState([]);
  const [inwards, setInwards] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [dias, setDias] = useState([]);
  const [uoms, setUoms] = useState([]);
  
  const [details, setDetails] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
    loadMasters();
    loadAllInwards();
  }, []);

  const loadAllInwards = async () => {
    try {
      const response = await getFabricInwards('', 1, 1000);
      const filtered = (response.data || []).filter(i => i.isClosed === 0 || i.isClosed === false);
      setInwards(filtered);
    } catch (error) {
      console.error('Error loading inwards:', error);
    }
  };

  const loadData = async () => {
    try {
      const response = await getFabricReturns('', 1, 100);
      setFabricReturns(response.data || []);
    } catch (error) {
      console.error('Error loading fabric returns:', error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, fabricsRes, colorsRes, diasRes, uomsRes] = await Promise.all([
        getParties('', 1, 1000),
        getMastersByType('Fabric', true),
        getMastersByType('Color', true),
        getMastersByType('Dia', true),
        getMastersByType('UOM', true)
      ]);
      
      const allPartiesData = partiesRes.data || [];
      setAllParties(allPartiesData);
      setParties(allPartiesData.filter(p => p.partyTypes?.some(pt => 
        pt.partyType.partyTypeName.toLowerCase() === 'customer'
      )));
      
      setFabrics(fabricsRes || []);
      setColors(colorsRes || []);
      setDias(diasRes || []);
      setUoms(uomsRes || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const loadInwards = async (partyId) => {
    try {
      const response = await getFabricInwards('', 1, 1000);
      const filtered = (response.data || []).filter(i => 
        i.partyId === partyId && (i.isClosed === 0 || i.isClosed === false)
      );
      setInwards(filtered);
    } catch (error) {
      console.error('Error loading inwards:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextDcNo();
      form.resetFields();
      form.setFieldsValue({
        dcNo: response.dcNo,
        dcDate: dayjs()
      });
      setDetails([]);
      setSelectedProcesses([]);
      setEditingId(null);
      setIsFormVisible(true);
    } catch (error) {
      message.error('Failed to generate DC number');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    
    const dyeParty = allParties.find(p => p.id === record.dyeParty);
    
    form.setFieldsValue({
      ...record,
      grnNo: record.inwardNo,
      dcDate: dayjs(record.dcDate),
      grnDate: record.grnDate ? dayjs(record.grnDate) : null,
      dyeingDcDate: record.dyeingDcDate ? dayjs(record.dyeingDcDate) : null,
      dyeingPartyName: dyeParty?.partyName || ''
    });
    setDetails(record.details?.map(d => ({ ...d, key: d.id })) || []);
    setSelectedProcesses(record.processes?.map(p => ({ ...p, key: p.id })) || []);
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Fabric Return',
      content: 'Are you sure?',
      onOk: async () => {
        try {
          await deleteFabricReturn(id);
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
      
      if (details.length === 0) {
        message.error('Please add at least one detail row');
        return;
      }
      
      setLoading(true);

      const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
      const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

      const { dyeingPartyName, dyeParty, ...submitValues } = values;

      const data = {
        ...submitValues,
        dyeParty: dyeParty || null,
        dcDate: values.dcDate?.toISOString(),
        grnDate: values.grnDate?.toISOString(),
        dyeingDcDate: values.dyeingDcDate?.toISOString(),
        totalQty,
        totalRolls,
        details: details.map(d => ({
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
          remarks: d.remarks
        })),
        processes: selectedProcesses.map(p => ({
          processName: p.processName
        }))
      };

      if (editingId) {
        await updateFabricReturn(editingId, data);
        message.success('Updated successfully');
      } else {
        await createFabricReturn(data);
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

  const handleInwardSelect = (inwardNo) => {
    const selectedInward = inwards.find(i => i.grnNo === inwardNo);
    if (selectedInward) {
      const dyeParty = allParties.find(p => p.id === selectedInward.dyeingPartyId);
      form.setFieldsValue({
        grnDate: selectedInward.grnDate ? dayjs(selectedInward.grnDate) : null,
        pdcNo: selectedInward.pdcNo,
        dyeParty: selectedInward.dyeingPartyId,
        dyeingPartyName: dyeParty?.partyName || '',
        dyeingDcNo: selectedInward.dyeingDcNo,
        dyeingDcDate: selectedInward.dyeingDcDate ? dayjs(selectedInward.dyeingDcDate) : null,
        orderNo: selectedInward.orderNo,
        poNo: selectedInward.poNo,
        dcType: selectedInward.dcType,
        fabricType: selectedInward.fabricType
      });
      
      if (selectedInward.details && selectedInward.details.length > 0) {
        const loadedDetails = selectedInward.details.map((d, idx) => ({
          key: Date.now() + idx,
          fabricId: d.fabricId,
          colorId: d.colorId,
          diaId: d.diaId,
          gsm: d.gsm,
          designNo: d.designNo || '',
          designName: d.designName,
          noOfColor: d.noOfColor,
          weight: 0,
          rolls: d.rolls || 0,
          uomId: d.uomId,
          rate: 0,
          amount: 0,
          remarks: d.remarks || ''
        }));
        setDetails(loadedDetails);
      }
      
      if (selectedInward.processes) {
        setSelectedProcesses(selectedInward.processes.map((p, idx) => ({
          key: Date.now() + idx,
          processName: p.processName
        })));
      }
    }
  };

  const handleAddDetail = () => {
    setDetails([...details, { 
      key: Date.now(),
      fabricId: null,
      colorId: null,
      diaId: null,
      gsm: '',
      designNo: '',
      designName: '',
      noOfColor: 0,
      weight: 0,
      rolls: 0,
      uomId: null,
      rate: 0,
      amount: 0,
      remarks: ''
    }]);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter(d => d.key !== key));
  };

  const handleDetailChange = (key, field, value) => {
    setDetails(details.map(d => {
      if (d.key === key) {
        const updated = { ...d, [field]: value };
        
        if (field === 'weight' || field === 'rate') {
          const weight = field === 'weight' ? value : d.weight;
          const rate = field === 'rate' ? value : d.rate;
          updated.amount = weight * rate;
        }
        
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteProcess = (key) => {
    setSelectedProcesses(selectedProcesses.filter(p => p.key !== key));
  };

  const detailColumns = [
    { title: 'Sl.No', width: 50, render: (_, record, index) => index + 1 },
    {
      title: 'Fabric',
      dataIndex: 'fabricId',
      width: 120,
      render: (val, record) => (
        <Select value={val} onChange={(v) => handleDetailChange(record.key, 'fabricId', v)} style={{ width: '100%' }} showSearch>
          {fabrics.map(f => <Option key={f.id} value={f.id}>{f.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Color',
      dataIndex: 'colorId',
      width: 120,
      render: (val, record) => (
        <Select value={val} onChange={(v) => handleDetailChange(record.key, 'colorId', v)} style={{ width: '100%' }} showSearch>
          {colors.map(c => <Option key={c.id} value={c.id}>{c.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Dia',
      dataIndex: 'diaId',
      width: 80,
      render: (val, record) => (
        <Select value={val} onChange={(v) => handleDetailChange(record.key, 'diaId', v)} style={{ width: '100%' }}>
          {dias.map(d => <Option key={d.id} value={d.id}>{d.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'GSM',
      dataIndex: 'gsm',
      width: 80,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'gsm', e.target.value)} autoComplete="off" />
      )
    },
    {
      title: 'Design No',
      dataIndex: 'designNo',
      width: 100,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'designNo', e.target.value)} autoComplete="off" />
      )
    },
    {
      title: 'Design Name',
      dataIndex: 'designName',
      width: 120,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'designName', e.target.value)} autoComplete="off" />
      )
    },
    {
      title: 'No of Color',
      dataIndex: 'noOfColor',
      width: 80,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'noOfColor', v)} style={{ width: '100%' }} autoComplete="off" />
      )
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      width: 100,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'weight', v)} style={{ width: '100%' }} precision={3} autoComplete="off" />
      )
    },
    {
      title: 'Rolls',
      dataIndex: 'rolls',
      width: 80,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'rolls', v)} style={{ width: '100%' }} autoComplete="off" />
      )
    },
    {
      title: 'Uom',
      dataIndex: 'uomId',
      width: 80,
      render: (val, record) => (
        <Select value={val} onChange={(v) => handleDetailChange(record.key, 'uomId', v)} style={{ width: '100%' }}>
          {uoms.map(u => <Option key={u.id} value={u.id}>{u.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 80,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'rate', v)} style={{ width: '100%' }} precision={2} autoComplete="off" />
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
      render: (val) => <InputNumber value={val} disabled style={{ width: '100%' }} precision={2} autoComplete="off" />
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 120,
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

  const processColumns = [
    { title: 'Sl.No', width: 80, render: (_, record, index) => index + 1 },
    { title: 'Process', dataIndex: 'processName', width: 200 },
    {
      title: 'Action',
      width: 80,
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProcess(record.key)} />
      )
    }
  ];

  const listColumns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'DC No', dataIndex: 'dcNo', width: 100 },
    { title: 'DC Date', dataIndex: 'dcDate', width: 100, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'Party', dataIndex: 'partyId', width: 150, render: (val) => parties.find(p => p.id === val)?.partyName || '' },
    { title: 'Inward No', dataIndex: 'inwardNo', width: 100 },
    { title: 'Total Qty', dataIndex: 'totalQty', width: 100 },
    { title: 'Total Rolls', dataIndex: 'totalRolls', width: 100 },
    {
      title: 'Actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
  const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

  const filteredFabricReturns = fabricReturns.filter(item => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      item.dcNo?.toLowerCase().includes(search) ||
      dayjs(item.dcDate).format('DD-MM-YYYY').includes(search) ||
      item.inwardNo?.toLowerCase().includes(search)
    );
  });

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
        <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>Fabric Return</Title>
        {!isFormVisible && (
          <Space>
            <Input 
              placeholder="Search" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, height: 32 }}
              size="small"
              allowClear
              autoComplete="off"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>New</Button>
          </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={filteredFabricReturns} rowKey="id" size="small" className="compact-table" />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={4}>
              <Form.Item label="Dc No" name="dcNo" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <Input disabled={!isAdmin} style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Party" name="partyId" style={{ marginBottom: 6 }}>
                <Select showSearch onChange={loadInwards} filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Inward No" name="grnNo" style={{ marginBottom: 6 }}>
                <Select style={{ height: '32px' }} size="middle" onChange={handleInwardSelect}>
                  {inwards.map(i => <Option key={i.id} value={i.grnNo}>{i.grnNo}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Date" name="dcDate" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <DatePicker style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="GRN Date" name="grnDate" style={{ marginBottom: 6 }}>
                <DatePicker disabled style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Delivery To" name="deliveryTo" style={{ marginBottom: 6 }}>
                <Select showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {allParties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={18}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: 2 }}>Info</label>
                <div style={{ display: 'inline-flex', padding: '6px 8px', backgroundColor: '#f5f5f5', borderRadius: '4px', height: '32px', alignItems: 'center' }}>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>PDC No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('pdcNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Party</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingPartyName') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Dc No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingDcNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Dc Date</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingDcDate') ? form.getFieldValue('dyeingDcDate').format('DD-MM-YYYY') : '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Order No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('orderNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>PO No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('poNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Fabric Type</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('fabricType') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px' }}></div>
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>DC Type</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dcType') || '-'}</div>
                  </div>
                </div>
              </div>
              <Form.Item name="pdcNo" hidden><Input /></Form.Item>
              <Form.Item name="dyeingPartyName" hidden><Input /></Form.Item>
              <Form.Item name="dyeParty" hidden><Input /></Form.Item>
              <Form.Item name="dyeingDcNo" hidden><Input /></Form.Item>
              <Form.Item name="dyeingDcDate" hidden><DatePicker /></Form.Item>
              <Form.Item name="orderNo" hidden><Input /></Form.Item>
              <Form.Item name="poNo" hidden><Input /></Form.Item>
              <Form.Item name="fabricType" hidden><Input /></Form.Item>
              <Form.Item name="dcType" hidden><Input /></Form.Item>
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
              scroll={{ x: 1600, y: 200 }}
              size="small"
              bordered
              className="compact-table"
            />
          </div>

          <div style={{ marginTop: 4 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: '14px' }}>Process</Title>
            <Table 
              columns={processColumns} 
              dataSource={selectedProcesses} 
              pagination={false}
              size="small"
              className="compact-table"
            />
          </div>

          <Row gutter={8} style={{ marginTop: 4 }}>
            <Col span={6}>
              <Form.Item label="Remarks" name="remarks" style={{ marginBottom: 6 }}>
                <TextArea rows={1} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Rec Name" name="receivedName" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="HSN Code" name="hsnCode" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Vehicle No" name="vehicleNo" style={{ marginBottom: 6 }}>
                <Input style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Total Rolls</label>
                <Input value={totalRolls} disabled style={{ height: '32px' }} />
              </div>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Total Qty</label>
                <Input value={totalQty.toFixed(3)} disabled style={{ height: '32px' }} />
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 4, textAlign: 'right' }}>
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

export default FabricReturn;
