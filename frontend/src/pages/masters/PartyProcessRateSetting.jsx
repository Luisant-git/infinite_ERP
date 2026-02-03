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
  const [rates, setRates] = useState([]);
  const [allRates, setAllRates] = useState([]);
  const [parties, setParties] = useState([]);
  const [processes, setProcesses] = useState([]);
  const { canEdit } = useMenuPermissions();

  useEffect(() => {
    loadParties();
    loadProcesses();
  }, []);

  useEffect(() => {
    if (processes.length > 0 && parties.length > 0) {
      loadAllRates();
    }
  }, [processes, parties]);

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

  const loadAllRates = async () => {
    try {
      const allPartiesRates = [];
      for (const party of parties) {
        const response = await getPartyProcessRates(party.id);
        const partyRates = Array.isArray(response) ? response : [];
        
        for (const process of processes) {
          const existingRate = partyRates.find(r => r.processId === process.id);
          allPartiesRates.push({
            id: existingRate?.id || `${party.id}_${process.id}`,
            partyId: party.id,
            partyName: party.partyName,
            processId: process.id,
            processName: process.processName,
            ratePerKg: existingRate?.ratePerKg || 0,
            ratePerPiece: existingRate?.ratePerPiece || 0,
            minAmount: existingRate?.minAmount || 0,
            minKgsProcess: existingRate?.minKgsProcess || 0,
            isExisting: !!existingRate,
          });
        }
      }
      setAllRates(allPartiesRates);
      setRates(allPartiesRates);
    } catch (error) {
      console.error('Error loading rates:', error);
      setAllRates([]);
      setRates([]);
    }
  };

  const handlePartyChange = (partyId) => {
    setSelectedParty(partyId);
    if (partyId) {
      setRates(allRates.filter(r => r.partyId === partyId));
    } else {
      setRates(allRates);
    }
  };

  const handleSave = async (record) => {
    try {
      setSavingId(record.id);
      const data = {
        partyId: record.partyId,
        processId: record.processId,
        ratePerKg: record.ratePerKg || 0,
        ratePerPiece: record.ratePerPiece || 0,
        minAmount: record.minAmount || 0,
        minKgsProcess: record.minKgsProcess || 0,
      };

      await updatePartyProcessRate(record.id, data);
      
      Modal.success({ title: 'Success', content: 'Rate saved successfully!' });
      await loadAllRates();
    } catch (error) {
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to save rate' });
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = async () => {
    if (!copyFromParty || !selectedParty) {
      Modal.warning({ title: 'Warning', content: 'Please select both parties!' });
      return;
    }
    if (copyFromParty === selectedParty) {
      Modal.warning({ title: 'Warning', content: 'Cannot copy to the same party!' });
      return;
    }
    try {
      setSavingId('copying');
      await copyPartyProcessRates(copyFromParty, selectedParty);
      Modal.success({ title: 'Success', content: 'Rates copied successfully!' });
      await loadAllRates();
      setCopyFromParty(null);
    } catch (error) {
      Modal.error({ title: 'Error', content: error.response?.data?.message || 'Failed to copy rates' });
    } finally {
      setSavingId(null);
    }
  };

  const handleFieldChange = (id, field, value) => {
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
    setAllRates(allRates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const columns = [
    {
      title: 'Party',
      dataIndex: 'partyName',
      width: 200,
    },
    {
      title: 'Process',
      dataIndex: 'processName',
      width: 180,
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
    {
      title: 'Action',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        canEdit() && (
          <Button 
            type="link" 
            size="small" 
            icon={<SaveOutlined />} 
            onClick={() => handleSave(record)} 
            loading={savingId === record.id}
          >
            Save
          </Button>
        )
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
            <span>Filter Party:</span>
            <Select
              value={selectedParty}
              onChange={handlePartyChange}
              style={{ width: 300 }}
              placeholder="All Parties"
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
          </Space>
          <Space>
            <span>Copy From:</span>
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
            <span>To:</span>
            <Select
              value={selectedParty}
              onChange={setSelectedParty}
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

      <Table
        columns={columns}
        dataSource={rates}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'] }}
        bordered
        size="small"
        className="compact-table"
      />
    </Card>
  );
};

export default PartyProcessRateSetting;
