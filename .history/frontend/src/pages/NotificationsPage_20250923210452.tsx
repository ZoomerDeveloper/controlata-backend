import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Badge,
  Button,
  Space,
  Typography,
  Tag,
  Empty,
  Spin,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Text } = Typography;

interface Notification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  read: number;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    read: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async (filter?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter === 'unread') params.isRead = false;
      if (filter === 'critical') params.severity = 'CRITICAL';
      if (filter === 'warning') params.severity = 'WARNING';
      
      const response = await api.getNotifications(params);
      setNotifications(response.notifications || []);
    } catch (error) {
      message.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getNotificationStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Ошибка загрузки статистики уведомлений:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      fetchStats();
      message.success('Уведомление отмечено как прочитанное');
    } catch (error) {
      message.error('Ошибка обновления уведомления');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      fetchStats();
      message.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      message.error('Ошибка обновления уведомлений');
    }
  };

  const checkLowStock = async () => {
    try {
      setLoading(true);
      await api.checkLowStock();
      message.success('Проверка остатков материалов выполнена');
      fetchNotifications();
      fetchStats();
    } catch (error) {
      message.error('Ошибка проверки остатков');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOld = async () => {
    try {
      await api.cleanupOldNotifications();
      message.success('Старые уведомления удалены');
      fetchNotifications();
      fetchStats();
    } catch (error) {
      message.error('Ошибка очистки уведомлений');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'WARNING':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'INFO':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'red';
      case 'WARNING':
        return 'orange';
      case 'INFO':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'Критическое';
      case 'WARNING':
        return 'Предупреждение';
      case 'INFO':
        return 'Информация';
      default:
        return 'Неизвестно';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (activeTab) {
      case 'unread':
        return !notif.isRead;
      case 'critical':
        return notif.severity === 'CRITICAL';
      case 'warning':
        return notif.severity === 'WARNING';
      default:
        return true;
    }
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BellOutlined /> Уведомления
        </Title>
        <Text type="secondary">
          Управление уведомлениями системы и мониторинг состояния
        </Text>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего уведомлений"
              value={stats.total}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Непрочитанных"
              value={stats.unread}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Критических"
              value={stats.critical}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Предупреждений"
              value={stats.warning}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Действия */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            disabled={stats.unread === 0}
          >
            Отметить все как прочитанные
          </Button>
          <Button 
            icon={<BellOutlined />}
            onClick={checkLowStock}
            loading={loading}
          >
            Проверить остатки материалов
          </Button>
          <Popconfirm
            title="Удалить старые уведомления?"
            description="Это действие удалит все прочитанные уведомления старше 30 дней"
            onConfirm={cleanupOld}
            okText="Да"
            cancelText="Отмена"
          >
            <Button icon={<DeleteOutlined />}>
              Очистить старые
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* Вкладки */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `Все (${notifications.length})`,
            },
            {
              key: 'unread',
              label: `Непрочитанные (${stats.unread})`,
            },
            {
              key: 'critical',
              label: `Критические (${stats.critical})`,
            },
            {
              key: 'warning',
              label: `Предупреждения (${stats.warning})`,
            }
          ]}
        />

        <Spin spinning={loading}>
          {filteredNotifications.length === 0 ? (
            <Empty
              description="Нет уведомлений"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredNotifications}
              renderItem={(notification) => (
                <List.Item
                  style={{
                    backgroundColor: notification.isRead ? '#fafafa' : '#fff',
                    border: notification.severity === 'CRITICAL' ? '1px solid #ff4d4f' : '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    padding: '16px'
                  }}
                  actions={[
                    !notification.isRead && (
                      <Button
                        type="link"
                        icon={<CheckOutlined />}
                        onClick={() => markAsRead(notification.id)}
                      >
                        Отметить как прочитанное
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        dot={!notification.isRead} 
                        color={notification.severity === 'CRITICAL' ? '#ff4d4f' : '#1890ff'}
                      >
                        {getSeverityIcon(notification.severity)}
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong={!notification.isRead}>
                          {notification.title}
                        </Text>
                        <Tag color={getSeverityColor(notification.severity)}>
                          {getSeverityText(notification.severity)}
                        </Tag>
                        {!notification.isRead && (
                          <Tag color="blue">Новое</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          {notification.message}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(notification.createdAt).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default NotificationsPage;
