import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Checkbox, message, Modal } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { getParties, updateParty } from '../../api/party';

const { Title } = Typography;

const PartyApproval = () => {
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async (page = 1, pageSize = 10) => {
    try {
      const response = await getParties('', page, pageSize);
      const customerParties = (response.data || response).filter(p => 
        p.partyTypes?.some(pt => pt.partyType.partyTypeName.toLowerCase() === 'customer') && p.isApproval === 0
      );
      setParties(customerParties);
      
      if (response.pagination) {
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: customerParties.length
        });
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const handleApprove = async (record) => {
    setLoading(true);
    try {
      const updateData = {
        partyName: record.partyName,
        partyCode: record.partyCode,
        address1: record.address1,
        address2: record.address2,
        address3: record.address3,
        address4: record.address4,
        pincode: record.pincode,
        district: record.district,
        state: record.state,
        mobileNo: record.mobileNo,
        phoneNo: record.phoneNo,
        email: record.email,
        panNo: record.panNo,
        tallyAccName: record.tallyAccName,
        gstNo: record.gstNo,
        creditDays: record.creditDays,
        isApproval: 1,
        creditAmount: record.creditAmount,
        accountNo: record.accountNo,
        bank: record.bank,
        ifscCode: record.ifscCode,
        branch: record.branch,
        active: record.active,
        partyTypeIds: record.partyTypes?.map(pt => pt.partyTypeId) || [],
        contacts: record.contacts?.map(c => ({
          name: c.name,
          mobileNo: c.mobileNo,
          email: c.email,
          whatsappRequired: c.whatsappRequired,
          mailRequired: c.mailRequired
        })) || []
      };
      await updateParty(record.id, updateData);
      message.success('Party approved successfully');
      loadParties();
    } catch (error) {
      message.error('Failed to approve party');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record) => {
    Modal.info({
      title: 'Party Details',
      width: 800,
      content: (
        <div>
          <p><strong>Party Name:</strong> {record.partyName}</p>
          <p><strong>Address:</strong> {[record.address1, record.address2, record.address3, record.address4].filter(Boolean).join(', ') || 'N/A'}</p>
          <p><strong>District:</strong> {record.district || 'N/A'}</p>
          <p><strong>State:</strong> {record.state || 'N/A'}</p>
          <p><strong>GST No:</strong> {record.gstNo || 'N/A'}</p>
          <p><strong>Mobile No:</strong> {record.mobileNo || 'N/A'}</p>
          <p><strong>Credit Days:</strong> {record.creditDays || 0}</p>
          <p><strong>Credit Amount:</strong> {record.creditAmount || 0}</p>
        </div>
      ),
    });
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Party',
      dataIndex: 'partyName',
      key: 'partyName',
      width: 180,
    },
    {
      title: 'Address',
      key: 'address',
      width: 200,
      render: (_, record) => {
        const address = record.address1 || record.address2 || record.address3 || record.address4 || 'N/A';
        return address;
      },
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      width: 120,
    },
    {
      title: 'GST No',
      dataIndex: 'gstNo',
      key: 'gstNo',
      width: 140,
    },
    {
      title: 'Mobile No',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      width: 110,
    },
    {
      title: 'Credit Days',
      dataIndex: 'creditDays',
      key: 'creditDays',
      width: 100,
    },
    {
      title: 'Credit Amount',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      width: 120,
      render: (val) => val || 0,
    },
    {
      title: 'Approval Check Box',
      dataIndex: 'approval',
      key: 'approval',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Checkbox 
          checked={false}
          onChange={(e) => {
            if (e.target.checked) {
              handleApprove(record);
            }
          }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
        </Space>
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
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Party Master Approval</Title>
      </div>

      <Table 
        columns={columns} 
        dataSource={parties} 
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => loadParties(page, pageSize),
          onShowSizeChange: (current, size) => loadParties(1, size)
        }}
        className="compact-table"
      />
    </Card>
  );
};

export default PartyApproval;
