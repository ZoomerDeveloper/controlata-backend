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
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { Material } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();

  const categories = [
    { value: 'CANVAS', label: 'Холст' },
    { value: 'PAINT', label: 'Краска' },
    { value: 'BRUSH', label: 'Кисть' },
    { value: 'FRAME', label: 'Рамка' },
    { value: 'NUMBER', label: 'Номер' },
    { value: 'PACKAGING', label: 'Упаковка' },
    { value: 'OTHER', label: 'Прочее' }
  ];

  const units = [
    { value: 'шт', label: 'Штуки' },
    { value: 'мл', label: 'Миллилитры' },
    { value: 'г', label: 'Граммы' },
    { value: 'м', label: 'Метры' },
    { value: 'см', label: 'Сантиметры' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await api.getMaterials();
      setMaterials(response.materials);
    } catch (error) {
      message.error('Ошибка загрузки материалов');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    form.setFieldsValue(material);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMaterial(id);
      message.success('Материал удален');
      fetchMaterials();
    } catch (error) {
      message.error('Ошибка удаления материала');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingMaterial) {
        await api.updateMaterial(editingMaterial.id, values);
        message.success('Материал обновлен');
      } else {
        await api.createMaterial(values);
        message.success('Материал создан');
      }
      setModalVisible(false);
      fetchMaterials();
    } catch (error) {
      message.error('Ошибка сохранения материала');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Material) => (
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
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryInfo = categories.find(c => c.value === category);
        return <Tag color="blue">{categoryInfo?.label || category}</Tag>;
      }
    },
    {
      title: 'Единица',
      dataIndex: 'unit',
      key: 'unit'
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Активен' : 'Неактивен'}
        </Tag>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Material) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить материал?"
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

  const lowStockMaterials = materials.filter(m => m.name.includes('краска'));

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Материалы</Title>
              <Text type="secondary">
                Управление материалами для производства картин
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить материал
              </Button>
            </Col>
          </Row>
        </Card>

        {lowStockMaterials.length > 0 && (
          <Alert
            message="Внимание! Низкие остатки"
            description={`${lowStockMaterials.length} материалов с низким остатком`}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Всего материалов"
                value={materials.length}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Активных"
                value={materials.filter(m => m.isActive).length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Неактивных"
                value={materials.filter(m => !m.isActive).length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={materials}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} из ${total} материалов`
            }}
          />
        </Card>
      </Space>

      <Modal
        title={editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
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
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Название материала" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea
              placeholder="Описание материала"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Категория"
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select placeholder="Выберите категорию">
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Единица измерения"
                rules={[{ required: true, message: 'Выберите единицу' }]}
              >
                <Select placeholder="Выберите единицу">
                  {units.map(unit => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Статус"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Активен"
              unCheckedChildren="Неактивен"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingMaterial ? 'Обновить' : 'Создать'}
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

export default MaterialsPage;