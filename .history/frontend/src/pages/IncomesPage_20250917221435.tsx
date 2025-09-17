import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const IncomesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Доходы
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница доходов в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица с доходами, форма создания и редактирования доходов, статистика.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IncomesPage;
