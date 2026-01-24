import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button } from 'antd';
import { createTenant } from '../../api/auth';
import { getCompanies, getTenants } from '../../api/company';

const { Option } = Select;

const CompanySelectionModal = ({ visible, onSelect, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [companiesData, tenantsData] = await Promise.all([
        getCompanies(),
        getTenants()
      ]);
      setCompanies(companiesData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCompanyChange = (companyName) => {
    setSelectedCompany(companyName);
    form.setFieldsValue({ year: undefined });
  };

  const getAvailableYears = () => {
    if (!selectedCompany) return [];
    return tenants
      .filter(tenant => tenant.concern.partyName === selectedCompany)
      .map(tenant => tenant.financialYear);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Find existing tenant or create new one
      let tenant = tenants.find(t => 
        t.concern.partyName === values.company && 
        t.financialYear === values.year
      );
      
      if (!tenant) {
        tenant = await createTenant(values.company, values.year);
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
            {companies.map(company => (
              <Option key={company.id} value={company.partyName}>
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