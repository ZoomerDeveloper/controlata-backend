import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const PicturesPage: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>Картины</Title>
      <Card>
        <Space direction="vertical" size="middle">
          <Title level={4} type="secondary">
            Страница картин в разработке
          </Title>
          <Text type="secondary">
            Здесь будет таблица с картинами, форма создания и редактирования картин, расчет себестоимости.
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default PicturesPage;
