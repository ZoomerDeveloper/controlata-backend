import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  message,
  Input
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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

interface MovementStats {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  totalAdjustments: number;
  materialsCount: number;
}

const WarehouseReportsPage: React.FC = () => {
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [stats, setStats] = useState<MovementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null as any,
    type: null as string | null,
    material: null as string | null,
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movementsResponse, statsResponse] = await Promise.all([
        api.getAllMovements(1000),
        api.getWarehouseStats()
      ]);

      setMovements(movementsResponse.movements || []);
      setStats(statsResponse.stats || null);
    } catch (error) {
      message.error('Ошибка загрузки данных отчетов');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getFilteredMovements = () => {
    let filtered = [...movements];

    // Фильтр по дате
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(movement => {
        const movementDate = dayjs(movement.createdAt);
        return movementDate.isAfter(startDate.startOf('day')) && 
               movementDate.isBefore(endDate.endOf('day'));
      });
    }

    // Фильтр по типу
    if (filters.type) {
      filtered = filtered.filter(movement => movement.type === filters.type);
    }

    // Фильтр по материалу
    if (filters.material) {
      filtered = filtered.filter(movement => 
        movement.material.name.toLowerCase().includes(filters.material!.toLowerCase())
      );
    }

    // Поиск
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(movement => 
        movement.material.name.toLowerCase().includes(searchLower) ||
        movement.reason.toLowerCase().includes(searchLower) ||
        (movement.notes && movement.notes.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const calculateStats = (movements: MaterialMovement[]) => {
    const totalMovements = movements.length;
    const totalIn = movements.filter(m => m.type === 'IN').length;
    const totalOut = movements.filter(m => m.type === 'OUT').length;
    const totalAdjustments = movements.filter(m => m.type === 'ADJUSTMENT').length;
    const materialsCount = new Set(movements.map(m => m.material.name)).size;

    return {
      totalMovements,
      totalIn,
      totalOut,
      totalAdjustments,
      materialsCount
    };
  };

  const exportToCSV = () => {
    const filteredMovements = getFilteredMovements();
    const csvContent = [
      ['Дата', 'Материал', 'Тип', 'Количество', 'Единица', 'Причина', 'Заметки'].join(','),
      ...filteredMovements.map(movement => [
        dayjs(movement.createdAt).format('DD.MM.YYYY HH:mm'),
        `"${movement.material.name}"`,
        movement.type === 'IN' ? 'Поступление' : movement.type === 'OUT' ? 'Списание' : 'Корректировка',
        movement.quantity,
        movement.material.unit,
        `"${movement.reason}"`,
        `"${movement.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_movements_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: MaterialMovement, b: MaterialMovement) => 
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
    },
    {
      title: 'Материал',
      dataIndex: ['material', 'name'],
      key: 'material',
      width: 200,
      render: (text: string, record: MaterialMovement) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.material.category} • {record.material.unit}
          </Text>
        </div>
      )
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          'IN': { color: 'green', text: 'Поступление' },
          'OUT': { color: 'red', text: 'Списание' },
          'ADJUSTMENT': { color: 'blue', text: 'Корректировка' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Поступление', value: 'IN' },
        { text: 'Списание', value: 'OUT' },
        { text: 'Корректировка', value: 'ADJUSTMENT' }
      ],
      onFilter: (value: any, record: MaterialMovement) => record.type === value
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (value: number, record: MaterialMovement) => (
        <Text style={{ 
          color: record.type === 'IN' ? '#52c41a' : record.type === 'OUT' ? '#ff4d4f' : '#1890ff',
          fontWeight: 500
        }}>
          {record.type === 'IN' ? '+' : record.type === 'OUT' ? '-' : '='} {value} {record.material.unit}
        </Text>
      ),
      sorter: (a: MaterialMovement, b: MaterialMovement) => a.quantity - b.quantity
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Ссылка',
      dataIndex: 'referenceType',
      key: 'referenceType',
      width: 100,
      render: (type: string, record: MaterialMovement) => {
        if (!type) return '-';
        const typeMap = {
          'ORDER': { color: 'blue', text: 'Заказ' },
          'PICTURE': { color: 'green', text: 'Картина' },
          'PURCHASE': { color: 'orange', text: 'Закупка' },
          'MANUAL': { color: 'purple', text: 'Ручная' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Заметки',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (text: string) => text || '-'
    }
  ];

  const filteredMovements = getFilteredMovements();
  const calculatedStats = calculateStats(filteredMovements);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Отчеты по движению материалов</Title>
      
      {/* Фильтры */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Фильтры</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>Период:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          <Col span={4}>
            <Text strong>Тип движения:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Все типы"
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              allowClear
            >
              <Option value="IN">Поступление</Option>
              <Option value="OUT">Списание</Option>
              <Option value="ADJUSTMENT">Корректировка</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Text strong>Поиск:</Text>
            <Input
              style={{ marginTop: 8 }}
              placeholder="Название материала, причина..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Text strong>Действия:</Text>
            <Space style={{ marginTop: 8 }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
                loading={loading}
              >
                Обновить
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={exportToCSV}
              >
                Экспорт
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Всего движений"
              value={calculatedStats.totalMovements}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Поступления"
              value={calculatedStats.totalIn}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Списания"
              value={calculatedStats.totalOut}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Корректировки"
              value={calculatedStats.totalAdjustments}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Материалов"
              value={calculatedStats.materialsCount}
            />
          </Card>
        </Col>
      </Row>

      {/* Таблица движений */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Движения материалов ({filteredMovements.length})
          </Title>
        </div>

        <Table
          columns={columns}
          dataSource={filteredMovements}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} записей`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default WarehouseReportsPage;
