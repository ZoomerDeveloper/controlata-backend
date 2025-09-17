import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const ReportsPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Отчеты</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница отчетов в разработке
          </Title>
          <Text type="secondary">
            Здесь будет генерация отчетов P&L, движения денег, анализа продуктов.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default ReportsPage;
