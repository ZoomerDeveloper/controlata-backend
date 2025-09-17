const fs = require('fs');
const path = require('path');

// Список файлов для исправления
const files = [
  'src/routes/pictures.js',
  'src/routes/incomes.js', 
  'src/routes/expenses.js',
  'src/routes/reports.js',
  'src/routes/dashboard.js'
];

// Функция для исправления файла
function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Заменяем импорт контроллера на деструктуризацию
    content = content.replace(
      /const (\w+)Controller = require\('\.\.\/controllers\/(\w+)Controller'\);/g,
      (match, controllerName, controllerFile) => {
        // Получаем экспорты из контроллера
        const controllerPath = `src/controllers/${controllerFile}Controller.js`;
        if (fs.existsSync(controllerPath)) {
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          const exportMatch = controllerContent.match(/module\.exports = \{([^}]+)\}/);
          if (exportMatch) {
            const exports = exportMatch[1]
              .split(',')
              .map(exp => exp.trim())
              .filter(exp => exp)
              .join(',\n  ');
            return `const {\n  ${exports}\n} = require('../controllers/${controllerFile}Controller');`;
          }
        }
        return match;
      }
    );
    
    // Заменяем вызовы контроллера
    content = content.replace(
      new RegExp(`(\\w+Controller\\.\\w+)`, 'g'),
      (match, fullCall) => {
        const methodName = fullCall.split('.')[1];
        return methodName;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен файл: ${filePath}`);
  } catch (error) {
    console.error(`❌ Ошибка в файле ${filePath}:`, error.message);
  }
}

// Исправляем все файлы
files.forEach(fixRouteFile);

console.log('🎉 Все файлы исправлены!');
