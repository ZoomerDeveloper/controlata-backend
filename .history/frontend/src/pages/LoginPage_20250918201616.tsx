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
  Divider,
} from 'antd';
import { UserOutlined, LockOutlined, PaintBrushOutlined } from '@ant-design/icons';
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} lg={12} style={{ display: 'flex', alignItems: 'center' }}>
          {/* Левая часть - информация о системе */}
          <div style={{ 
            padding: '40px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '60px 40px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <PaletteOutlined style={{ 
                fontSize: '64px', 
                color: '#fff',
                marginBottom: '20px'
              }} />
              <Title level={1} style={{ 
                color: '#fff', 
                margin: '0 0 16px 0',
                fontSize: '36px',
                fontWeight: '700'
              }}>
                Art24
              </Title>
              <Title level={3} style={{ 
                color: 'rgba(255,255,255,0.9)', 
                margin: '0 0 24px 0',
                fontWeight: '400'
              }}>
                Система управления картинами по номерам
              </Title>
              <Text style={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                Управляйте заказами, складом материалов и отчетностью<br />
                для вашего бизнеса картин по номерам
              </Text>
            </div>
          </div>
        </Col>
        
        <Col xs={24} lg={12} style={{ display: 'flex', alignItems: 'center' }}>
          {/* Правая часть - форма входа */}
          <Card 
            style={{ 
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              borderRadius: '16px',
              border: 'none'
            }}
            bodyStyle={{ padding: '40px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ 
                  margin: '0 0 8px 0', 
                  color: '#1f2937',
                  fontSize: '28px',
                  fontWeight: '600'
                }}>
                  Добро пожаловать
                </Title>
                <Text style={{ 
                  color: '#6b7280',
                  fontSize: '16px'
                }}>
                  Войдите в систему управления
                </Text>
              </div>

              {error && (
                <Alert 
                  message="Ошибка входа" 
                  description={error} 
                  type="error" 
                  showIcon 
                  style={{ borderRadius: '8px' }}
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
                  style={{ marginBottom: '20px' }}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Email"
                    style={{ 
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Введите пароль!' }]}
                  style={{ marginBottom: '24px' }}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="Пароль"
                    style={{ 
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '24px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{
                      height: '48px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Вход...' : 'Войти в систему'}
                  </Button>
                </Form.Item>
              </Form>

              <Divider style={{ margin: '24px 0' }} />

              <div style={{ textAlign: 'center' }}>
                <Text style={{ 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  Тестовый аккаунт для входа:
                </Text>
                <div style={{ 
                  marginTop: '8px',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Text style={{ 
                    color: '#374151',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}>
                    admin@controlata.com<br />
                    admin123
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;