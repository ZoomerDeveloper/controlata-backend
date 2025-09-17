import React from 'react';
import { Spin, Typography, Space } from 'antd';

const { Title } = Typography;

const LoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Space direction="vertical" align="center" size="large">
        <Spin size="large" />
        <Title level={4} type="secondary">
          Загрузка...
        </Title>
      </Space>
    </div>
  );
};

export default LoadingSpinner;