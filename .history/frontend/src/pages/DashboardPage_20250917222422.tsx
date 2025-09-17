import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Warning,
  AttachMoney,
} from '@mui/icons-material';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="info">Нет данных для отображения</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>
      
      <Grid container spacing={3}>
        {/* Основные метрики */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ShoppingCart color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Заказы
                  </Typography>
                  <Typography variant="h4">
                    {stats.orders.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Доходы
                  </Typography>
                  <Typography variant="h4">
                    €{stats.finances.revenue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Расходы
                  </Typography>
                  <Typography variant="h4">
                    €{stats.finances.expenses.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Прибыль
                  </Typography>
                  <Typography variant="h4" color={stats.finances.profit >= 0 ? 'success.main' : 'error.main'}>
                    €{stats.finances.profit.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* График доходов и расходов */}
        <Grid xs={12} md={8}>
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
        <Grid xs={12} md={4}>
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
        <Grid xs={12} md={6}>
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
        <Grid xs={12} md={6}>
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
