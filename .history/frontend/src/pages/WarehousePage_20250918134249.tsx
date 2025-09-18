import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Alert,
  Tabs,
  Typography,
  Divider,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  HistoryOutlined,
  WarningOutlined,
  InboxOutlined,
  ExportOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  category: string;
  isActive: boolean;
  currentStock: number;
  minLevel: number;
  isLowStock: boolean;
  pictureSize?: {
    name: string;
  };
}

interface MaterialMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdAt: string;
  material: {
    name: string;
    unit: string;
    category: string;
  };
}

interface WarehouseStats {
  totalMaterials: number;
  lowStockCount: number;
  totalStockValue: number;
  recentMovements: number;
}

const WarehousePage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [movementType, setMovementType] = useState<'add' | 'remove' | 'adjust'>('add');
  const [form] = Form.useForm();
  const [movementForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [materialsResponse, movementsResponse, statsResponse] = await Promise.all([
        api.getWarehouseMaterials(),
        api.getAllMovements(),
        api.getWarehouseStats()
      ]);

      setMaterials(materialsResponse.materials || []);
      setMovements(movementsResponse.movements || []);
      setStats(statsResponse.stats || null);
    } catch (error) {
      message.error('Ошибка загрузки данных склада');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setMovementType('add');
    setSelectedMaterial(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleRemoveMaterial = (material: Material) => {
    setMovementType('remove');
    setSelectedMaterial(material);
    setModalVisible(true);
    form.resetFields();
  };

  const handleAdjustMaterial = (material: Material) => {
    setMovementType('adjust');
    setSelectedMaterial(material);
    setModalVisible(true);
    form.setFieldsValue({
      newQuantity: material.currentStock
    });
  };

  const handleViewHistory = (material: Material) => {
    setSelectedMaterial(material);
    setMovementModalVisible(true);
    fetchMaterialMovements(material.id);
  };

  const fetchMaterialMovements = async (materialId: string) => {
    try {
      const response = await api.getMaterialMovements(materialId);
      setMovements(response.movements || []);
    } catch (error) {
      message.error('Ошибка загрузки истории движений');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (movementType === 'add') {
        await api.addMaterialToStock({
          materialId: selectedMaterial?.id!,
          quantity: values.quantity,
          reason: values.reason,
          notes: values.notes
        });
        message.success('Материал добавлен на склад');
      } else if (movementType === 'remove') {
        await api.post('/warehouse/materials/remove', {
          materialId: selectedMaterial?.id,
          quantity: values.quantity,
          reason: values.reason,
          notes: values.notes
        });
        message.success('Материал списан со склада');
      } else if (movementType === 'adjust') {
        await api.post('/warehouse/materials/adjust', {
          materialId: selectedMaterial?.id,
          newQuantity: values.newQuantity,
          reason: values.reason,
          notes: values.notes
        });
        message.success('Остаток скорректирован');
      }

      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Ошибка выполнения операции');
    }
  };

  const columns = [
    {
      title: 'Материал',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Material) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category} • {record.unit}
          </Text>
        </div>
      )
    },
    {
      title: 'Текущий остаток',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (value: number, record: Material) => (
        <div>
          <Text style={{ 
            color: value < 0 ? '#ff4d4f' : value <= record.minLevel ? '#faad14' : '#52c41a',
            fontWeight: 500
          }}>
            {value} {record.unit}
          </Text>
          {value < 0 && (
            <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
              ⚠️ Отрицательный остаток!
            </div>
          )}
          {value <= record.minLevel && value >= 0 && (
            <div style={{ color: '#faad14', fontSize: '12px' }}>
              ⚠️ Низкий остаток
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Мин. уровень',
      dataIndex: 'minLevel',
      key: 'minLevel',
      render: (value: number, record: Material) => (
        <Text type="secondary">{value} {record.unit}</Text>
      )
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: Material) => {
        if (record.currentStock < 0) {
          return <Tag color="red">Отрицательный</Tag>;
        } else if (record.currentStock <= record.minLevel) {
          return <Tag color="orange">Низкий</Tag>;
        } else {
          return <Tag color="green">Нормальный</Tag>;
        }
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Material) => (
        <Space>
          <Tooltip title="Добавить на склад">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedMaterial(record);
                setMovementType('add');
                setModalVisible(true);
                form.resetFields();
              }}
            />
          </Tooltip>
          <Tooltip title="Списать со склада">
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => handleRemoveMaterial(record)}
            />
          </Tooltip>
          <Tooltip title="Корректировать">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleAdjustMaterial(record)}
            />
          </Tooltip>
          <Tooltip title="История движений">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const movementColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU')
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          'IN': { color: 'green', text: 'Поступление' },
          'OUT': { color: 'red', text: 'Списание' },
          'ADJUSTMENT': { color: 'blue', text: 'Корректировка' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: MaterialMovement) => (
        <Text style={{ 
          color: record.type === 'IN' ? '#52c41a' : record.type === 'OUT' ? '#ff4d4f' : '#1890ff'
        }}>
          {record.type === 'IN' ? '+' : record.type === 'OUT' ? '-' : '='} {value} {record.material.unit}
        </Text>
      )
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Заметки',
      dataIndex: 'notes',
      key: 'notes',
      render: (text: string) => text || '-'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Склад материалов</Title>
      
      {/* Статистика */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Всего материалов"
                value={stats.totalMaterials}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Низкий остаток"
                value={stats.lowStockCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: stats.lowStockCount > 0 ? '#faad14' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Общий остаток"
                value={stats.totalStockValue}
                suffix="ед."
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Движения за неделю"
                value={stats.recentMovements}
                prefix={<ExportOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Предупреждения о низком остатке */}
      {materials.some(m => m.currentStock <= m.minLevel) && (
        <Alert
          message="Внимание!"
          description="У некоторых материалов низкий остаток. Рекомендуется пополнить склад."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Предупреждения об отрицательном остатке */}
      {materials.some(m => m.currentStock < 0) && (
        <Alert
          message="Критическая ситуация!"
          description="У некоторых материалов отрицательный остаток. Требуется немедленная корректировка."
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Материалы на складе</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMaterial}>
            Добавить материал
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Модальное окно для операций с материалами */}
      <Modal
        title={
          movementType === 'add' ? 'Добавить материал на склад' :
          movementType === 'remove' ? 'Списать материал со склада' :
          'Корректировать остаток'
        }
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
          <Form.Item
            name="quantity"
            label={movementType === 'adjust' ? 'Новый остаток' : 'Количество'}
            rules={[{ required: true, message: 'Введите количество' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="Введите количество"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Причина"
            rules={[{ required: true, message: 'Введите причину' }]}
          >
            <Input placeholder="Например: Поступление от поставщика" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Заметки"
          >
            <Input.TextArea placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для истории движений */}
      <Modal
        title={`История движений: ${selectedMaterial?.name}`}
        open={movementModalVisible}
        onCancel={() => setMovementModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={movementColumns}
          dataSource={movements}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default WarehousePage;
