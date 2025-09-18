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
  InputNumber,
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
  PictureOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { PictureSize } from '../types';

const { Title, Text } = Typography;

const PictureSizesPage: React.FC = () => {
  const [pictureSizes, setPictureSizes] = useState<PictureSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSize, setEditingSize] = useState<PictureSize | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPictureSizes();
  }, []);

  const fetchPictureSizes = async () => {
    setLoading(true);
    try {
      const response = await api.getPictureSizes();
      setPictureSizes(response.data);
    } catch (error) {
      message.error('Ошибка загрузки размеров картин');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSize(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (size: PictureSize) => {
    setEditingSize(size);
    form.setFieldsValue(size);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePictureSize(id);
      message.success('Размер картин удален');
      fetchPictureSizes();
    } catch (error) {
      message.error('Ошибка удаления размера картин');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingSize) {
        await api.updatePictureSize(editingSize.id, values);
        message.success('Размер картин обновлен');
      } else {
        await api.createPictureSize(values);
        message.success('Размер картин создан');
      }
      setModalVisible(false);
      fetchPictureSizes();
    } catch (error) {
      message.error('Ошибка сохранения размера картин');
    }
  };

  const getSizeCategory = (width: number, height: number) => {
    const area = width * height;
    if (area <= 600) return { label: 'Маленький', color: 'blue' };
    if (area <= 2000) return { label: 'Средний', color: 'green' };
    if (area <= 4000) return { label: 'Большой', color: 'orange' };
    return { label: 'Очень большой', color: 'red' };
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PictureSize) => (
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
      title: 'Размеры',
      key: 'dimensions',
      render: (_: any, record: PictureSize) => (
        <div>
          <Text>{record.width} × {record.height} см</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Площадь: {record.width * record.height} см²
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Категория',
      key: 'category',
      render: (_: any, record: PictureSize) => {
        const category = getSizeCategory(record.width, record.height);
        return <Tag color={category.color}>{category.label}</Tag>;
      }
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
      render: (_: any, record: PictureSize) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Удалить размер картин?"
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

  const activeSizes = (pictureSizes || []).filter(s => s.isActive);
  const inactiveSizes = (pictureSizes || []).filter(s => !s.isActive);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Размеры картин</Title>
              <Text type="secondary">
                Управление размерами картин по номерам
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить размер
              </Button>
            </Col>
          </Row>
        </Card>

        {(inactiveSizes || []).length > 0 && (
          <Alert
            message="Внимание! Неактивные размеры"
            description={`${(inactiveSizes || []).length} размеров неактивны`}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />
        )}

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Всего размеров"
                value={pictureSizes.length}
                prefix={<PictureOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Активных"
                value={activeSizes.length}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Неактивных"
                value={inactiveSizes.length}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={pictureSizes}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} из ${total} размеров`
            }}
          />
        </Card>
      </Space>

      <Modal
        title={editingSize ? 'Редактировать размер картин' : 'Добавить размер картин'}
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
            <Input placeholder="Например: 30x40 см" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea
              placeholder="Описание размера"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="width"
                label="Ширина (см)"
                rules={[{ required: true, message: 'Введите ширину' }]}
              >
                <InputNumber
                  min={1}
                  max={200}
                  style={{ width: '100%' }}
                  placeholder="30"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="height"
                label="Высота (см)"
                rules={[{ required: true, message: 'Введите высоту' }]}
              >
                <InputNumber
                  min={1}
                  max={200}
                  style={{ width: '100%' }}
                  placeholder="40"
                />
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
                {editingSize ? 'Обновить' : 'Создать'}
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

export default PictureSizesPage;
