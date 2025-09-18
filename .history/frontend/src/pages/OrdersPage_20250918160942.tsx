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
  Checkbox,
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
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Order } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [readyMadePictures, setReadyMadePictures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();
  const [pictureTypes, setPictureTypes] = useState<{[key: number]: boolean}>({});

  const orderStatuses = [
    { value: 'PENDING', label: 'Ожидает', color: 'default' },
    { value: 'IN_PROGRESS', label: 'В работе', color: 'processing' },
    { value: 'COMPLETED', label: 'Завершен', color: 'success' },
    { value: 'CANCELLED', label: 'Отменен', color: 'error' },
    { value: 'DELIVERED', label: 'Доставлен', color: 'blue' }
  ];


  useEffect(() => {
    fetchOrders();
    fetchReadyMadePictures();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.getOrders();
      setOrders((response as any).orders || response.data || []);
    } catch (error) {
      message.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };


  const fetchReadyMadePictures = async () => {
    try {
      const response = await api.getPictures();
      const pictures = (response as any).pictures || response.data || [];
      // Фильтруем только готовые картины и извлекаем изображения из notes
      const readyMade = pictures
        .filter((picture: any) => picture.type === 'READY_MADE')
        .map((picture: any) => {
          // Извлекаем URL изображения из заметок
          const extractImageUrl = (notes: string) => {
            if (!notes) return null;
            const match = notes.match(/Изображение:\s*(https:\/\/[^\s]+)/i);
            return match ? match[1] : null;
          };
          
          return {
            ...picture,
            imageUrl: picture.imageUrl || extractImageUrl(picture.notes || '')
          };
        });
      setReadyMadePictures(readyMade);
    } catch (error) {
      console.error('Ошибка загрузки готовых картин:', error);
    }
  };


  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `ORD-${year}${month}${day}-${time}`;
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    // Генерируем номер заказа автоматически
    const orderNumber = generateOrderNumber();
    form.setFieldsValue({ orderNumber });
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

  const handlePictureSelect = (pictureId: string, fieldName: number) => {
    const selectedPicture = readyMadePictures.find(p => p.id === pictureId);
    if (selectedPicture) {
      // Автоматически заполняем цену и размер
      form.setFieldsValue({
        pictures: {
          [fieldName]: {
            price: selectedPicture.price,
            pictureSizeId: selectedPicture.pictureSizeId
          }
        }
      });
      // Пересчитываем общую сумму
      setTimeout(updateTotalPrice, 100);
    }
  };

  const handlePictureTypeChange = (fieldName: number, isCustomPhoto: boolean) => {
    setPictureTypes(prev => ({
      ...prev,
      [fieldName]: isCustomPhoto
    }));
    
    // Очищаем поля при смене типа
    form.setFieldsValue({
      pictures: {
        [fieldName]: {
          pictureId: undefined,
          name: isCustomPhoto ? '' : undefined,
          price: undefined,
          pictureSizeId: undefined
        }
      }
    });
  };

  const calculateTotalPrice = (pictures: any[]) => {
    if (!pictures || pictures.length === 0) return 0;
    
    return pictures.reduce((total, picture) => {
      const price = parseFloat(picture.price) || 0;
      const quantity = parseInt(picture.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  const updateTotalPrice = () => {
    const formValues = form.getFieldsValue();
    const pictures = formValues.pictures || [];
    const totalPrice = calculateTotalPrice(pictures);
    form.setFieldsValue({ totalPrice });
  };

  const handlePriceChange = () => {
    setTimeout(updateTotalPrice, 100);
  };

  const handleQuantityChange = () => {
    setTimeout(updateTotalPrice, 100);
  };

  const handleSubmit = async (values: any) => {
    try {
      // Обрабатываем картины - добавляем тип и правильные поля
      const processedPictures = (values.pictures || []).map((picture: any, index: number) => {
        const isCustomPhoto = pictureTypes[index];
        
        if (isCustomPhoto) {
          // Для картин по фото - оставляем все поля
          return {
            ...picture,
            type: 'CUSTOM_PHOTO'
          };
        } else {
          // Для готовых картин - оставляем только нужные поля
          return {
            pictureId: picture.pictureId,
            price: picture.price,
            quantity: picture.quantity || 1,
            description: picture.description,
            type: 'READY_MADE'
          };
        }
      });

      const orderData = {
        ...values,
        pictures: processedPictures,
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
    
    const pendingOrders = dayOrders.filter(o => o.status === 'PENDING');
    const inProgressOrders = dayOrders.filter(o => o.status === 'IN_PROGRESS');
    const completedOrders = dayOrders.filter(o => o.status === 'COMPLETED');
    
    return {
      total: dayOrders.length,
      pending: pendingOrders.length,
      inProgress: inProgressOrders.length,
      completed: completedOrders.length,
      orders: dayOrders
    };
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const data = getCalendarData(value);
    
    if (data.total === 0) {
      return null;
    }

    return (
      <div style={{ 
        padding: '2px 4px',
        borderRadius: '4px',
        background: data.total > 0 ? '#f0f8ff' : 'transparent',
        border: data.total > 0 ? '1px solid #d6e4ff' : 'none',
        minHeight: '20px'
      }}>
        {/* Счетчик заказов */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '2px'
        }}>
          <Badge 
            count={data.total} 
            style={{ 
              backgroundColor: data.total > 5 ? '#ff4d4f' : 
                             data.total > 2 ? '#faad14' : '#52c41a',
              fontSize: '10px',
              minWidth: '16px',
              height: '16px',
              lineHeight: '16px'
            }}
          />
        </div>
        
        {/* Детали по статусам */}
        {data.total > 0 && (
          <div style={{ 
            fontSize: '9px', 
            color: '#666',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {data.pending > 0 && <div>⏳ {data.pending}</div>}
            {data.inProgress > 0 && <div>🔄 {data.inProgress}</div>}
            {data.completed > 0 && <div>✅ {data.completed}</div>}
          </div>
        )}
      </div>
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
                rules={[{ required: true, message: 'Номер заказа обязателен' }]}
              >
                <Input.Group compact>
                  <Input 
                    placeholder="ORD-20241218-1234" 
                    readOnly
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      cursor: 'not-allowed',
                      width: 'calc(100% - 80px)'
                    }}
                  />
                  <Button 
                    type="default"
                    onClick={() => {
                      const newOrderNumber = generateOrderNumber();
                      form.setFieldsValue({ orderNumber: newOrderNumber });
                    }}
                    style={{ width: '80px' }}
                  >
                    Новый
                  </Button>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalPrice"
                label="Общая стоимость"
                tooltip="Рассчитывается автоматически из выбранных картин"
              >
                <InputNumber 
                  placeholder="€ 0.00" 
                  style={{ 
                    width: '100%',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    cursor: 'not-allowed'
                  }}
                  formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/€\s?|(,*)/g, '')}
                  readOnly
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
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                          <Col span={24}>
                            <Checkbox
                              checked={pictureTypes[name] || false}
                              onChange={(e) => handlePictureTypeChange(name, e.target.checked)}
                            >
                              По фото заказчика
                            </Checkbox>
                          </Col>
                        </Row>
                        
                        <Row gutter={16}>
                          {pictureTypes[name] ? (
                            // Форма для картины по фото заказчика
                            <>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'name']}
                                  label="Название картины"
                                  rules={[
                                    {
                                      required: pictureTypes[name] || false,
                                      message: 'Введите название картины'
                                    }
                                  ]}
                                >
                                  <Input placeholder="Портрет семьи" />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'pictureSizeId']}
                                  label="Размер"
                                  rules={[
                                    {
                                      required: pictureTypes[name] || false,
                                      message: 'Выберите размер картины'
                                    }
                                  ]}
                                >
                                  <Select placeholder="Выберите размер">
                                    <Option value="small">Маленький (20x30)</Option>
                                    <Option value="medium">Средний (30x40)</Option>
                                    <Option value="large">Большой (40x50)</Option>
                                    <Option value="xlarge">Очень большой (50x70)</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'price']}
                                  label="Цена (€)"
                                  rules={[
                                    {
                                      required: pictureTypes[name] || false,
                                      message: 'Введите цену картины'
                                    }
                                  ]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="0.00"
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                    onChange={handlePriceChange}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'quantity']}
                                  label="Количество"
                                  rules={[{ required: true, message: 'Введите количество' }]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="1"
                                    min={1}
                                    step={1}
                                    onChange={handleQuantityChange}
                                  />
                                </Form.Item>
                              </Col>
                            </>
                          ) : (
                            // Форма для готовой картины
                            <>
                              <Col span={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'pictureId']}
                                  label="Выберите картину"
                                  rules={[
                                    {
                                      required: !pictureTypes[name],
                                      message: 'Выберите готовую картину'
                                    }
                                  ]}
                                >
                                  <Select 
                                    placeholder="Выберите готовую картину"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={(value) => handlePictureSelect(value, name)}
                                    style={{ minHeight: '40px' }}
                                    dropdownStyle={{ maxHeight: '300px' }}
                                  >
                                    {(readyMadePictures || []).map((picture: any) => (
                                      <Option key={picture.id} value={picture.id}>
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: 8,
                                          minHeight: '40px',
                                          padding: '4px 0'
                                        }}>
                                          {picture.imageUrl ? (
                                            <img 
                                              src={picture.imageUrl} 
                                              alt={picture.name}
                                              style={{ 
                                                width: 32, 
                                                height: 32, 
                                                objectFit: 'cover',
                                                borderRadius: 4,
                                                border: '1px solid #d9d9d9',
                                                flexShrink: 0
                                              }}
                                            />
                                          ) : (
                                            <div style={{
                                              width: 32,
                                              height: 32,
                                              backgroundColor: '#f5f5f5',
                                              borderRadius: 4,
                                              border: '1px solid #d9d9d9',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0
                                            }}>
                                              📷
                                            </div>
                                          )}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                              fontWeight: 'bold',
                                              fontSize: '14px',
                                              lineHeight: '1.2',
                                              marginBottom: '2px',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {picture.name}
                                            </div>
                                            <div style={{ 
                                              fontSize: '12px', 
                                              color: '#666',
                                              lineHeight: '1.2'
                                            }}>
                                              {picture.pictureSize?.name} - €{picture.price.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'quantity']}
                                  label="Количество"
                                  rules={[{ required: true, message: 'Введите количество' }]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="1"
                                    min={1}
                                    step={1}
                                    onChange={handleQuantityChange}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'price']}
                                  label="Цена за шт. (€)"
                                  rules={[
                                    {
                                      required: !pictureTypes[name],
                                      message: 'Введите цену за штуку'
                                    }
                                  ]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="0.00"
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                    onChange={handlePriceChange}
                                  />
                                </Form.Item>
                              </Col>
                            </>
                          )}
                        </Row>
                        
                        <Row gutter={16}>
                          <Col span={18}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="Дополнительные детали"
                            >
                              <TextArea 
                                placeholder="Особые пожелания клиента..."
                                rows={2}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item label=" ">
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                              >
                                Удалить
                              </Button>
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        {pictureTypes[name] && (
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'photo']}
                                label="Фото заказчика"
                                rules={[
                                  {
                                    required: pictureTypes[name] || false,
                                    message: 'Загрузите фото заказчика'
                                  }
                                ]}
                              >
                                <Input 
                                  type="file" 
                                  accept="image/*"
                                  placeholder="Выберите фото для картины"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}
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