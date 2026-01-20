import React, { useState } from 'react';
import { Card, Form, Input, Checkbox, Button, Row, Col, Typography, Select, Space, Table, Modal, InputNumber, Tabs, Divider } from 'antd';
import { SaveOutlined, ClearOutlined, PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PartyMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredParties, setFilteredParties] = useState([]);

  // Sample data for the table
  const [parties, setParties] = useState([
    {
      id: 1,
      partyName: 'ABC Suppliers',
      vendorCode: 'V001',
      mobileNo: '9876543210',
      email: 'abc@example.com',
      district: 'Mumbai',
      gstNo: '27ABCDE1234F1Z5',
      active: 1
    },
    {
      id: 2,
      partyName: 'XYZ Customer',
      vendorCode: 'V002',
      mobileNo: '9876543211',
      email: 'xyz@example.com',
      district: 'Ahmedabad',
      gstNo: '24XYZAB5678G1Z2',
      active: 1
    }
  ]);

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredParties(parties);
    } else {
      const filtered = parties.filter(party => 
        party.partyName?.toLowerCase().includes(value.toLowerCase()) ||
        party.vendorCode?.toLowerCase().includes(value.toLowerCase()) ||
        party.mobileNo?.includes(value) ||
        party.gstNo?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredParties(filtered);
    }
  };

  React.useEffect(() => {
    setFilteredParties(parties);
  }, [parties]);

  const handleSubmit = async (values) => {
    try {
      // Process form data
      const formData = {
        ...values,
        active: values.active ? 1 : 0,
        creditDays: values.creditDays || 0
      };
      
      if (editingParty) {
        // Update existing party
        setParties(parties.map(party => 
          party.id === editingParty.id ? { ...formData, id: editingParty.id } : party
        ));
      } else {
        // Add new party
        const newParty = { ...formData, id: Date.now() };
        setParties([...parties, newParty]);
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingParty(null);
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
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>Party Name:</strong> {record.partyName || 'N/A'}</p>
              <p><strong>Vendor Code:</strong> {record.vendorCode || 'N/A'}</p>
              <p><strong>Address 1:</strong> {record.address1 || 'N/A'}</p>
              <p><strong>Address 2:</strong> {record.address2 || 'N/A'}</p>
              <p><strong>Address 3:</strong> {record.address3 || 'N/A'}</p>
              <p><strong>Address 4:</strong> {record.address4 || 'N/A'}</p>
              <p><strong>Pincode:</strong> {record.pincode || 'N/A'}</p>
              <p><strong>District:</strong> {record.district || 'N/A'}</p>
              <p><strong>Mobile:</strong> {record.mobileNo || 'N/A'}</p>
              <p><strong>Phone:</strong> {record.phoneNo || 'N/A'}</p>
            </Col>
            <Col span={12}>
              <p><strong>Email:</strong> {record.email || 'N/A'}</p>
              <p><strong>PAN No:</strong> {record.panNo || 'N/A'}</p>
              <p><strong>Tally Acc Name:</strong> {record.tallyAccName || 'N/A'}</p>
              <p><strong>GST No:</strong> {record.gstNo || 'N/A'}</p>
              <p><strong>Credit Days:</strong> {record.creditDays || 'N/A'}</p>
              <p><strong>Account No:</strong> {record.accountNo || 'N/A'}</p>
              <p><strong>Bank:</strong> {record.bank || 'N/A'}</p>
              <p><strong>IFSC Code:</strong> {record.ifscCode || 'N/A'}</p>
              <p><strong>Branch:</strong> {record.branch || 'N/A'}</p>
              <p><strong>Status:</strong> {record.active === 1 ? 'Active' : 'Inactive'}</p>
            </Col>
          </Row>
          {record.contacts && record.contacts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong>Contacts:</strong>
              <Table 
                size="small" 
                dataSource={record.contacts} 
                pagination={false}
                columns={[
                  { title: 'Name', dataIndex: 'name', key: 'name' },
                  { title: 'Mobile', dataIndex: 'mobileNo', key: 'mobileNo' },
                  { title: 'Email', dataIndex: 'email', key: 'email' },
                  { title: 'WhatsApp', dataIndex: 'whatsappRequired', key: 'whatsappRequired', render: (val) => val ? 'Yes' : 'No' },
                  { title: 'Mail', dataIndex: 'mailRequired', key: 'mailRequired', render: (val) => val ? 'Yes' : 'No' }
                ]}
              />
            </div>
          )}
        </div>
      ),
    });
  };

  const handleEdit = (record) => {
    setEditingParty(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    setParties(parties.filter(party => party.id !== id));
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingParty(null);
  };

  const districts = [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati',
    'Kolhapur', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar',
    'Chandrapur', 'Parbhani', 'Jalna', 'Bhiwandi', 'Nanded', 'Ulhasnagar'
  ];

  const columns = [
    {
      title: 'Party Name',
      dataIndex: 'partyName',
      key: 'partyName',
    },
    {
      title: 'Vendor Code',
      dataIndex: 'vendorCode',
      key: 'vendorCode',
    },
    {
      title: 'Mobile No',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'GST No',
      dataIndex: 'gstNo',
      key: 'gstNo',
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => active === 1 ? 'Active' : 'Inactive',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#52c41a' }} />
          <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Party Master</Title>
        <Space>
          <Input 
            placeholder="Search by name, code, mobile, GST" 
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280, height: 32 }}
            size="small"
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            Add Party
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredParties} 
        rowKey="id"
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
      />

      <Modal
        title={editingParty ? 'Edit Party' : 'Add Party'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="clear" onClick={() => form.resetFields()}>
            Clear
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={() => form.submit()}
          >
            Save
          </Button>,
        ]}
        width={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ active: true, creditDays: 0 }}
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab="Basic Details" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Party Name"
                    name="partyName"
                    rules={[{ required: true, message: 'Please input party name!' }]}
                  >
                    <Input placeholder="Enter party name" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Vendor Code"
                    name="vendorCode"
                  >
                    <Input placeholder="Enter vendor code" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address 1"
                    name="address1"
                  >
                    <Input placeholder="Enter address line 1" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address 2"
                    name="address2"
                  >
                    <Input placeholder="Enter address line 2" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address 3"
                    name="address3"
                  >
                    <Input placeholder="Enter address line 3" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address 4"
                    name="address4"
                  >
                    <Input placeholder="Enter address line 4" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Pincode"
                    name="pincode"
                    rules={[{ pattern: /^[0-9]{6}$/, message: 'Please enter valid 6-digit pincode!' }]}
                  >
                    <Input placeholder="Enter pincode" maxLength={8} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="District"
                    name="district"
                  >
                    <Select placeholder="Choose District" showSearch>
                      {districts.map(district => (
                        <Option key={district} value={district}>{district}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Mobile No"
                    name="mobileNo"
                    rules={[{ pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit mobile number!' }]}
                  >
                    <Input placeholder="Enter mobile number" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Phone No"
                    name="phoneNo"
                    rules={[{ pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number!' }]}
                  >
                    <Input placeholder="Enter phone number" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="E-Mail"
                    name="email"
                    rules={[{ type: 'email', message: 'Please enter valid email!' }]}
                  >
                    <Input placeholder="Enter email" maxLength={20} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="PAN No"
                    name="panNo"
                    rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter valid PAN number!' }]}
                  >
                    <Input placeholder="Enter PAN number" maxLength={20} style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Tally Acc. Name"
                    name="tallyAccName"
                  >
                    <Input placeholder="Enter tally account name" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="GST No"
                    name="gstNo"
                    rules={[
                      { required: true, message: 'Please input GST number!' },
                      { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Please enter valid GST number!' }
                    ]}
                  >
                    <Input placeholder="Enter GST number" maxLength={50} style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Credit Days"
                    name="creditDays"
                  >
                    <InputNumber placeholder="Enter credit days" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="active" valuePropName="checked">
                    <Checkbox>Active</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Bank Details" key="2">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Account No"
                    name="accountNo"
                  >
                    <Input placeholder="Enter account number" maxLength={30} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Bank"
                    name="bank"
                  >
                    <Input placeholder="Enter bank name" maxLength={30} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="IFSC Code"
                    name="ifscCode"
                    rules={[{ pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Please enter valid IFSC code!' }]}
                  >
                    <Input placeholder="Enter IFSC code" maxLength={12} style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Branch"
                    name="branch"
                  >
                    <Input placeholder="Enter branch name" maxLength={30} />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Contact Details" key="3">
              <Form.List name="contacts">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={16} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Name"
                          >
                            <Input placeholder="Enter name" maxLength={50} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'mobileNo']}
                            label="Mobile No"
                            rules={[{ pattern: /^[0-9]{10}$/, message: 'Enter valid mobile!' }]}
                          >
                            <Input placeholder="Mobile number" maxLength={10} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'email']}
                            label="Email"
                            rules={[{ type: 'email', message: 'Enter valid email!' }]}
                          >
                            <Input placeholder="Email" maxLength={12} />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'whatsappRequired']}
                            label="WhatsApp"
                            valuePropName="checked"
                          >
                            <Checkbox />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'mailRequired']}
                            label="Mail"
                            valuePropName="checked"
                          >
                            <Checkbox />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item label=" ">
                            <Button 
                              type="text" 
                              danger 
                              icon={<MinusCircleOutlined />} 
                              onClick={() => remove(name)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Contact
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartyMaster;