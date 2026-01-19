import React, { useState } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Checkbox, Button, Row, Col, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

const ConcernMaster = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // API call to save concern
      console.log('Save concern:', values);
    } finally {
      setLoading(false);
    }
  };

  const basicInfoTab = (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="Party Name"
          name="partyName"
          rules={[{ required: true, message: 'Please input party name!' }]}
        >
          <Input placeholder="Enter party name" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Vendor Code" name="vendorCode">
          <Input placeholder="Enter vendor code" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Address 1" name="address1">
          <Input placeholder="Enter address 1" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Address 2" name="address2">
          <Input placeholder="Enter address 2" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Address 3" name="address3">
          <Input placeholder="Enter address 3" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Address 4" name="address4">
          <Input placeholder="Enter address 4" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="District" name="district">
          <Input placeholder="Enter district" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Pincode" name="pincode">
          <InputNumber 
            placeholder="Enter pincode" 
            style={{ width: '100%' }}
            controls={false}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Mobile No" name="mobileNo">
          <InputNumber 
            placeholder="Enter mobile number" 
            style={{ width: '100%' }}
            controls={false}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Phone No" name="phoneNo">
          <Input placeholder="Enter phone number" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Email" name="email">
          <Input placeholder="Enter email" type="email" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="PAN No" name="panNo">
          <Input placeholder="Enter PAN number" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="GST No"
          name="gstNo"
          rules={[{ required: true, message: 'Please input GST number!' }]}
        >
          <Input placeholder="Enter GST number" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Tally Account Name" name="tallyAccountName">
          <Input placeholder="Enter tally account name" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="Credit Days" name="creditDays" initialValue={0}>
          <InputNumber 
            placeholder="Enter credit days" 
            style={{ width: '100%' }}
            min={0}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="active" valuePropName="checked" initialValue={true}>
          <Checkbox>Active</Checkbox>
        </Form.Item>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Information',
      children: basicInfoTab
    },
    {
      key: 'bank',
      label: 'Bank Details',
      children: <div>Bank Details Grid (To be implemented)</div>
    },
    {
      key: 'contacts',
      label: 'Contact Details',
      children: <div>Contact Details Grid (To be implemented)</div>
    }
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Concern Master</Title>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          loading={loading}
          onClick={() => form.submit()}
        >
          Save
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Tabs items={tabItems} />
      </Form>
    </Card>
  );
};

export default ConcernMaster;