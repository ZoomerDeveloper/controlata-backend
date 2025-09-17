import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Card,
  Space,
  Row,
  Col,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  Controlata
                </Title>
                <Text type="secondary">Система отчетности</Text>
              </div>

              {error && (
                <Alert 
                  message="Ошибка" 
                  description={error} 
                  type="error" 
                  showIcon 
                />
              )}

              <Form
                name="login"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Введите email!' },
                    { type: 'email', message: 'Некорректный email!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Введите пароль!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Пароль"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  Тестовый аккаунт: admin@controlata.com / admin123
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;