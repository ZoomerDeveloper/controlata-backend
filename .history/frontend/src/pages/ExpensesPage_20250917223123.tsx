import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const ExpensesPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Расходы</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница расходов в разработке
          </Title>
          <Text type="secondary">
            Здесь будет таблица с расходами, форма создания и редактирования расходов, статистика.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default ExpensesPage;
