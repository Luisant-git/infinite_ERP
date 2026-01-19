import React, { useState } from 'react';
import { Card, Form, Input, Checkbox, Button, Row, Col, Typography, Select, Space, Table, Modal } from 'antd';
import { SaveOutlined, ClearOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const PartyMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  // Sample data for the table
  const [parties, setParties] = useState([
    {
      id: 1,
      name: 'ABC Suppliers',
      partyType: 'Supplier',
      mobileNo: '9876543210',
      email: 'abc@example.com',
      state: 'Maharashtra',
      gstNo: '27ABCDE1234F1Z5',
      active: true
    },
    {
      id: 2,
      name: 'XYZ Customer',
      partyType: 'Customer',
      mobileNo: '9876543211',
      email: 'xyz@example.com',
      state: 'Gujarat',
      gstNo: '24XYZAB5678G1Z2',
      active: true
    }
  ]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingParty) {
        // Update existing party
        setParties(parties.map(party => 
          party.id === editingParty.id ? { ...values, id: editingParty.id } : party
        ));
      } else {
        // Add new party
        const newParty = { ...values, id: Date.now() };
        setParties([...parties, newParty]);
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingParty(null);
    } finally {
      setLoading(false);
    }
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

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Party Type',
      dataIndex: 'partyType',
      key: 'partyType',
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
      title: 'State',
      dataIndex: 'state',
      key: 'state',
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
      render: (active) => active ? 'Active' : 'Inactive',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Party Master</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
        >
          Add Party
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={parties} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
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
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ active: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Party Type"
                name="partyType"
                rules={[{ required: true, message: 'Please select party type!' }]}
              >
                <Select placeholder="Select Process">
                  <Option value="Supplier">Supplier</Option>
                  <Option value="Customer">Customer</Option>
                  <Option value="Both">Both</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please input name!' }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mobile No"
                name="mobileNo"
                rules={[{ pattern: /^[0-9]{10}$/, message: 'Please enter valid mobile number!' }]}
              >
                <Input placeholder="Enter mobile number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone No"
                name="phoneNo"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Address"
                name="address"
              >
                <Input.TextArea placeholder="Enter address" rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="State"
                name="state"
              >
                <Select placeholder="Choose State" showSearch>
                  {states.map(state => (
                    <Option key={state} value={state}>{state}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="E-Mail"
                name="email"
                rules={[{ type: 'email', message: 'Please enter valid email!' }]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="PAN No"
                name="panNo"
                rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter valid PAN number!' }]}
              >
                <Input placeholder="Enter PAN number" maxLength={10} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="GST No"
                name="gstNo"
                rules={[{ pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Please enter valid GST number!' }]}
              >
                <Input placeholder="Enter GST number" maxLength={15} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="active" valuePropName="checked">
                <Checkbox>Active</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartyMaster;