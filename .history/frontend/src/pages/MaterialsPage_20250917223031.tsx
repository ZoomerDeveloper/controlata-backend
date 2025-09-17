import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const MaterialsPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Материалы</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница материалов в разработке
          </Title>
          <Text type="secondary">
            Здесь будет таблица с материалами, форма создания и редактирования материалов, управление складом.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default MaterialsPage;
