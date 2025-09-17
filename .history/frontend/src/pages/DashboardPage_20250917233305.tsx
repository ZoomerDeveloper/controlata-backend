import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Alert,
  Tag,
  List,
  Typography,
  Space,
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { DashboardStats } from '../types';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Ошибка" description={error} type="error" showIcon />;
  }

  if (!stats) {
    return <Alert message="Информация" description="Нет данных для отображения" type="info" showIcon />;
  }

  return (
    <div>
      <Title level={2}>Дашборд</Title>
      
      <Row gutter={[16, 16]}>
        {/* Основные метрики */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Заказы"
              value={stats?.orders?.total || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Доходы"
              value={stats?.finances?.revenue || 0}
              prefix={<DollarOutlined />}
              suffix="€"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Расходы"
              value={stats?.finances?.expenses || 0}
              prefix={<ArrowDownOutlined />}
              suffix="€"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Прибыль"
              value={stats?.finances?.profit || 0}
              prefix={<ArrowUpOutlined />}
              suffix="€"
              valueStyle={{ color: (stats?.finances?.profit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>

        {/* График доходов и расходов */}
        <Col xs={24} md={16}>
          <Card title="Финансовый обзор">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { name: 'Янв', доходы: (stats?.finances?.revenue || 0) * 0.8, расходы: (stats?.finances?.expenses || 0) * 0.9 },
                { name: 'Фев', доходы: (stats?.finances?.revenue || 0) * 0.9, расходы: (stats?.finances?.expenses || 0) * 0.8 },
                { name: 'Мар', доходы: stats?.finances?.revenue || 0, расходы: stats?.finances?.expenses || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, '']} />
                <Line type="monotone" dataKey="доходы" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="расходы" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Статусы заказов */}
        <Col xs={24} md={8}>
          <Card title="Статусы заказов">
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats?.orders?.byStatus?.map((status) => (
                <div key={status.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={status.status === 'COMPLETED' ? 'success' : 'default'}>
                    {status.status}
                  </Tag>
                  <Text>{status._count.id} заказов</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Материалы с низким остатком */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <WarningOutlined />
                Материалы с низким остатком
              </Space>
            }
          >
            {stats.analytics?.lowStockMaterials?.length > 0 ? (
              <List
                dataSource={stats.analytics.lowStockMaterials}
                renderItem={(material) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ color: '#faad14' }} />}
                      title={material.name}
                      description={`Остаток: ${material.currentStock} ${material.unit} (мин: ${material.minLevel})`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Все материалы в наличии</Text>
            )}
          </Card>
        </Col>

        {/* Топ клиенты */}
        <Col xs={24} md={12}>
          <Card title="Топ клиенты">
            {stats.analytics.topCustomers.length > 0 ? (
              <List
                dataSource={stats.analytics.topCustomers}
                renderItem={(customer, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={customer.customerName}
                      description={`€${customer._sum.totalPrice.toLocaleString()} (${customer._count.id} заказов)`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Нет данных о клиентах</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
