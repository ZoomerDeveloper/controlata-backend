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
  List
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Income, Order } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const IncomesPage: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form] = Form.useForm();

  const incomeCategories = [
    { value: 'PICTURE_SALE', label: 'Продажа картины', color: 'blue' },
    { value: 'CUSTOM_WORK', label: 'Индивидуальная работа', color: 'green' },
    { value: 'SERVICE', label: 'Услуги', color: 'orange' },
    { value: 'OTHER', label: 'Прочее', color: 'default' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Наличные' },
    { value: 'CARD', label: 'Карта' },
    { value: 'BANK_TRANSFER', label: 'Банковский перевод' },
    { value: 'ONLINE', label: 'Онлайн платеж' }
  ];

  useEffect(() => {
    fetchIncomes();
    fetchOrders();
  }, []);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const response = await api.getIncomes();
      setIncomes((response as any).incomes || response.data || []);
    } catch (error) {
      message.error('Ошибка загрузки доходов');
    } finally {
      setLoading(false);
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
    setEditingIncome(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    form.setFieldsValue({
      ...income,
      date: income.date ? dayjs(income.date) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteIncome(id);
      message.success('Доход удален');
      fetchIncomes();
    } catch (error) {
      message.error('Ошибка удаления дохода');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const incomeData = {
        ...values,
        date: values.date?.toISOString()
      };

      if (editingIncome) {
        await api.updateIncome(editingIncome.id, incomeData);
        message.success('Доход обновлен');
      } else {
        await api.createIncome(incomeData);
        message.success('Доход создан');
      }
      setModalVisible(false);
      fetchIncomes();
    } catch (error) {
      message.error('Ошибка сохранения дохода');
    }
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Income) => (
        <div>
          <Text strong>{text}</Text>
          {record.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.notes}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryInfo = incomeCategories.find(c => c.value === category);
        return <Tag color={categoryInfo?.color}>{categoryInfo?.label || category}</Tag>;
      }
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#3f8600' }}>
          €{amount.toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodInfo = paymentMethods.find(m => m.value === method);
        return methodInfo?.label || method;
      }
    },
    {
      title: 'Заказ',
      dataIndex: 'order',
      key: 'order',
      render: (order: any) => order ? order.orderNumber : '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Income) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить доход?"
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

  const totalIncome = (incomes || []).reduce((sum, income) => sum + income.amount, 0);
  const thisMonthIncome = (incomes || [])
    .filter(income => dayjs(income.date).isSame(dayjs(), 'month'))
    .reduce((sum, income) => sum + income.amount, 0);
  const averageIncome = (incomes || []).length > 0 ? totalIncome / (incomes || []).length : 0;

  const incomeByCategory = incomeCategories.map(category => {
    const categoryIncomes = (incomes || []).filter(income => income.category === category.value);
    const total = categoryIncomes.reduce((sum, income) => sum + income.amount, 0);
    return {
      category: category.label,
      amount: total,
      count: categoryIncomes.length
    };
  }).filter(item => item.count > 0);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Доходы</Title>
              <Text type="secondary">
                Управление доходами от продаж картин и услуг
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить доход
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Общий доход"
                value={totalIncome}
                prefix={<DollarOutlined />}
                suffix="€"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Этот месяц"
                value={thisMonthIncome}
                prefix={<CalendarOutlined />}
                suffix="€"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Средний доход"
                value={averageIncome}
                prefix={<BarChartOutlined />}
                suffix="€"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card>
              <Table
                columns={columns}
                dataSource={incomes}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} из ${total} доходов`
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Доходы по категориям">
              <List
                dataSource={incomeByCategory}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.category}
                      description={`${item.count} операций`}
                    />
                    <Text strong style={{ color: '#3f8600' }}>
                      €{item.amount.toFixed(2)}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        title={editingIncome ? 'Редактировать доход' : 'Добавить доход'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
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
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Сумма (€)"
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
          </Row>

          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <Input placeholder="Продажа картины 'Котенок в корзинке'" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Категория"
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select placeholder="Выберите категорию">
                  {incomeCategories.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Способ оплаты"
                rules={[{ required: true, message: 'Выберите способ оплаты' }]}
              >
                <Select placeholder="Выберите способ оплаты">
                  {paymentMethods.map(method => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="orderId"
            label="Связанный заказ"
          >
            <Select placeholder="Выберите заказ (необязательно)" allowClear>
              {(orders || []).map(order => (
                <Option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Заметки"
          >
            <TextArea
              placeholder="Дополнительная информация"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingIncome ? 'Обновить' : 'Создать'}
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

export default IncomesPage;