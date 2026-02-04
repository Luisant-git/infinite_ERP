import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button } from 'antd';
import { useSelector } from 'react-redux';
import { createTenant } from '../../api/auth';

const { Option } = Select;

const CompanySelectionModal = ({ visible, onSelect, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { tenants } = useSelector(state => state.auth);

  const getUniqueCompanies = () => {
    if (!tenants) return [];
    const companies = [...new Set(tenants.map(t => t.company))];
    return companies.map(company => ({ partyName: company }));
  };

  const handleCompanyChange = (companyName) => {
    setSelectedCompany(companyName);
    form.setFieldsValue({ year: undefined });
  };

  const getAvailableYears = () => {
    if (!selectedCompany || !tenants) return [];
    return tenants
      .filter(tenant => tenant.company === selectedCompany)
      .map(tenant => tenant.financialYear);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Find existing tenant
      let tenant = tenants.find(t => 
        t.company === values.company && 
        t.financialYear === values.year
      );
      
      if (!tenant) {
        tenant = await createTenant(values.company, values.year);
      }
      
      console.log('Selected Tenant:', tenant);
      
      // Store concernId in localStorage
      if (tenant.concernId) {
        localStorage.setItem('concernId', tenant.concernId.toString());
        console.log('Stored concernId:', tenant.concernId);
      } else {
        console.log('No concernId found in tenant object');
      }
      
      onSelect({
        company: values.company,
        year: values.year,
        tenantId: tenant.id
      });
    } catch (error) {
      console.error('Tenant selection failed:', error);
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
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit} style={{ marginTop: '8px' }}>
          Select
        </Button>
      ]}
      closable={true}
      maskClosable={false}
      width={400}
      bodyStyle={{ paddingBottom: '16px' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{}}
        style={{ marginTop: '8px' }}
      >
        <Form.Item
          label="Company"
          name="company"
          rules={[{ required: true, message: 'Please select a company!' }]}
          style={{ marginBottom: '16px' }}
        >
          <Select 
            placeholder="Select company" 
            size="large"
            onChange={handleCompanyChange}
            showSearch
            allowClear
          >
            {getUniqueCompanies().map(company => (
              <Option key={company.partyName} value={company.partyName}>
                {company.partyName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Financial Year"
          name="year"
          rules={[{ required: true, message: 'Please select a year!' }]}
          style={{ marginBottom: '0px' }}
        >
          <Select 
            placeholder="Select year" 
            size="large"
            disabled={!selectedCompany}
          >
            {getAvailableYears().map(year => (
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