import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const MaterialsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Материалы
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница материалов в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица с материалами, форма создания и редактирования материалов, управление складом.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MaterialsPage;
