import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { 
  getNextGrnNo, getFabricInwards, createFabricInward, updateFabricInward, deleteFabricInward,
  getMastersByType 
} from '../../api/fabricInward';
import { getParties } from '../../api/party';
import { getDesigns } from '../../api/design';
import { getProcesses } from '../../api/process';
import { getPartyProcessRates } from '../../api/partyProcessRate';
import FabricInwardPrint from '../../components/prints/FabricInwardPrint';

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
  const [printData, setPrintData] = useState(null);
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

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
        getMastersByType('Fabric', true),
        getMastersByType('Color', true),
        getMastersByType('Dia', true),
        getMastersByType('UOM', true),
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
    setDetails(record.details?.map(d => ({ ...d, key: d.id })) || []);
    
    const processesWithIds = record.processes?.map(p => {
      const process = processes.find(pr => pr.processName === p.processName);
      return {
        ...p,
        key: p.id,
        processId: process?.id || null
      };
    }) || [];
    
    setSelectedProcesses(processesWithIds);
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

  const handlePrintRecord = (record) => {
    setPrintData(record);
    setTimeout(() => handlePrint(), 100);
  };

  const handleSubmit = async (shouldPrint = false) => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
      const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

      console.log('Details before mapping:', details);

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
          designName: d.designName || '',
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

      console.log('Payload data:', data);

      let savedRecord;
      if (editingId) {
        savedRecord = await updateFabricInward(editingId, data);
        message.success('Updated successfully');
      } else {
        savedRecord = await createFabricInward(data);
        message.success('Created successfully');
      }
      
      setIsFormVisible(false);
      loadData();
      
      if (shouldPrint && savedRecord) {
        setPrintData(savedRecord);
        setTimeout(() => handlePrint(), 500);
      }
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
    setDetails(details.map(d => {
      if (d.key === key) {
        console.log(`Updating ${field}:`, value);
        return { ...d, [field]: value };
      }
      return d;
    }));
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
        <Select
          value={val || undefined}
          onChange={(v) => {
            const design = designs.find(d => d.designName === v);
            if (design) {
              setDetails(details.map(d => 
                d.key === record.key 
                  ? { ...d, designName: v, designId: design.id } 
                  : d
              ));
            } else {
              handleDetailChange(record.key, 'designName', v);
            }
          }}
          style={{ width: '100%' }}
          showSearch
          allowClear
          placeholder="Select design"
          filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
          getPopupContainer={trigger => trigger.parentNode}
        >
          {designs.map(d => <Option key={d.id} value={d.designName}>{d.designName}</Option>)}
        </Select>
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
      title: 'Prod. Not Req.',
      dataIndex: 'productionNotRequired',
      width: 100,
      render: (val, record) => (
        <input 
          type="checkbox" 
          checked={val} 
          onChange={(e) => handleDetailChange(record.key, 'productionNotRequired', e.target.checked)} 
        />
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 150,
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
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => index + 1,
    },
    { title: 'GRN No', dataIndex: 'grnNo', width: 120 },
    { title: 'GRN Date', dataIndex: 'grnDate', width: 120, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'DC Type', dataIndex: 'dcType', width: 120 },
    { title: 'Fabric Type', dataIndex: 'fabricType', width: 120 },
    { title: 'Total Qty', dataIndex: 'totalQty', width: 100 },
    { title: 'Total Rolls', dataIndex: 'totalRolls', width: 100 },
    {
      title: 'Actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {/* <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => handlePrintRecord(record)} style={{ color: '#1890ff' }} /> */}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  const totalQty = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
  const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

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
        <Title level={3}>Fabric Inward</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>New</Button>
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={fabricInwards} rowKey="id" size="small" className="compact-table" />
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
              scroll={{ x: 1800, y: 400 }}
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
              <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSubmit(false)}>Save</Button>
              {/* <Button type="primary" icon={<PrinterOutlined />} loading={loading} onClick={() => handleSubmit(true)}>Save & Print</Button> */}
            </Space>
          </div>
        </Form>
      )}
      
      <div style={{ display: 'none' }}>
        {printData && (
          <FabricInwardPrint 
            ref={printRef} 
            data={{
              ...printData,
              partyName: parties.find(p => p.id === printData.partyId)?.partyName,
              partyAddress: (() => {
                const party = parties.find(p => p.id === printData.partyId);
                if (!party) return '';
                const addressLine = party.address1 || party.address2 || party.address3 || party.address4 || '';
                const locationParts = [party.district, party.state, party.pincode].filter(Boolean);
                const locationLine = locationParts.join(', ');
                return addressLine && locationLine ? `${addressLine}\n${locationLine}` : addressLine || locationLine;
              })(),
              dyeingPartyName: dyeingParties.find(p => p.id === printData.dyeingPartyId)?.partyName
            }} 
            fabrics={fabrics}
            colors={colors}
            dias={dias}
          />
        )}
      </div>
    </Card>
  );
};

export default FabricInward;
