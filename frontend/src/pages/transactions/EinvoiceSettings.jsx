import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Space,
  InputNumber,
  Switch,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getEinvoiceSettings,
  createEinvoiceSettings,
  updateEinvoiceSettings,
  deleteEinvoiceSettings,
} from '../../api/billEinvoice';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';

const { Title } = Typography;

const EinvoiceSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { canAdd, canEdit, canDelete } = useMenuPermissions();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getEinvoiceSettings();
      setSettings(data);
      form.setFieldsValue(data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading settings:', error);
        message.error('Failed to load E-invoice settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (settings) {
        await updateEinvoiceSettings(values);
        message.success('Settings updated successfully');
      } else {
        await createEinvoiceSettings(values);
        message.success('Settings created successfully');
      }

      setIsEditing(false);
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteEinvoiceSettings();
      message.success('Settings deleted successfully');
      setSettings(null);
      form.resetFields();
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting settings:', error);
      message.error('Failed to delete settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (settings) {
      form.setFieldsValue(settings);
    } else {
      form.resetFields();
    }
  };

  const handleNew = () => {
    form.resetFields();
    form.setFieldsValue({
      qrCodeSize: 250,
      isActive: true,
    });
    setIsEditing(true);
  };

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          E-invoice Settings
        </Title>
        <Space>
          {!settings && canAdd('einvoice_settings') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNew}
              disabled={isEditing}
            >
              Create Settings
            </Button>
          )}
          {settings && !isEditing && canEdit('einvoice_settings') && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {settings && !isEditing && canDelete('einvoice_settings') && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={loading}
            >
              Delete
            </Button>
          )}
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        disabled={!isEditing}
        initialValues={{
          qrCodeSize: 250,
          isActive: true,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="API URL"
              name="apiUrl"
              rules={[
                { required: true, message: 'Please enter API URL' },
                { type: 'url', message: 'Please enter a valid URL' },
              ]}
            >
              <Input placeholder="Enter api url" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="ASP ID"
              name="aspId"
              rules={[{ required: true, message: 'Please enter ASP ID' }]}
            >
              <Input placeholder="Enter asp id" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Auth Token"
              name="authToken"
              rules={[{ required: true, message: 'Please enter auth token' }]}
            >
              <Input placeholder="Enter auth token" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="QR Code Size"
              name="qrCodeSize"
              rules={[{ required: true, message: 'Please enter QR code size' }]}
            >
              <InputNumber
                min={100}
                max={500}
                style={{ width: '100%' }}
                placeholder="250"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Active"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {isEditing && (
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                Save
              </Button>
            </Space>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default EinvoiceSettings;