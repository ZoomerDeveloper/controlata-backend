// CORS Proxy для обхода ограничений браузера
(function() {
    'use strict';
    
    const API_URL = 'https://controlata-production.up.railway.app/api';
    
    // Функция для проксирования запросов
    window.proxyRequest = async function(endpoint, method = 'GET', data = null) {
        try {
            console.log(`🔄 Проксируем запрос: ${method} ${endpoint}`);
            
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : null
            });
            
            const result = await response.json();
            console.log(`✅ Ответ получен:`, result);
            
            return { 
                success: true, 
                data: result, 
                status: response.status,
                headers: response.headers
            };
        } catch (error) {
            console.error(`❌ Ошибка прокси:`, error);
            return { 
                success: false, 
                error: error.message,
                status: 0
            };
        }
    };
    
    // Функция для авторизации
    window.proxyLogin = async function(email, password) {
        return await window.proxyRequest('/auth/login', 'POST', { email, password });
    };
    
    // Функция для получения данных
    window.proxyGet = async function(endpoint) {
        return await window.proxyRequest(endpoint, 'GET');
    };
    
    // Функция для отправки данных
    window.proxyPost = async function(endpoint, data) {
        return await window.proxyRequest(endpoint, 'POST', data);
    };
    
    console.log('🚀 CORS Proxy загружен и готов к использованию');
    console.log('Доступные функции: proxyLogin, proxyGet, proxyPost, proxyRequest');
})();
