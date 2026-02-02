import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Table, Modal, Typography, Select, InputNumber, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { getPartyProcessRates, createPartyProcessRate, updatePartyProcessRate, deletePartyProcessRate, copyPartyProcessRates } from '../../api/partyProcessRate';
import { getParties } from '../../api/party';
import { getProcesses } from '../../api/process';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const PartyProcessRateSetting = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [copyFromParty, setCopyFromParty] = useState(null);
  const [rates, setRates] = useState([]);
  const [parties, setParties] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadParties();
    loadProcesses();
  }, []);

  const loadParties = async () => {
    try {
      const response = await getParties('', 1, 1000);
      setParties(response.data || response);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadProcesses = async () => {
    try {
      const response = await getProcesses('', 1, 1000);
      setProcesses(response.data || response);
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

  const loadRates = async (partyId) => {
    try {
      const response = await getPartyProcessRates(partyId);
      setRates(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading rates:', error);
      setRates([]);
    }
  };

  const handlePartyChange = (partyId) => {
    setSelectedParty(partyId);
    loadRates(partyId);
    setEditingKey('');
  };

  const handleAdd = () => {
    if (!selectedParty) {
      Modal.warning({ title: 'Warning', content: 'Please select a party first!' });
      return;
    }
    const newRate = {
      id: `new_${Date.now()}`,
      partyId: selectedParty,
      processId: null,
      ratePerKg: 0,
      ratePerPiece: 0,
      minAmount: 0,
      minKgsProcess: 0,
      isNew: true,
    };
    setRates([...rates, newRate]);
    setEditingKey(newRate.id);
  };

  const handleSave = async (record) => {
    try {
      setLoading(true);
      const row = rates.find(r => r.id === record.id);
      
      if (!row.processId) {
        Modal.error({ title: 'Error', content: 'Please select a process!' });
        return;
      }

      const data = {
        partyId: selectedParty,
        processId: row.processId,
        ratePerKg: row.ratePerKg || 0,
        ratePerPiece: row.ratePerPiece || 0,
        minAmount: row.minAmount || 0,
        minKgsProcess: row.minKgsProcess || 0,
      };

      if (record.isNew) {
        await createPartyProcessRate(data);
      } else {
        await updatePartyProcessRate(record.id, data);
      }
      
      loadRates(selectedParty);
      setEditingKey('');
    } catch (error) {
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to save rate' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record) => {
    if (record.isNew) {
      setRates(rates.filter(r => r.id !== record.id));
      return;
    }
    Modal.confirm({
      title: 'Delete Rate',
      content: 'Are you sure you want to delete this rate?',
      onOk: async () => {
        try {
          await deletePartyProcessRate(record.id);
          loadRates(selectedParty);
        } catch (error) {
          console.error('Error deleting rate:', error);
        }
      }
    });
  };

  const handleCopy = async () => {
    if (!copyFromParty || !selectedParty) {
      Modal.warning({ title: 'Warning', content: 'Please select both parties!' });
      return;
    }
    try {
      await copyPartyProcessRates(copyFromParty, selectedParty);
      Modal.success({ title: 'Success', content: 'Rates copied successfully!' });
      loadRates(selectedParty);
      setCopyFromParty(null);
    } catch (error) {
      Modal.error({ title: 'Error', content: 'Failed to copy rates' });
    }
  };

  const handleFieldChange = (id, field, value) => {
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const columns = [
    {
      title: 'Process',
      dataIndex: 'processId',
      width: 200,
      render: (val, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <Select
            value={val}
            onChange={(v) => handleFieldChange(record.id, 'processId', v)}
            style={{ width: '100%' }}
            placeholder="Select process"
          >
            {processes.map(p => (
              <Option key={p.id} value={p.id}>{p.processName}</Option>
            ))}
          </Select>
        ) : (
          processes.find(p => p.id === val)?.processName || ''
        );
      },
    },
    {
      title: 'Rate / Kg',
      dataIndex: 'ratePerKg',
      width: 120,
      render: (val, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <InputNumber
            value={val}
            onChange={(v) => handleFieldChange(record.id, 'ratePerKg', v)}
            style={{ width: '100%' }}
            precision={2}
            controls={false}
          />
        ) : (
          Number(val || 0).toFixed(2)
        );
      },
    },
    {
      title: 'Rate / Piece',
      dataIndex: 'ratePerPiece',
      width: 120,
      render: (val, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <InputNumber
            value={val}
            onChange={(v) => handleFieldChange(record.id, 'ratePerPiece', v)}
            style={{ width: '100%' }}
            precision={2}
            controls={false}
          />
        ) : (
          Number(val || 0).toFixed(2)
        );
      },
    },
    {
      title: 'Min Amount',
      dataIndex: 'minAmount',
      width: 120,
      render: (val, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <InputNumber
            value={val}
            onChange={(v) => handleFieldChange(record.id, 'minAmount', v)}
            style={{ width: '100%' }}
            precision={2}
            controls={false}
          />
        ) : (
          Number(val || 0).toFixed(2)
        );
      },
    },
    {
      title: 'Min Kgs Process',
      dataIndex: 'minKgsProcess',
      width: 140,
      render: (val, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <InputNumber
            value={val}
            onChange={(v) => handleFieldChange(record.id, 'minKgsProcess', v)}
            style={{ width: '100%' }}
            precision={3}
            controls={false}
          />
        ) : (
          Number(val || 0).toFixed(3)
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        const isEditing = record.id === editingKey;
        return isEditing ? (
          <Space>
            <Button type="link" size="small" onClick={() => handleSave(record)} loading={loading}>Save</Button>
            <Button type="link" size="small" onClick={() => {
              if (record.isNew) {
                setRates(rates.filter(r => r.id !== record.id));
              }
              setEditingKey('');
            }}>Cancel</Button>
          </Space>
        ) : (
          <Space>
            {canEdit() && <Button type="link" size="small" onClick={() => setEditingKey(record.id)}>Edit</Button>}
            {canDelete() && <Button type="link" size="small" danger onClick={() => handleDelete(record)}><DeleteOutlined /></Button>}
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>Party Process Rate Setting</Title>
        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <span>Party:</span>
            <Select
              value={selectedParty}
              onChange={handlePartyChange}
              style={{ width: 300 }}
              placeholder="Select party"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Input
              placeholder="Copy From"
              value={copyFromParty ? parties.find(p => p.id === copyFromParty)?.partyName : ''}
              readOnly
              style={{ width: 200 }}
            />
            <Select
              value={copyFromParty}
              onChange={setCopyFromParty}
              style={{ width: 200 }}
              placeholder="Select party"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy</Button>
          </Space>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={!canAdd() || !selectedParty}
        >
          Add Rate
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rates}
        rowKey="id"
        pagination={false}
        bordered
      />
    </Card>
  );
};

export default PartyProcessRateSetting;
