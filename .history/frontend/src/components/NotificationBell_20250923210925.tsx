import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Drawer,
  List,
  Typography,
  Tag,
  Space,
  Empty,
  Spin,
  message
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

const { Text } = Typography;

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

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    read: 0
  });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    
    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications({ limit: 10 });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
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

  const unreadNotifications = notifications.filter(notif => !notif.isRead);

  return (
    <>
      <Badge 
        count={stats.unread} 
        size="small"
        style={{ 
          backgroundColor: stats.critical > 0 ? '#ff4d4f' : '#1890ff' 
        }}
      >
        <Button
          type="text"
          icon={<BellOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{
            color: stats.critical > 0 ? '#ff4d4f' : '#1890ff',
            fontSize: '18px',
            height: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Badge>

      <Drawer
        title={
          <Space>
            <BellOutlined />
            <span>Уведомления</span>
            {stats.unread > 0 && (
              <Tag color="blue">{stats.unread} новых</Tag>
            )}
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
        extra={
          <Space>
            {stats.unread > 0 && (
              <Button 
                type="link" 
                size="small"
                onClick={markAllAsRead}
              >
                Отметить все
              </Button>
            )}
            <Button 
              type="link" 
              size="small"
              onClick={checkLowStock}
              loading={loading}
            >
              Проверить остатки
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {notifications.length === 0 ? (
            <Empty
              description="Нет уведомлений"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  style={{
                    backgroundColor: notification.isRead ? '#fafafa' : '#fff',
                    border: notification.severity === 'CRITICAL' ? '1px solid #ff4d4f' : '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    padding: '12px'
                  }}
                  actions={[
                    !notification.isRead && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => markAsRead(notification.id)}
                      >
                        Прочитано
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
                        <Text strong={!notification.isRead} style={{ fontSize: '14px' }}>
                          {notification.title}
                        </Text>
                        <Tag color={getSeverityColor(notification.severity)}>
                          {getSeverityText(notification.severity)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px', fontSize: '13px' }}>
                          {notification.message}
                        </div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {dayjs(notification.createdAt).format('DD.MM HH:mm')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>

        {notifications.length > 0 && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: '16px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fff'
          }}>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Всего: {stats.total} | Непрочитанных: {stats.unread}
              </Text>
              {stats.critical > 0 && (
                <Tag color="red">
                  Критических: {stats.critical}
                </Tag>
              )}
            </Space>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default NotificationBell;
