// Альтернативный API сервис с использованием прокси для обхода CORS
import { 
  User, 
  PictureSize, 
  Material, 
  Order, 
  Picture, 
  Income, 
  Expense, 
  Report, 
  DashboardStats,
  LoginForm,
  RegisterForm,
  CreateOrderForm,
  CreatePictureForm,
  CreateMaterialForm,
  CreateIncomeForm,
  CreateExpenseForm,
  WarehouseStats,
  MaterialWithStock,
  MaterialMovement
} from '../types';

// Проверяем, что прокси загружен
declare global {
  interface Window {
    proxyRequest: (endpoint: string, method?: string, data?: any) => Promise<any>;
    proxyLogin: (email: string, password: string) => Promise<any>;
    proxyGet: (endpoint: string) => Promise<any>;
    proxyPost: (endpoint: string, data: any) => Promise<any>;
  }
}

class ApiProxyService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://controlata-production.up.railway.app/api';
    console.log('API Proxy Base URL:', this.baseURL);
  }

  // Проверяем доступность прокси
  private checkProxy(): boolean {
    if (typeof window.proxyRequest !== 'function') {
      console.error('❌ CORS Proxy не загружен! Проверьте cors-proxy.js');
      return false;
    }
    return true;
  }

  // Обработка ответов прокси
  private handleResponse(response: any) {
    if (!response.success) {
      throw new Error(response.error || 'Ошибка прокси');
    }
    return response.data;
  }

  // Авторизация
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyLogin(credentials.email, credentials.password);
      const data = this.handleResponse(response);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      throw error;
    }
  }

  async register(userData: RegisterForm): Promise<{ user: User; token: string }> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyPost('/auth/register', userData);
      const data = this.handleResponse(response);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
  }

  // Получение данных
  async getOrders(): Promise<Order[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/orders');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
      throw error;
    }
  }

  async getPictures(): Promise<Picture[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/pictures');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения картин:', error);
      throw error;
    }
  }

  async getMaterials(): Promise<Material[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/materials');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения материалов:', error);
      throw error;
    }
  }

  async getPictureSizes(): Promise<PictureSize[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/picture-sizes');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения размеров картин:', error);
      throw error;
    }
  }

  async getIncomes(): Promise<Income[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/incomes');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения доходов:', error);
      throw error;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/expenses');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения расходов:', error);
      throw error;
    }
  }

  // Создание данных
  async createOrder(orderData: CreateOrderForm): Promise<Order> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyPost('/orders', orderData);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      throw error;
    }
  }

  async createPicture(pictureData: CreatePictureForm): Promise<Picture> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyPost('/pictures', pictureData);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка создания картины:', error);
      throw error;
    }
  }

  // Склад
  async getWarehouseMaterials(): Promise<{ materials: MaterialWithStock[] }> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/warehouse/materials');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения материалов склада:', error);
      throw error;
    }
  }

  async getWarehouseStats(): Promise<{ stats: WarehouseStats }> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/warehouse/stats');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения статистики склада:', error);
      throw error;
    }
  }

  async getAllMovements(): Promise<{ movements: MaterialMovement[] }> {
    if (!this.checkProxy()) {
      throw new Error('CORS Proxy не доступен');
    }

    try {
      const response = await window.proxyGet('/warehouse/movements');
      return this.handleResponse(response);
    } catch (error) {
      console.error('Ошибка получения движений:', error);
      throw error;
    }
  }

  // Заглушки для остальных методов (можно добавить по необходимости)
  async getDashboardStats(): Promise<DashboardStats> {
    throw new Error('Метод не реализован в прокси');
  }

  async getReports(): Promise<Report[]> {
    throw new Error('Метод не реализован в прокси');
  }
}

// Экспортируем экземпляр сервиса
const apiProxy = new ApiProxyService();
export default apiProxy;
