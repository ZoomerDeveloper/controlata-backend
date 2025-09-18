import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs,
  Divider,
  Calendar,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  TruckOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Order, PictureSize } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pictureSizes, setPictureSizes] = useState<PictureSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const orderStatuses = [
    { value: 'PENDING', label: 'Ожидает', color: 'default' },
    { value: 'IN_PROGRESS', label: 'В работе', color: 'processing' },
    { value: 'COMPLETED', label: 'Завершен', color: 'success' },
    { value: 'CANCELLED', label: 'Отменен', color: 'error' },
    { value: 'DELIVERED', label: 'Доставлен', color: 'blue' }
  ];

  const statusIcons = {
    PENDING: <ClockCircleOutlined />,
    IN_PROGRESS: <ClockCircleOutlined />,
    COMPLETED: <CheckCircleOutlined />,
    CANCELLED: <CloseCircleOutlined />,
    DELIVERED: <TruckOutlined />
  };

  useEffect(() => {
    fetchOrders();
    fetchPictureSizes();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.getOrders();
      setOrders(response.data);
    } catch (error) {
      message.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const fetchPictureSizes = async () => {
    try {
      const response = await api.getPictureSizes();
      setPictureSizes(response.data);
    } catch (error) {
      console.error('Ошибка загрузки размеров картин:', error);
    }
  };


  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      ...order,
      orderDate: order.orderDate ? dayjs(order.orderDate) : null,
      dueDate: order.dueDate ? dayjs(order.dueDate) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteOrder(id);
      message.success('Заказ удален');
      fetchOrders();
    } catch (error) {
      message.error('Ошибка удаления заказа');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const orderData = {
        ...values,
        orderDate: values.orderDate?.toISOString(),
        dueDate: values.dueDate?.toISOString()
      };

      if (editingOrder) {
        await api.updateOrder(editingOrder.id, orderData);
        message.success('Заказ обновлен');
      } else {
        await api.createOrder(orderData);
        message.success('Заказ создан');
      }
      setModalVisible(false);
      fetchOrders();
    } catch (error) {
      message.error('Ошибка сохранения заказа');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      message.success('Статус обновлен');
      fetchOrders();
    } catch (error) {
      message.error('Ошибка обновления статуса');
    }
  };

  const columns = [
    {
      title: 'Номер заказа',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Клиент',
      key: 'customer',
      render: (_: any, record: Order) => (
        <div>
          <Text strong>{record.customerName || 'Не указан'}</Text>
          {record.customerEmail && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <MailOutlined /> {record.customerEmail}
              </Text>
            </div>
          )}
          {record.customerPhone && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <PhoneOutlined /> {record.customerPhone}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = orderStatuses.find(s => s.value === status);
        return (
          <Tag color={statusInfo?.color} icon={statusIcons[status as keyof typeof statusIcons]}>
            {statusInfo?.label || status}
          </Tag>
        );
      }
    },
    {
      title: 'Сумма',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `€${price.toFixed(2)}`
    },
    {
      title: 'Дата заказа',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Срок выполнения',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Картины',
      key: 'pictures',
      render: (_: any, record: Order) => (
        <div>
          <Text>{record._count?.pictures || 0} шт.</Text>
          {record.pictures && record.pictures.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {(record.pictures || []).map(p => p.name).join(', ')}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Select
            value={record.status}
            onChange={(value) => handleStatusChange(record.id, value)}
            style={{ width: 120 }}
            size="small"
          >
            {orderStatuses.map(status => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
          <Popconfirm
            title="Удалить заказ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const pendingOrders = (orders || []).filter(o => o.status === 'PENDING');
  const inProgressOrders = (orders || []).filter(o => o.status === 'IN_PROGRESS');
  const completedOrders = (orders || []).filter(o => o.status === 'COMPLETED');
  const totalRevenue = (orders || []).reduce((sum, o) => sum + o.totalPrice, 0);
  const averageOrderValue = (orders || []).length > 0 ? totalRevenue / (orders || []).length : 0;

  const getCalendarData = (value: dayjs.Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayOrders = (orders || []).filter(order => 
      dayjs(order.orderDate).format('YYYY-MM-DD') === dateStr ||
      dayjs(order.dueDate).format('YYYY-MM-DD') === dateStr
    );
    
    return dayOrders.map(order => ({
      type: dayjs(order.orderDate).format('YYYY-MM-DD') === dateStr ? 'success' : 'warning',
      content: order.orderNumber
    }));
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const data = getCalendarData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {data.map((item, index) => (
          <li key={index}>
            <Badge color={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Заказы</Title>
              <Text type="secondary">
                Управление заказами клиентов и планирование производства
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Создать заказ
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Всего заказов"
                value={(orders || []).length}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="В работе"
                value={inProgressOrders.length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Завершено"
                value={completedOrders.length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Средний чек"
                value={averageOrderValue}
                prefix={<DollarOutlined />}
                suffix="€"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card>
              <Tabs defaultActiveKey="all">
                <TabPane tab="Все заказы" key="all">
                  <Table
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} из ${total} заказов`
                    }}
                  />
                </TabPane>
                <TabPane tab="Ожидают" key="pending">
                  <Table
                    columns={columns}
                    dataSource={pendingOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                  />
                </TabPane>
                <TabPane tab="В работе" key="in_progress">
                  <Table
                    columns={columns}
                    dataSource={inProgressOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                  />
                </TabPane>
                <TabPane tab="Завершены" key="completed">
                  <Table
                    columns={columns}
                    dataSource={completedOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Календарь заказов">
              <Calendar
                dateCellRender={dateCellRender}
                style={{ border: '1px solid #f0f0f0', borderRadius: '6px' }}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        title={editingOrder ? 'Редактировать заказ' : 'Создать заказ'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderNumber"
                label="Номер заказа"
                rules={[{ required: true, message: 'Введите номер заказа' }]}
              >
                <Input placeholder="ORD-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalPrice"
                label="Общая стоимость (ручная)"
                tooltip="Оставьте пустым для автоматического расчета"
              >
                <InputNumber 
                  placeholder="Автоматический расчет" 
                  style={{ width: '100%' }}
                  formatter={value => `₽ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/₽\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Статус"
                initialValue="PENDING"
              >
                <Select placeholder="Выберите статус">
                  {orderStatuses.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="orderDate"
                label="Дата заказа"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Картины в заказе</Divider>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.List name="pictures">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="Название картины"
                              rules={[{ required: true, message: 'Введите название' }]}
                            >
                              <Input placeholder="Портрет семьи" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'pictureSizeId']}
                              label="Размер"
                              rules={[{ required: true, message: 'Выберите размер' }]}
                            >
                              <Select placeholder="Выберите размер">
                                {(pictureSizes || []).map((size: PictureSize) => (
                                  <Option key={size.id} value={size.id}>
                                    {size.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'price']}
                              label="Стоимость"
                              rules={[{ required: true, message: 'Введите стоимость' }]}
                            >
                              <InputNumber 
                                placeholder="0" 
                                style={{ width: '100%' }}
                                formatter={value => `₽ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/₽\s?|(,*)/g, '')}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Button 
                              type="link" 
                              danger 
                              onClick={() => remove(name)}
                              style={{ marginTop: 30 }}
                            >
                              Удалить
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Добавить картину
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>

          <Divider orientation="left">Информация о клиенте</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerName"
                label="Имя клиента"
              >
                <Input placeholder="Иван Петров" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerEmail"
                label="Email"
              >
                <Input placeholder="ivan@example.com" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerPhone"
                label="Телефон"
              >
                <Input placeholder="+7 999 123 45 67" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Детали заказа</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="totalPrice"
                label="Общая сумма (€)"
                rules={[{ required: true, message: 'Введите сумму' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="orderDate"
                label="Дата заказа"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dueDate"
                label="Срок выполнения"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Заметки"
          >
            <TextArea
              placeholder="Дополнительная информация о заказе"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingOrder ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;