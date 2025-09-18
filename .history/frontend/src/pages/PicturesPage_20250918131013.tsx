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
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  CalculatorOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { Picture, Material, PictureSize, Order } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PicturesPage: React.FC = () => {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pictureSizes, setPictureSizes] = useState<PictureSize[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPicture, setEditingPicture] = useState<Picture | null>(null);
  const [pictureType, setPictureType] = useState<'ready' | 'custom'>('ready');
  const [form] = Form.useForm();

  const pictureTypes = [
    { value: 'READY_MADE', label: 'Готовая картина' },
    { value: 'CUSTOM_PHOTO', label: 'По фото заказчика' }
  ];

  const pictureStatuses = [
    { value: 'IN_PROGRESS', label: 'В работе', color: 'blue' },
    { value: 'COMPLETED', label: 'Завершена', color: 'green' },
    { value: 'CANCELLED', label: 'Отменена', color: 'red' }
  ];

  useEffect(() => {
    fetchPictures();
    fetchMaterials();
    fetchPictureSizes();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchPictures();
  }, [pictureType]);

  const fetchPictures = async () => {
    setLoading(true);
    try {
      const response = await api.getPictures();
      const allPictures = (response as any).pictures || response.data || [];
      
      // Разделяем картины по типам
      if (pictureType === 'ready') {
        // Показываем только готовые картины (без привязки к заказу)
        setPictures(allPictures.filter((pic: Picture) => !pic.orderId));
      } else {
        // Показываем картины по заказу
        setPictures(allPictures.filter((pic: Picture) => pic.orderId));
      }
    } catch (error) {
      message.error('Ошибка загрузки картин');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.getMaterials();
      setMaterials((response as any).materials || response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const fetchPictureSizes = async () => {
    try {
      const response = await api.getPictureSizes();
      setPictureSizes((response as any).pictureSizes || response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки размеров картин:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders();
      setOrders((response as any).orders || response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const handleAdd = () => {
    setEditingPicture(null);
    form.resetFields();
    // Устанавливаем тип картины в зависимости от выбранного таба
    form.setFieldsValue({
      type: pictureType === 'ready' ? 'READY_MADE' : 'CUSTOM_PHOTO'
    });
    setModalVisible(true);
  };

  const handleEdit = (picture: Picture) => {
    setEditingPicture(picture);
    form.setFieldsValue(picture);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePicture(id);
      message.success('Картина удалена');
      fetchPictures();
    } catch (error) {
      message.error('Ошибка удаления картины');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Для готовых картин убираем orderId
      const pictureData = { ...values };
      if (pictureType === 'ready') {
        delete pictureData.orderId;
      }
      
      if (editingPicture) {
        await api.updatePicture(editingPicture.id, pictureData);
        message.success('Картина обновлена');
      } else {
        await api.createPicture(pictureData);
        message.success('Картина создана');
      }
      setModalVisible(false);
      fetchPictures();
    } catch (error) {
      message.error('Ошибка сохранения картины');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updatePictureStatus(id, status);
      message.success('Статус обновлен');
      fetchPictures();
    } catch (error) {
      message.error('Ошибка обновления статуса');
    }
  };

  const calculateCost = async (id: string) => {
    try {
      const response = await api.calculatePictureCost(id);
      message.success(`Себестоимость: €${response.costPrice.toFixed(2)}`);
    } catch (error) {
      message.error('Ошибка расчета себестоимости');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Picture) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Изображение',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl: string, record: Picture) => {
        // Извлекаем URL изображения из заметок
        const extractImageUrl = (notes: string) => {
          if (!notes) return null;
          const match = notes.match(/🖼️ ИЗОБРАЖЕНИЕ: (https:\/\/[^\s]+)/);
          return match ? match[1] : null;
        };
        
        const imageUrlFromNotes = extractImageUrl(record.notes || '');
        const finalImageUrl = imageUrl || imageUrlFromNotes;
        
        return finalImageUrl ? (
          <img 
            src={finalImageUrl} 
            alt="Картина" 
            style={{ 
              width: 60, 
              height: 60, 
              objectFit: 'cover',
              borderRadius: 4,
              border: '1px solid #d9d9d9'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div style={{ 
            width: 60, 
            height: 60, 
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            border: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            <PictureOutlined />
          </div>
        );
      }
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = pictureTypes.find(t => t.value === type);
        return <Tag color="blue">{typeInfo?.label || type}</Tag>;
      }
    },
    {
      title: 'Размер',
      dataIndex: 'pictureSize',
      key: 'pictureSize',
      render: (pictureSize: any) => pictureSize?.name || '-'
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = pictureStatuses.find(s => s.value === status);
        return <Tag color={statusInfo?.color}>{statusInfo?.label || status}</Tag>;
      }
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `€${price.toFixed(2)}`
    },
    {
      title: 'Себестоимость',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (costPrice: number) => costPrice ? `€${costPrice.toFixed(2)}` : '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Picture) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<CalculatorOutlined />}
            onClick={() => calculateCost(record.id)}
            title="Рассчитать себестоимость"
          />
          <Popconfirm
            title="Удалить картину?"
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

  const inProgressPictures = (pictures || []).filter(p => p.status === 'IN_PROGRESS');
  const completedPictures = (pictures || []).filter(p => p.status === 'COMPLETED');
  const totalRevenue = (pictures || []).reduce((sum, p) => sum + p.price, 0);
  const totalCost = (pictures || []).reduce((sum, p) => sum + (p.costPrice || 0), 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Картины</Title>
              <Text type="secondary">
                Управление картинами по номерам и расчет себестоимости
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить картину
              </Button>
            </Col>
          </Row>
          
          <Tabs 
            activeKey={pictureType} 
            onChange={(key) => setPictureType(key as 'ready' | 'custom')}
            style={{ marginTop: 16 }}
          >
            <TabPane tab="Готовые картины" key="ready">
              <Text type="secondary">
                Каталог готовых картин для продажи
              </Text>
            </TabPane>
            <TabPane tab="Картины по заказу" key="custom">
              <Text type="secondary">
                Картины, созданные под конкретных клиентов
              </Text>
            </TabPane>
          </Tabs>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Всего картин"
                value={(pictures || []).length}
                prefix={<PictureOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="В работе"
                value={(inProgressPictures || []).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Завершено"
                value={(completedPictures || []).length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Общая выручка"
                value={totalRevenue}
                prefix={<DollarOutlined />}
                suffix="€"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Общая себестоимость"
                value={totalCost}
                prefix={<CalculatorOutlined />}
                suffix="€"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Прибыль"
                value={totalProfit}
                prefix={<DollarOutlined />}
                suffix="€"
                valueStyle={{ color: totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs defaultActiveKey="all">
            <TabPane tab="Все картины" key="all">
              <Table
                columns={columns}
                dataSource={pictures}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} из ${total} картин`
                }}
              />
            </TabPane>
            <TabPane tab="В работе" key="in_progress">
              <Table
                columns={columns}
                dataSource={inProgressPictures}
                loading={loading}
                rowKey="id"
                pagination={false}
              />
            </TabPane>
            <TabPane tab="Завершенные" key="completed">
              <Table
                columns={columns}
                dataSource={completedPictures}
                loading={loading}
                rowKey="id"
                pagination={false}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      <Modal
        title={editingPicture ? 'Редактировать картину' : 'Добавить картину'}
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
                name="name"
                label="Название"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input placeholder="Название картины" />
              </Form.Item>
            </Col>
            {pictureType === 'custom' && (
              <Col span={12}>
                <Form.Item
                  name="orderId"
                  label="Заказ"
                  rules={[{ required: true, message: 'Выберите заказ' }]}
                >
                  <Select placeholder="Выберите заказ">
                    {(orders || []).map(order => (
                      <Option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.customerName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Тип"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <Select placeholder="Выберите тип">
                  {pictureTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pictureSizeId"
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
          </Row>

          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea
              placeholder="Описание картины"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Цена (€)"
                rules={[{ required: true, message: 'Введите цену' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="workHours"
                label="Часы работы"
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Статус"
                initialValue="IN_PROGRESS"
              >
                <Select placeholder="Выберите статус">
                  {pictureStatuses.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Заметки"
          >
            <Input.TextArea
              placeholder="Дополнительные заметки"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="URL изображения"
          >
            <Input
              placeholder="https://example.com/image.jpg"
              addonBefore="🖼️"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPicture ? 'Обновить' : 'Создать'}
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

export default PicturesPage;