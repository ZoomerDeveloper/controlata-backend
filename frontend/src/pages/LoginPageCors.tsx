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
  message,
} from 'antd';
import { UserOutlined, LockOutlined, ApiOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiCorsProxy from '../services/apiCorsProxy';

const { Title, Text } = Typography;

const LoginPageCors: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      console.log('🔄 Попытка входа через CORS Proxy...');
      
      // Используем CORS Proxy для обхода ограничений
      const data = await apiCorsProxy.login(values);
      
      if (data.token) {
        // Обновляем контекст авторизации
        login(data.user, data.token);
        
        message.success('Успешный вход в систему через CORS Proxy!');
        navigate('/');
      } else {
        setError('Ошибка авторизации');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации через CORS Proxy:', err);
      setError(err.message || 'Ошибка авторизации через CORS Proxy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card 
            style={{ 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: '16px',
              border: 'none'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  Art24
                </Title>
                <Text type="secondary">
                  Система управления картинами по номерам
                </Text>
              </div>

              {/* Информация о CORS Proxy */}
              <Card size="small" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
                <Space>
                  <ApiOutlined style={{ color: '#1890ff' }} />
                  <Text strong style={{ color: '#1890ff' }}>
                    Используется CORS Proxy для обхода ограничений браузера
                  </Text>
                </Space>
              </Card>

              {error && (
                <Alert
                  message="Ошибка авторизации"
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
                  label="Email"
                  rules={[
                    { required: true, message: 'Введите email' },
                    { type: 'email', message: 'Введите корректный email' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Введите email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Пароль"
                  rules={[
                    { required: true, message: 'Введите пароль' },
                    { min: 6, message: 'Пароль должен содержать минимум 6 символов' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Введите пароль"
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
                    {loading ? 'Вход через CORS Proxy...' : 'Войти через CORS Proxy'}
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  Нет аккаунта?{' '}
                  <Button type="link" onClick={() => navigate('/register')}>
                    Зарегистрироваться
                  </Button>
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPageCors;
