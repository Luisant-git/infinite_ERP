import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  getNextGrnNo, getFabricInwards, createFabricInward, updateFabricInward, deleteFabricInward,
  getMastersByType 
} from '../../api/fabricInward';
import { getParties } from '../../api/party';
import { getDesigns } from '../../api/design';
import { getProcesses } from '../../api/process';
import { getPartyProcessRates } from '../../api/partyProcessRate';

const { Title } = Typography;
const { Option } = Select;

const FabricInward = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fabricInwards, setFabricInwards] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  const [parties, setParties] = useState([]);
  const [dyeingParties, setDyeingParties] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [dias, setDias] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [processes, setProcesses] = useState([]);
  
  const [details, setDetails] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [fabricType, setFabricType] = useState('Grey Lot');
  const [dcType, setDcType] = useState('Fresh');
  const [selectedDyeingParty, setSelectedDyeingParty] = useState(null);

  useEffect(() => {
    loadData();
    loadMasters();
  }, []);

  const loadData = async () => {
    try {
      const response = await getFabricInwards('', 1, 100);
      setFabricInwards(response.data || []);
    } catch (error) {
      console.error('Error loading fabric inwards:', error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, fabricsRes, colorsRes, diasRes, uomsRes, designsRes, processesRes] = await Promise.all([
        getParties('', 1, 1000),
        getMastersByType('Fabric'),
        getMastersByType('Color'),
        getMastersByType('Dia'),
        getMastersByType('UOM'),
        getDesigns('', 1, 1000),
        getProcesses('', 1, 1000)
      ]);
      
      const allParties = partiesRes.data || [];
      setParties(allParties.filter(p => p.partyTypes?.some(pt => 
        pt.partyType.partyTypeName.toLowerCase() === 'customer'
      )));
      setDyeingParties(allParties.filter(p => p.partyTypes?.some(pt => 
        ['dyeing', 'compacting'].includes(pt.partyType.partyTypeName.toLowerCase())
      )));
      
      setFabrics(fabricsRes || []);
      setColors(colorsRes || []);
      setDias(diasRes || []);
      setUoms(uomsRes || []);
      setDesigns(designsRes.data || []);
      setProcesses(processesRes.data || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextGrnNo();
      form.resetFields();
      form.setFieldsValue({
        grnNo: response.grnNo,
        grnDate: dayjs(),
        pdcDate: dayjs(),
        dyeingDcDate: dayjs(),
        dcType: 'Fresh',
        fabricType: 'Grey Lot'
      });
      setDetails([]);
      setSelectedProcesses([]);
      setFabricType('Grey Lot');
      setDcType('Fresh');
      setEditingId(null);
      setIsFormVisible(true);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to generate GRN number');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      grnDate: dayjs(record.grnDate),
      pdcDate: record.pdcDate ? dayjs(record.pdcDate) : null,
      dyeingDcDate: record.dyeingDcDate ? dayjs(record.dyeingDcDate) : null
    });
    setDetails(record.details || []);
    setSelectedProcesses(record.processes || []);
    setFabricType(record.fabricType);
    setDcType(record.dcType);
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Fabric Inward',
      content: 'Are you sure you want to delete this record?',
      onOk: async () => {
        try {
          await deleteFabricInward(id);
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

      const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
      const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

      const data = {
        ...values,
        grnDate: values.grnDate?.toISOString(),
        pdcDate: values.pdcDate?.toISOString(),
        dyeingDcDate: values.dyeingDcDate?.toISOString(),
        details: details.map(d => ({
          fabricId: d.fabricId,
          colorId: d.colorId,
          diaId: d.diaId,
          gsm: d.gsm,
          designId: d.designId,
          designName: d.designName,
          noOfColor: d.noOfColor,
          productionNotRequired: d.productionNotRequired ? 1 : 0,
          weight: Number(d.weight) || 0,
          rolls: d.rolls || 0,
          uomId: d.uomId,
          remarks: d.remarks
        })),
        processes: selectedProcesses.map(p => ({
          processName: p.processName,
          rate: Number(p.rate) || 0,
          wetCondition: p.wetCondition ? 1 : 0,
          productionNotRequired: p.productionNotRequired ? 1 : 0,
          productionClose: p.productionClose ? 1 : 0
        }))
      };

      if (editingId) {
        await updateFabricInward(editingId, data);
        message.success('Updated successfully');
      } else {
        await createFabricInward(data);
        message.success('Created successfully');
      }
      
      setIsFormVisible(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDetail = () => {
    setDetails([...details, { 
      key: Date.now(),
      fabricId: null,
      colorId: null,
      diaId: null,
      gsm: '',
      designId: null,
      designName: '',
      noOfColor: 0,
      productionNotRequired: false,
      weight: 0,
      rolls: 0,
      uomId: null,
      remarks: ''
    }]);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter(d => d.key !== key));
  };

  const handleDetailChange = (key, field, value) => {
    setDetails(details.map(d => d.key === key ? { ...d, [field]: value } : d));
  };

  const handleProcessSelect = async (processIds) => {
    const newProcesses = processIds.map(id => {
      const existing = selectedProcesses.find(p => p.processId === id);
      if (existing) return existing;
      
      const process = processes.find(p => p.id === id);
      return {
        key: Date.now() + id,
        processId: id,
        processName: process?.processName || '',
        rate: 0,
        wetCondition: process?.wetCondition || false,
        productionNotRequired: false,
        productionClose: false
      };
    });

    if (selectedDyeingParty && dcType !== 'Sample') {
      try {
        const rates = await getPartyProcessRates(selectedDyeingParty);
        newProcesses.forEach(p => {
          const rateData = rates?.find(r => r.processId === p.processId);
          if (rateData) p.rate = rateData.ratePerKg;
        });
      } catch (error) {
        console.error('Error loading rates:', error);
      }
    }

    setSelectedProcesses(newProcesses);
  };

  const handleProcessChange = (key, field, value) => {
    setSelectedProcesses(selectedProcesses.map(p => p.key === key ? { ...p, [field]: value } : p));
  };

  const detailColumns = [
    {
      title: 'Fabric',
      dataIndex: 'fabricId',
      width: 150,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'fabricId', v)}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
        >
          {fabrics.map(f => <Option key={f.id} value={f.id}>{f.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Color',
      dataIndex: 'colorId',
      width: 150,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'colorId', v)}
          style={{ width: '100%' }}
          showSearch
        >
          {colors.map(c => <Option key={c.id} value={c.id}>{c.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Dia',
      dataIndex: 'diaId',
      width: 120,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'diaId', v)}
          style={{ width: '100%' }}
        >
          {dias.map(d => <Option key={d.id} value={d.id}>{d.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'GSM',
      dataIndex: 'gsm',
      width: 100,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'gsm', e.target.value)} />
      )
    },
    ...(fabricType === 'Print Lot' ? [{
      title: 'Design No',
      dataIndex: 'designId',
      width: 150,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'designId', v)}
          style={{ width: '100%' }}
          showSearch
        >
          {designs.map(d => <Option key={d.id} value={d.id}>{d.designNo}</Option>)}
        </Select>
      )
    }] : []),
    {
      title: 'Design Name',
      dataIndex: 'designName',
      width: 150,
      render: (val, record) => (
        <Input value={val} onChange={(e) => handleDetailChange(record.key, 'designName', e.target.value)} />
      )
    },
    {
      title: 'No of Color',
      dataIndex: 'noOfColor',
      width: 100,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'noOfColor', v)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      width: 100,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'weight', v)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'Rolls',
      dataIndex: 'rolls',
      width: 80,
      render: (val, record) => (
        <InputNumber value={val} onChange={(v) => handleDetailChange(record.key, 'rolls', v)} style={{ width: '100%' }} />
      )
    },
    {
      title: 'UOM',
      dataIndex: 'uomId',
      width: 100,
      render: (val, record) => (
        <Select
          value={val}
          onChange={(v) => handleDetailChange(record.key, 'uomId', v)}
          style={{ width: '100%' }}
        >
          {uoms.map(u => <Option key={u.id} value={u.id}>{u.masterName}</Option>)}
        </Select>
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
    {
      title: 'Process Name',
      dataIndex: 'processName',
      width: 200
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 120,
      render: (val, record) => (
        <InputNumber 
          value={val} 
          onChange={(v) => handleProcessChange(record.key, 'rate', v)} 
          style={{ width: '100%' }}
          disabled={dcType === 'Sample'}
        />
      )
    },
    {
      title: 'Wet Condition',
      dataIndex: 'wetCondition',
      width: 120,
      render: (val, record) => (
        <input 
          type="checkbox" 
          checked={val} 
          onChange={(e) => handleProcessChange(record.key, 'wetCondition', e.target.checked)} 
        />
      )
    },
    {
      title: 'Prod. Not Req.',
      dataIndex: 'productionNotRequired',
      width: 120,
      render: (val, record) => (
        <input 
          type="checkbox" 
          checked={val} 
          onChange={(e) => handleProcessChange(record.key, 'productionNotRequired', e.target.checked)} 
        />
      )
    },
    {
      title: 'Prod. Close',
      dataIndex: 'productionClose',
      width: 120,
      render: (val, record) => (
        <input 
          type="checkbox" 
          checked={val} 
          onChange={(e) => handleProcessChange(record.key, 'productionClose', e.target.checked)} 
        />
      )
    }
  ];

  const listColumns = [
    { title: 'GRN No', dataIndex: 'grnNo', width: 120 },
    { title: 'GRN Date', dataIndex: 'grnDate', width: 120, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'DC Type', dataIndex: 'dcType', width: 120 },
    { title: 'Fabric Type', dataIndex: 'fabricType', width: 120 },
    { title: 'Total Qty', dataIndex: 'totalQty', width: 100 },
    { title: 'Total Rolls', dataIndex: 'totalRolls', width: 100 },
    {
      title: 'Actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
  const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={3}>Fabric Inward</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>New</Button>
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={fabricInwards} rowKey="id" />
      ) : (
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item label="GRN No" name="grnNo">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="GRN Date" name="grnDate">
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Party" name="partyId">
                <Select showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="PDC No" name="pdcNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="PDC Date" name="pdcDate">
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Dyeing Party" name="dyeingPartyId">
                <Select 
                  showSearch 
                  onChange={setSelectedDyeingParty}
                  filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                >
                  {dyeingParties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Dyeing DC No" name="dyeingDcNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Dyeing DC Date" name="dyeingDcDate">
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Order No" name="orderNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="DC Type" name="dcType">
                <Select onChange={setDcType}>
                  <Option value="Fresh">Fresh</Option>
                  <Option value="Re-Process(Free)">Re-Process(Free)</Option>
                  <Option value="Re-Process(Charge)">Re-Process(Charge)</Option>
                  <Option value="Sample">Sample</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Fabric Type" name="fabricType">
                <Select onChange={setFabricType}>
                  <Option value="Wet Lot">Wet Lot</Option>
                  <Option value="Dry Lot">Dry Lot</Option>
                  <Option value="Grey Lot">Grey Lot</Option>
                  <Option value="Print Lot">Print Lot</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Vehicle No" name="vehicleNo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Remarks" name="remarks">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Title level={5}>Details</Title>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddDetail}>Add Row</Button>
            </div>
            <Table 
              columns={detailColumns} 
              dataSource={details} 
              pagination={false} 
              scroll={{ x: 1200 }}
              size="small"
              footer={() => (
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Total Qty: {totalQty.toFixed(3)} | Total Rolls: {totalRolls}
                </div>
              )}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <Title level={5}>Process Selection</Title>
            <Select
              mode="multiple"
              style={{ width: '100%', marginBottom: 8 }}
              placeholder="Select processes"
              value={selectedProcesses.map(p => p.processId)}
              onChange={handleProcessSelect}
            >
              {processes.map(p => <Option key={p.id} value={p.id}>{p.processName}</Option>)}
            </Select>
            <Table 
              columns={processColumns} 
              dataSource={selectedProcesses} 
              pagination={false}
              size="small"
            />
          </div>

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

export default FabricInward;
