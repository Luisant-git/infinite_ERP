import React, { useEffect } from 'react';
import { Modal, Form, Input, Checkbox, Select, Row, Col } from 'antd';

const { Option } = Select;

const UserForm = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const trimmedValues = {
        ...values,
        userName: values.userName?.trim()
      };
      onSubmit(trimmedValues);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={initialValues ? 'Edit User' : 'Add User'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          active: true,
          add: false,
          edit: false,
          delete: false,
          adminUser: false,
          dcClose: false
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="User Name"
              name="userName"
              rules={[{ required: true, message: 'Please input user name!' }]}
            >
              <Input placeholder="Enter user name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: !initialValues, message: 'Please input password!' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Concern"
          name="concernId"
          rules={[{ required: true, message: 'Please select concern!' }]}
        >
          <Select placeholder="Select concern">
            <Option value="1">Concern 1</Option>
            <Option value="2">Concern 2</Option>
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="adminUser" valuePropName="checked">
              <Checkbox>Admin User</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dcClose" valuePropName="checked">
              <Checkbox>DC Close</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="active" valuePropName="checked">
              <Checkbox>Active</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="add" valuePropName="checked">
              <Checkbox>Add</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="edit" valuePropName="checked">
              <Checkbox>Edit</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="delete" valuePropName="checked">
              <Checkbox>Delete</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserForm;