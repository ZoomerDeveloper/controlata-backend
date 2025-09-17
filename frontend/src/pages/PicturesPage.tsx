import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const PicturesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Картины
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Страница картин в разработке
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица с картинами, форма создания и редактирования картин, расчет себестоимости.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PicturesPage;
