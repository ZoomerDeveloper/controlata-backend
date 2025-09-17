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
  TrendingDownOutlined,
  TrendingUpOutlined,
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
              value={stats.orders.total}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Доходы"
              value={stats.finances.revenue}
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
              value={stats.finances.expenses}
              prefix={<TrendingDownOutlined />}
              suffix="€"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Прибыль"
              value={stats.finances.profit}
              prefix={<TrendingUpOutlined />}
              suffix="€"
              valueStyle={{ color: stats.finances.profit >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>

        {/* График доходов и расходов */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Финансовый обзор
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { name: 'Янв', доходы: stats.finances.revenue * 0.8, расходы: stats.finances.expenses * 0.9 },
                  { name: 'Фев', доходы: stats.finances.revenue * 0.9, расходы: stats.finances.expenses * 0.8 },
                  { name: 'Мар', доходы: stats.finances.revenue, расходы: stats.finances.expenses },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, '']} />
                  <Line type="monotone" dataKey="доходы" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="расходы" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Статусы заказов */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статусы заказов
              </Typography>
              <Box>
                {stats.orders.byStatus.map((status) => (
                  <Box key={status.status} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip 
                      label={status.status} 
                      size="small" 
                      color={status.status === 'COMPLETED' ? 'success' : 'default'}
                    />
                    <Typography variant="body2">
                      {status._count.id} заказов
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Материалы с низким остатком */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Warning color="warning" sx={{ mr: 1 }} />
                Материалы с низким остатком
              </Typography>
              {stats.analytics.lowStockMaterials.length > 0 ? (
                <List dense>
                  {stats.analytics.lowStockMaterials.map((material) => (
                    <ListItem key={material.id}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={material.name}
                        secondary={`Остаток: ${material.currentStock} ${material.unit} (мин: ${material.minLevel})`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Все материалы в наличии
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Топ клиенты */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Топ клиенты
              </Typography>
              {stats.analytics.topCustomers.length > 0 ? (
                <List dense>
                  {stats.analytics.topCustomers.map((customer, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={customer.customerName}
                        secondary={`€${customer._sum.totalPrice.toLocaleString()} (${customer._count.id} заказов)`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Нет данных о клиентах
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
