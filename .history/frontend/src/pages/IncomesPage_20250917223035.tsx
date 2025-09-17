import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const IncomesPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Доходы</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница доходов в разработке
          </Title>
          <Text type="secondary">
            Здесь будет таблица с доходами, форма создания и редактирования доходов, статистика.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default IncomesPage;
