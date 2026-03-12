import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, message, Space, Input } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getSettings, updateSettings } from '../../api/settings';

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      form.setFieldsValue({
        enableItemWiseProcess: data.enableItemWiseProcess,
        defaultHsnCode: data.defaultHsnCode || ''
      });
    } catch (error) {
      message.error('Failed to load settings');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await updateSettings(values);
      message.success('Settings updated successfully');
    } catch (error) {
      message.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Settings</h3>
      </div>

      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item 
          label="Enable Item Wise Process" 
          name="enableItemWiseProcess" 
          valuePropName="checked"
          tooltip="When enabled, processes can be managed at item level"
        >
          <Switch />
        </Form.Item>

        <Form.Item 
          label="Default HSN Code" 
          name="defaultHsnCode"
          tooltip="This HSN code will be auto-filled in Fabric Bills"
        >
          <Input 
            placeholder="Enter HSN Code (e.g., 5208)"
            maxLength={20}
            autoComplete="off"
          />
        </Form.Item>

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit}>
              Save Settings
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default Settings;
