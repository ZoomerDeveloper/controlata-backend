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
  Alert,
  Tabs,
  List,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  HomeOutlined,
  TruckOutlined,
  BulbOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Expense, Material } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  const expenseCategories = [
    { value: 'MATERIALS', label: 'Материалы', color: 'blue', icon: <ShoppingCartOutlined /> },
    { value: 'RENT', label: 'Аренда', color: 'green', icon: <HomeOutlined /> },
    { value: 'LOGISTICS', label: 'Логистика', color: 'orange', icon: <TruckOutlined /> },
    { value: 'MARKETING', label: 'Маркетинг', color: 'purple', icon: <BulbOutlined /> },
    { value: 'UTILITIES', label: 'Коммунальные услуги', color: 'cyan', icon: <HomeOutlined /> },
    { value: 'EQUIPMENT', label: 'Оборудование', color: 'geekblue', icon: <ShoppingCartOutlined /> },
    { value: 'OTHER', label: 'Прочее', color: 'default', icon: <DollarOutlined /> }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Наличные' },
    { value: 'CARD', label: 'Карта' },
    { value: 'BANK_TRANSFER', label: 'Банковский перевод' },
    { value: 'ONLINE', label: 'Онлайн платеж' }
  ];

  useEffect(() => {
    fetchExpenses();
    fetchMaterials();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.getExpenses();
      setExpenses(response.data);
    } catch (error) {
      message.error('Ошибка загрузки расходов');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.getMaterials();
      setMaterials(response.data);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      date: expense.date ? dayjs(expense.date) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteExpense(id);
      message.success('Расход удален');
      fetchExpenses();
    } catch (error) {
      message.error('Ошибка удаления расхода');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const expenseData = {
        ...values,
        date: values.date?.toISOString()
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, expenseData);
        message.success('Расход обновлен');
      } else {
        await api.createExpense(expenseData);
        message.success('Расход создан');
      }
      setModalVisible(false);
      fetchExpenses();
    } catch (error) {
      message.error('Ошибка сохранения расхода');
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
      render: (text: string, record: Expense) => (
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
        const categoryInfo = expenseCategories.find(c => c.value === category);
        return (
          <Tag color={categoryInfo?.color} icon={categoryInfo?.icon}>
            {categoryInfo?.label || category}
          </Tag>
        );
      }
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#cf1322' }}>
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
      title: 'Поставщик',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier: string) => supplier || '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Expense) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить расход?"
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses
    .filter(expense => dayjs(expense.date).isSame(dayjs(), 'month'))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  const expensesByCategory = expenseCategories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category.value);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      category: category.label,
      amount: total,
      count: categoryExpenses.length,
      icon: category.icon
    };
  }).filter(item => item.count > 0);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Расходы</Title>
              <Text type="secondary">
                Управление расходами на материалы, аренду и другие затраты
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить расход
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Общие расходы"
                value={totalExpenses}
                prefix={<DollarOutlined />}
                suffix="€"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Этот месяц"
                value={thisMonthExpenses}
                prefix={<CalendarOutlined />}
                suffix="€"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Средний расход"
                value={averageExpense}
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
                dataSource={expenses}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} из ${total} расходов`
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Расходы по категориям">
              <List
                dataSource={expensesByCategory}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={item.icon}
                      title={item.category}
                      description={`${item.count} операций`}
                    />
                    <Text strong style={{ color: '#cf1322' }}>
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
        title={editingExpense ? 'Редактировать расход' : 'Добавить расход'}
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
            <Input placeholder="Закупка холстов 30x40 см" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Категория"
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select placeholder="Выберите категорию">
                  {expenseCategories.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.icon} {category.label}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="Поставщик"
              >
                <Input placeholder="Художественный магазин 'Кисть'" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="materialId"
                label="Связанный материал"
              >
                <Select placeholder="Выберите материал (необязательно)" allowClear>
                  {materials.map(material => (
                    <Option key={material.id} value={material.id}>
                      {material.name}
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
            <TextArea
              placeholder="Дополнительная информация о расходе"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingExpense ? 'Обновить' : 'Создать'}
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

export default ExpensesPage;