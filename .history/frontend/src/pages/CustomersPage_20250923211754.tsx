import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalSpent: number;
    orderCount: number;
    lastOrderDate?: string;
  };
  orders: any[];
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      message.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, values);
        message.success('Клиент успешно обновлен');
      } else {
        await api.createCustomer(values);
        message.success('Клиент успешно создан');
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка сохранения клиента');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      message.success('Клиент успешно удален');
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Ошибка удаления клиента');
    }
  };

  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
          {!record.isActive && <Tag color="red">Неактивен</Tag>}
        </Space>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => text ? (
        <Space>
          <MailOutlined />
          {text}
        </Space>
      ) : '-',
    },
    {
      title: 'Город',
      dataIndex: 'city',
      key: 'city',
      render: (text: string) => text ? (
        <Space>
          <HomeOutlined />
          {text}
        </Space>
      ) : '-',
    },
    {
      title: 'Заказов',
      dataIndex: 'stats',
      key: 'orderCount',
      render: (stats: any) => (
        <Tag color="blue">{stats.orderCount}</Tag>
      ),
    },
    {
      title: 'Потрачено',
      dataIndex: 'stats',
      key: 'totalSpent',
      render: (stats: any) => `€${stats.totalSpent.toLocaleString()}`,
    },
    {
      title: 'Последний заказ',
      dataIndex: 'stats',
      key: 'lastOrderDate',
      render: (stats: any) => stats.lastOrderDate ? 
        dayjs(stats.lastOrderDate).format('DD.MM.YYYY') : '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (text: any, record: Customer) => (
        <Space>
          <Tooltip title="Просмотреть детали">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить клиента?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Отмена"
          >
            <Tooltip title="Удалить">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <UserOutlined /> Клиенты
        </Title>
        <Text type="secondary">
          Управление базой клиентов и их заказами
        </Text>
      </div>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего клиентов"
              value={customers.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Активных клиентов"
              value={customers.filter(c => c.isActive).length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="С заказами"
              value={customers.filter(c => c.stats.orderCount > 0).length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Общая выручка"
              value={customers.reduce((sum, c) => sum + c.stats.totalSpent, 0)}
              prefix="€"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Таблица клиентов */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Добавить клиента
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} клиентов`,
          }}
        />
      </Card>

      {/* Модальное окно создания/редактирования */}
      <Modal
        title={editingCustomer ? 'Редактировать клиента' : 'Добавить клиента'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Имя"
                rules={[{ required: true, message: 'Введите имя клиента' }]}
              >
                <Input placeholder="Введите имя" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Телефон"
                rules={[{ required: true, message: 'Введите телефон' }]}
              >
                <Input placeholder="Введите телефон" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Введите корректный email' }]}
              >
                <Input placeholder="Введите email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="Город"
              >
                <Input placeholder="Введите город" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Адрес"
          >
            <Input placeholder="Введите адрес" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="postalCode"
                label="Почтовый индекс"
              >
                <Input placeholder="Введите почтовый индекс" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Страна"
              >
                <Input placeholder="Введите страну" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Заметки"
          >
            <TextArea
              rows={3}
              placeholder="Дополнительные заметки о клиенте"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Детали клиента */}
      <Drawer
        title="Детали клиента"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {selectedCustomer && (
          <div>
            <Card title="Информация о клиенте" style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Имя:</Text> {selectedCustomer.name}
                </div>
                <div>
                  <Text strong>Телефон:</Text> {selectedCustomer.phone}
                </div>
                {selectedCustomer.email && (
                  <div>
                    <Text strong>Email:</Text> {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div>
                    <Text strong>Адрес:</Text> {selectedCustomer.address}
                  </div>
                )}
                {selectedCustomer.city && (
                  <div>
                    <Text strong>Город:</Text> {selectedCustomer.city}
                  </div>
                )}
                {selectedCustomer.postalCode && (
                  <div>
                    <Text strong>Почтовый индекс:</Text> {selectedCustomer.postalCode}
                  </div>
                )}
                {selectedCustomer.country && (
                  <div>
                    <Text strong>Страна:</Text> {selectedCustomer.country}
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div>
                    <Text strong>Заметки:</Text> {selectedCustomer.notes}
                  </div>
                )}
              </Space>
            </Card>

            <Card title="Статистика">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Заказов"
                    value={selectedCustomer.stats.orderCount}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Потрачено"
                    value={selectedCustomer.stats.totalSpent}
                    prefix="€"
                    precision={0}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Средний чек"
                    value={selectedCustomer.stats.orderCount > 0 ? 
                      selectedCustomer.stats.totalSpent / selectedCustomer.stats.orderCount : 0}
                    prefix="€"
                    precision={0}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="История заказов" style={{ marginTop: '16px' }}>
              {selectedCustomer.orders.length > 0 ? (
                <Table
                  dataSource={selectedCustomer.orders}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Номер заказа',
                      dataIndex: 'orderNumber',
                      key: 'orderNumber',
                    },
                    {
                      title: 'Дата',
                      dataIndex: 'orderDate',
                      key: 'orderDate',
                      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
                    },
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => {
                        const statusLabels: { [key: string]: string } = {
                          'PENDING': 'Ожидает',
                          'IN_PROGRESS': 'В работе',
                          'COMPLETED': 'Завершен',
                          'CANCELLED': 'Отменен',
                          'DELIVERED': 'Доставлен'
                        };
                        return <Tag>{statusLabels[status] || status}</Tag>;
                      },
                    },
                    {
                      title: 'Сумма',
                      dataIndex: 'totalPrice',
                      key: 'totalPrice',
                      render: (price: number) => `€${price.toLocaleString()}`,
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">Нет заказов</Text>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomersPage;
