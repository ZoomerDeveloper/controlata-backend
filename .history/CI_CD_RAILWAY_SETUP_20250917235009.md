# Настройка CI/CD с Railway

## 🚀 Автоматический деплой через GitHub Actions

Теперь при каждом push в ветку `main` будет автоматически происходить деплой на Railway.

## 🔑 Настройка Railway Token

### 1. Получение токена Railway

1. Зайдите в [Railway Dashboard](https://railway.app/dashboard)
2. Перейдите в **Settings** → **Tokens**
3. Нажмите **Create Token**
4. Введите название токена (например: "GitHub Actions")
5. Скопируйте созданный токен

### 2. Добавление токена в GitHub Secrets

1. Зайдите в ваш GitHub репозиторий
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. **Name**: `RAILWAY_TOKEN`
5. **Value**: вставьте скопированный токен Railway
6. Нажмите **Add secret**

## 🔄 Как это работает

1. **Push в main** → запускается GitHub Actions
2. **Тестирование** → проверка кода, сборка
3. **Деплой** → автоматический `railway up` с токеном
4. **Готово** → приложение обновлено на Railway

## 📋 Что происходит при деплое

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
  - name: Checkout code
    uses: actions/checkout@v4
    
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'
      
  - name: Install dependencies
    run: npm ci
    
  - name: Install Railway CLI
    run: npm install -g @railway/cli
    
  - name: Deploy to Railway
    run: railway up --detach
    env:
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## ✅ Проверка работы

1. Сделайте любой commit в ветку `main`
2. Зайдите в **Actions** в GitHub репозитории
3. Убедитесь, что workflow выполнился успешно
4. Проверьте, что приложение обновилось на Railway

## 🛠️ Ручной деплой

Если нужно развернуть вручную:

```bash
# Установить Railway CLI
npm install -g @railway/cli

# Войти в Railway
railway login

# Развернуть
railway up
```

## 🔍 Логи деплоя

Логи деплоя можно посмотреть в:
- **GitHub Actions** → выберите workflow → Deploy job
- **Railway Dashboard** → ваш проект → Deployments

## ⚠️ Важные моменты

1. **Токен Railway** должен быть действительным
2. **Проект Railway** должен быть связан с репозиторием
3. **Переменные окружения** настраиваются в Railway Dashboard
4. **Домен** автоматически обновляется при деплое

## 🎯 Результат

Теперь при каждом изменении кода:
- ✅ Автоматически запускаются тесты
- ✅ Собирается приложение
- ✅ Развертывается на Railway
- ✅ Обновляется домен

**Больше не нужно вручную запускать `railway up`!** 🎉
