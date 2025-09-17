import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const OrdersPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Заказы
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница заказов в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица с заказами, форма создания и редактирования заказов.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrdersPage;
