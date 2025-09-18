// Прямой API сервис без CORS ограничений
import { 
  User, 
  LoginForm,
  RegisterForm
} from '../types';

class ApiDirectService {
  private baseURL: string;

  constructor() {
    // Используем прямой API без CORS
    this.baseURL = 'https://controlata-production.up.railway.app/api';
    console.log('API Direct Base URL:', this.baseURL);
  }

  // Простая функция для запросов
  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    try {
      console.log(`🔄 Direct API запрос: ${method} ${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
        mode: 'cors', // Явно указываем CORS режим
        credentials: 'omit' // Отключаем credentials
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ Direct API ответ:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Direct API ошибка:`, error);
      throw error;
    }
  }

  // Авторизация
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    try {
      const data = await this.makeRequest('/auth/login', 'POST', credentials);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка авторизации через Direct API:', error);
      throw error;
    }
  }

  async register(userData: RegisterForm): Promise<{ user: User; token: string }> {
    try {
      const data = await this.makeRequest('/auth/register', 'POST', userData);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка регистрации через Direct API:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Заглушки для остальных методов
  async getOrders(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getPictures(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getMaterials(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getPictureSizes(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getIncomes(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getExpenses(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }

  async createOrder(orderData: any): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async createPicture(pictureData: any): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getWarehouseMaterials(): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getWarehouseStats(): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getAllMovements(): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getDashboardStats(): Promise<any> {
    throw new Error('Метод не реализован в Direct API');
  }

  async getReports(): Promise<any[]> {
    throw new Error('Метод не реализован в Direct API');
  }
}

// Экспортируем экземпляр сервиса
const apiDirect = new ApiDirectService();
export default apiDirect;
