// Простой API сервис с использованием CORS Proxy
import { 
  User, 
  LoginForm,
  RegisterForm
} from '../types';

class ApiCorsProxyService {
  private baseURL: string;

  constructor() {
    // Используем CORS Proxy для обхода ограничений
    this.baseURL = 'https://controlata-production.up.railway.app/cors-proxy';
    console.log('API CORS Proxy Base URL:', this.baseURL);
  }

  // Простая функция для запросов через CORS Proxy
  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    try {
      console.log(`🔄 CORS Proxy запрос: ${method} ${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ CORS Proxy ответ:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ CORS Proxy ошибка:`, error);
      throw error;
    }
  }

  // Авторизация
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    try {
      const data = await this.makeRequest('/api/auth/login', 'POST', credentials);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка авторизации через CORS Proxy:', error);
      throw error;
    }
  }

  async register(userData: RegisterForm): Promise<{ user: User; token: string }> {
    try {
      const data = await this.makeRequest('/api/auth/register', 'POST', userData);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка регистрации через CORS Proxy:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Заглушки для остальных методов
  async getOrders(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getPictures(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getMaterials(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getPictureSizes(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getIncomes(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getExpenses(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async createOrder(orderData: any): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async createPicture(pictureData: any): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getWarehouseMaterials(): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getWarehouseStats(): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getAllMovements(): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getDashboardStats(): Promise<any> {
    throw new Error('Метод не реализован в CORS Proxy');
  }

  async getReports(): Promise<any[]> {
    throw new Error('Метод не реализован в CORS Proxy');
  }
}

// Экспортируем экземпляр сервиса
const apiCorsProxy = new ApiCorsProxyService();
export default apiCorsProxy;
