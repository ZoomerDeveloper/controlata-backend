import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const OrdersPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Заказы</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница заказов в разработке
          </Title>
          <Text type="secondary">
            Здесь будет таблица с заказами, форма создания и редактирования заказов.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default OrdersPage;
