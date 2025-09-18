const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

// Конфигурация FTP (замените на ваши данные)
const FTP_CONFIG = {
  host: process.env.SPACEWEB_FTP_HOST || 'your-ftp-host.spaceweb.ru',
  user: process.env.SPACEWEB_FTP_USER || 'your-username',
  password: process.env.SPACEWEB_FTP_PASS || 'your-password',
  port: 21,
  secure: false
};

const BUILD_DIR = path.join(__dirname, '../frontend/build');

async function deployToSpaceWeb() {
  const client = new ftp.Client();
  
  try {
    console.log('🚀 Подключаемся к SpaceWeb FTP...');
    await client.access(FTP_CONFIG);
    console.log('✅ Подключение установлено');

    console.log('📁 Очищаем сервер...');
    try {
      await client.removeDir('/');
    } catch (error) {
      console.log('ℹ️ Папка уже пуста или не существует');
    }

    console.log('📤 Загружаем файлы...');
    await client.uploadFromDir(BUILD_DIR, '/');
    console.log('✅ Файлы загружены');

    console.log('🔍 Проверяем загруженные файлы...');
    const files = await client.list('/');
    console.log(`📊 Загружено ${files.length} файлов:`);
    files.forEach(file => {
      console.log(`  - ${file.name} (${file.size} bytes)`);
    });

    console.log('🎉 Деплой завершен успешно!');
    console.log('🌐 Ваш сайт доступен по адресу: https://your-domain.spaceweb.ru');

  } catch (error) {
    console.error('❌ Ошибка деплоя:', error.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Запуск деплоя
deployToSpaceWeb();
