import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ReportsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Отчеты
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница отчетов в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет генерация отчетов P&L, движения денег, анализа продуктов.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsPage;
