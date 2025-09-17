import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ExpensesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Расходы
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница расходов в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица с расходами, форма создания и редактирования расходов, статистика.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExpensesPage;
