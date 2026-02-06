import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Table, Modal, Typography, Select, InputNumber, Input } from 'antd';
import { SaveOutlined, CopyOutlined } from '@ant-design/icons';
import { getPartyProcessRates, updatePartyProcessRate, copyPartyProcessRates } from '../../api/partyProcessRate';
import { getParties } from '../../api/party';
import { getProcesses } from '../../api/process';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;
const { Option } = Select;

const PartyProcessRateSetting = () => {
  const [savingId, setSavingId] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [copyFromParty, setCopyFromParty] = useState(null);
  const [copyToParty, setCopyToParty] = useState(null);
  const [parties, setParties] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const { canEdit } = useMenuPermissions();

  useEffect(() => {
    loadParties();
    loadProcesses();
  }, []);

  useEffect(() => {
    if (processes.length > 0) {
      setRates(processes.map(process => ({
        id: `new_${process.id}`,
        processId: process.id,
        processName: process.processName,
        ratePerKg: 0,
        ratePerPiece: 0,
        minAmount: 0,
        minKgsProcess: 0,
      })));
    }
  }, [processes]);

  const loadParties = async () => {
    try {
      const response = await getParties('', 1, 1000);
      const allParties = response.data || response;
      const customerParties = allParties.filter(p => 
        p.partyTypes?.some(pt => pt.partyType.partyTypeName.toLowerCase() === 'customer')
      );
      setParties(customerParties);
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

  const handlePartyChange = async (partyId) => {
    setSelectedParty(partyId);
    if (!partyId || processes.length === 0) return;
    
    try {
      setLoading(true);
      const response = await getPartyProcessRates(partyId);
      const partyRates = Array.isArray(response) ? response : [];
      
      setRates(processes.map(process => {
        const existingRate = partyRates.find(r => r.processId === process.id);
        return {
          id: existingRate?.id || `${partyId}_${process.id}`,
          processId: process.id,
          processName: process.processName,
          ratePerKg: existingRate?.ratePerKg || 0,
          ratePerPiece: existingRate?.ratePerPiece || 0,
          minAmount: existingRate?.minAmount || 0,
          minKgsProcess: existingRate?.minKgsProcess || 0,
        };
      }));
    } catch (error) {
      console.error('Error loading rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedParty) {
      Modal.warning({ title: 'Warning', content: 'Please select a party!' });
      return;
    }
    try {
      setSavingId('saving');
      for (const rate of rates) {
        const data = {
          partyId: selectedParty,
          processId: rate.processId,
          ratePerKg: rate.ratePerKg || 0,
          ratePerPiece: rate.ratePerPiece || 0,
          minAmount: rate.minAmount || 0,
          minKgsProcess: rate.minKgsProcess || 0,
        };
        await updatePartyProcessRate(rate.id, data);
      }
      Modal.success({ title: 'Success', content: 'All rates saved successfully!' });
      await handlePartyChange(selectedParty);
    } catch (error) {
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to save rates' });
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = async () => {
    if (!copyFromParty || !copyToParty) {
      Modal.warning({ title: 'Warning', content: 'Please select both parties!' });
      return;
    }
    if (copyFromParty === copyToParty) {
      Modal.warning({ title: 'Warning', content: 'Cannot copy to the same party!' });
      return;
    }
    try {
      setSavingId('copying');
      await copyPartyProcessRates(copyFromParty, copyToParty);
      Modal.success({ title: 'Success', content: 'Rates copied successfully!' });
      if (selectedParty === copyToParty) {
        await handlePartyChange(selectedParty);
      }
      setCopyFromParty(null);
      setCopyToParty(null);
    } catch (error) {
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to copy rates' });
    } finally {
      setSavingId(null);
    }
  };

  const handleFieldChange = (id, field, value) => {
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const columns = [
    {
      title: 'Process',
      dataIndex: 'processName',
      width: 200,
    },
    {
      title: 'Rate / Kg',
      dataIndex: 'ratePerKg',
      width: 120,
      render: (val, record) => (
        <InputNumber
          value={val}
          onChange={(v) => handleFieldChange(record.id, 'ratePerKg', v)}
          style={{ width: '100%' }}
          precision={2}
          controls={false}
          disabled={!canEdit()}
        />
      ),
    },
    {
      title: 'Rate / Piece',
      dataIndex: 'ratePerPiece',
      width: 120,
      render: (val, record) => (
        <InputNumber
          value={val}
          onChange={(v) => handleFieldChange(record.id, 'ratePerPiece', v)}
          style={{ width: '100%' }}
          precision={2}
          controls={false}
          disabled={!canEdit()}
        />
      ),
    },
    {
      title: 'Min Amount',
      dataIndex: 'minAmount',
      width: 120,
      render: (val, record) => (
        <InputNumber
          value={val}
          onChange={(v) => handleFieldChange(record.id, 'minAmount', v)}
          style={{ width: '100%' }}
          precision={2}
          controls={false}
          disabled={!canEdit()}
        />
      ),
    },
    {
      title: 'Min Kgs Process',
      dataIndex: 'minKgsProcess',
      width: 140,
      render: (val, record) => (
        <InputNumber
          value={val}
          onChange={(v) => handleFieldChange(record.id, 'minKgsProcess', v)}
          style={{ width: '100%' }}
          precision={3}
          controls={false}
          disabled={!canEdit()}
        />
      ),
    },
  ];

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          background: #fafafa !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>Party Process Rate Setting</Title>
        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <span>Select Party:</span>
            <Select
              value={selectedParty}
              onChange={handlePartyChange}
              style={{ width: 250 }}
              placeholder="Select Party"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
            {canEdit() && selectedParty && (
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSaveAll}
                loading={savingId === 'saving'}
              >
                Save All
              </Button>
            )}
          </Space>
          <Space>
            <span>Copy From:</span>
            <Select
              value={copyFromParty}
              onChange={setCopyFromParty}
              style={{ width: 200 }}
              placeholder="Select party"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
            <span>To:</span>
            <Select
              value={copyToParty}
              onChange={setCopyToParty}
              style={{ width: 200 }}
              placeholder="Select party"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {parties.map(p => (
                <Option key={p.id} value={p.id}>{p.partyName}</Option>
              ))}
            </Select>
            <Button icon={<CopyOutlined />} onClick={handleCopy} loading={savingId === 'copying'}>Copy</Button>
          </Space>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={rates}
        rowKey="id"
        pagination={false}
        bordered
        size="small"
        className="compact-table"
        loading={loading}
      />
    </Card>
  );
};

export default PartyProcessRateSetting;
