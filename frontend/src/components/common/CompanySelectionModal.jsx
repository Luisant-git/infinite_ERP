import React, { useState } from 'react';
import { Modal, Form, Select, Button } from 'antd';

const { Option } = Select;

const CompanySelectionModal = ({ visible, onSelect, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const companies = [
    { id: 1, name: 'ABARNIKA KNITS' },
    { id: 2, name: 'TEXTILE CORP' },
    { id: 3, name: 'FASHION HOUSE' }
  ];

  const years = [
    '2024-2025',
    '2025-2026',
    '2026-2027'
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onSelect(values);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Company Selection"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Select
        </Button>
      ]}
      closable={true}
      maskClosable={false}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          company: 'ABARNIKA KNITS',
          year: '2025-2026'
        }}
      >
        <Form.Item
          label="Company"
          name="company"
          rules={[{ required: true, message: 'Please select a company!' }]}
        >
          <Select placeholder="Select company" size="large">
            {companies.map(company => (
              <Option key={company.id} value={company.name}>
                {company.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Year"
          name="year"
          rules={[{ required: true, message: 'Please select a year!' }]}
        >
          <Select placeholder="Select year" size="large">
            {years.map(year => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanySelectionModal;