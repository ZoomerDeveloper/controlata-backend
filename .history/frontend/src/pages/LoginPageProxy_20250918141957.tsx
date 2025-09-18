import React, { useState, useEffect } from 'react';
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
  Switch,
  message,
} from 'antd';
import { UserOutlined, LockOutlined, ApiOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPageProxy: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const [proxyStatus, setProxyStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем доступность прокси
    if (typeof window.proxyRequest === 'function') {
      setProxyStatus('available');
    } else {
      setProxyStatus('unavailable');
    }
  }, []);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      if (useProxy && proxyStatus === 'available') {
        // Используем прокси для обхода CORS
        console.log('🔄 Используем прокси для авторизации...');
        
        const response = await window.proxyLogin(values.email, values.password);
        
        if (response.success && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Обновляем контекст авторизации
          login(response.data.user, response.data.token);
          
          message.success('Успешный вход в систему!');
          navigate('/');
        } else {
          setError(response.error || 'Ошибка авторизации');
        }
      } else {
        // Используем обычный API (может не работать из-за CORS)
        console.log('🔄 Используем обычный API...');
        await login(values.email, values.password);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const testProxy = async () => {
    try {
      const response = await window.proxyGet('/');
      console.log('✅ Прокси работает:', response);
      setProxyStatus('available');
    } catch (error) {
      console.error('❌ Прокси не работает:', error);
      setProxyStatus('unavailable');
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

              {/* Статус прокси */}
              <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
                <Space>
                  <ApiOutlined />
                  <Text strong>Статус CORS Proxy:</Text>
                  <Text type={proxyStatus === 'available' ? 'success' : 'danger'}>
                    {proxyStatus === 'checking' ? 'Проверка...' : 
                     proxyStatus === 'available' ? 'Доступен' : 'Недоступен'}
                  </Text>
                  <Button size="small" onClick={testProxy}>
                    Проверить
                  </Button>
                </Space>
              </Card>

              {/* Переключатель режима */}
              <div style={{ textAlign: 'center' }}>
                <Space>
                  <Text>Использовать прокси для обхода CORS:</Text>
                  <Switch 
                    checked={useProxy} 
                    onChange={setUseProxy}
                    disabled={proxyStatus === 'unavailable'}
                  />
                </Space>
              </div>

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
                    {loading ? 'Вход...' : 'Войти'}
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

export default LoginPageProxy;
