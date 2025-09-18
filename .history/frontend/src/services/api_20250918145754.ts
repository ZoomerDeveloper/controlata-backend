import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  PictureSize, 
  Material, 
  MaterialPurchase, 
  Stock, 
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
  PaginatedResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Определяем базовый URL в зависимости от окружения
    const baseURL = process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8080/api'
        : 'https://controlata-production.up.railway.app/api'
      );
    
    console.log('API Base URL:', baseURL);
    
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Включаем credentials для localhost
    });

    // Добавляем токен к каждому запросу
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обрабатываем ответы
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth API
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.api.put('/auth/change-password', data);
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // Picture Sizes API
  async getPictureSizes(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<PaginatedResponse<PictureSize>> {
    const response = await this.api.get('/picture-sizes', { params });
    return response.data;
  }

  async getPictureSize(id: string): Promise<{ pictureSize: PictureSize }> {
    const response = await this.api.get(`/picture-sizes/${id}`);
    return response.data;
  }

  async createPictureSize(data: Omit<PictureSize, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ pictureSize: PictureSize }> {
    const response = await this.api.post('/picture-sizes', data);
    return response.data;
  }

  async updatePictureSize(id: string, data: Partial<PictureSize>): Promise<{ pictureSize: PictureSize }> {
    const response = await this.api.put(`/picture-sizes/${id}`, data);
    return response.data;
  }

  async deletePictureSize(id: string): Promise<void> {
    await this.api.delete(`/picture-sizes/${id}`);
  }

  // Materials API
  async getMaterials(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<PaginatedResponse<Material>> {
    const response = await this.api.get('/materials', { params });
    return response.data;
  }

  async getMaterial(id: string): Promise<{ data: Material }> {
    const response = await this.api.get(`/materials/${id}`);
    return response.data;
  }

  async createMaterial(data: CreateMaterialForm): Promise<{ data: Material }> {
    const response = await this.api.post('/materials', data);
    return response.data;
  }

  async updateMaterial(id: string, data: Partial<Material>): Promise<{ data: Material }> {
    const response = await this.api.put(`/materials/${id}`, data);
    return response.data;
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.api.delete(`/materials/${id}`);
  }

  async createMaterialPurchase(materialId: string, data: Omit<MaterialPurchase, 'id' | 'materialId' | 'createdAt' | 'updatedAt'>): Promise<{ purchase: MaterialPurchase }> {
    const response = await this.api.post(`/materials/${materialId}/purchases`, data);
    return response.data;
  }

  async getMaterialPurchases(params?: { materialId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<MaterialPurchase>> {
    const response = await this.api.get('/materials/purchases/all', { params });
    return response.data;
  }

  async updateStockLevel(materialId: string, minLevel: number): Promise<void> {
    await this.api.put(`/materials/${materialId}/stock-level`, { minLevel });
  }


  // Orders API
  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<Order>> {
    const response = await this.api.get('/orders', { params });
    return response.data;
  }

  async getOrdersByDateRange(params: { startDate?: string; endDate?: string; status?: string }): Promise<{ orders: Order[] }> {
    const response = await this.api.get('/orders/by-date-range', { params });
    return response.data;
  }

  async getOrder(id: string): Promise<{ order: Order }> {
    const response = await this.api.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: CreateOrderForm): Promise<{ order: Order }> {
    const response = await this.api.post('/orders', data);
    return response.data;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<{ order: Order }> {
    const response = await this.api.put(`/orders/${id}`, data);
    return response.data;
  }

  async updateOrderStatus(id: string, status: string): Promise<{ order: Order }> {
    const response = await this.api.patch(`/orders/${id}/status`, { status });
    return response.data;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.api.delete(`/orders/${id}`);
  }

  // Pictures API
  async getPictures(params?: { page?: number; limit?: number; status?: string; type?: string; orderId?: string; search?: string }): Promise<PaginatedResponse<Picture>> {
    const response = await this.api.get('/pictures', { params });
    return response.data;
  }

  async getPicture(id: string): Promise<{ picture: Picture }> {
    const response = await this.api.get(`/pictures/${id}`);
    return response.data;
  }

  async createPicture(data: CreatePictureForm): Promise<{ picture: Picture }> {
    const response = await this.api.post('/pictures', data);
    return response.data;
  }

  async updatePicture(id: string, data: Partial<Picture>): Promise<{ picture: Picture }> {
    const response = await this.api.put(`/pictures/${id}`, data);
    return response.data;
  }

  async updatePictureStatus(id: string, status: string): Promise<{ picture: Picture }> {
    const response = await this.api.patch(`/pictures/${id}/status`, { status });
    return response.data;
  }

  async addMaterialsToPicture(id: string, materials: Array<{ materialId: string; quantity: number }>): Promise<void> {
    await this.api.post(`/pictures/${id}/materials`, { materials });
  }

  async calculatePictureCost(id: string): Promise<{ costPrice: number; profit: { profit: number; margin: number } }> {
    const response = await this.api.get(`/pictures/${id}/cost`);
    return response.data;
  }

  async deletePicture(id: string): Promise<void> {
    await this.api.delete(`/pictures/${id}`);
  }

  // Incomes API
  async getIncomes(params?: { page?: number; limit?: number; category?: string; startDate?: string; endDate?: string; search?: string }): Promise<PaginatedResponse<Income>> {
    const response = await this.api.get('/incomes', { params });
    return response.data;
  }

  async getIncomeStats(params?: { startDate?: string; endDate?: string; groupBy?: string }): Promise<any> {
    const response = await this.api.get('/incomes/stats', { params });
    return response.data;
  }

  async getIncome(id: string): Promise<{ income: Income }> {
    const response = await this.api.get(`/incomes/${id}`);
    return response.data;
  }

  async createIncome(data: CreateIncomeForm): Promise<{ income: Income }> {
    const response = await this.api.post('/incomes', data);
    return response.data;
  }

  async updateIncome(id: string, data: Partial<Income>): Promise<{ income: Income }> {
    const response = await this.api.put(`/incomes/${id}`, data);
    return response.data;
  }

  async deleteIncome(id: string): Promise<void> {
    await this.api.delete(`/incomes/${id}`);
  }

  // Expenses API
  async getExpenses(params?: { page?: number; limit?: number; category?: string; startDate?: string; endDate?: string; search?: string }): Promise<PaginatedResponse<Expense>> {
    const response = await this.api.get('/expenses', { params });
    return response.data;
  }

  async getExpenseStats(params?: { startDate?: string; endDate?: string; groupBy?: string }): Promise<any> {
    const response = await this.api.get('/expenses/stats', { params });
    return response.data;
  }

  async getExpense(id: string): Promise<{ expense: Expense }> {
    const response = await this.api.get(`/expenses/${id}`);
    return response.data;
  }

  async createExpense(data: CreateExpenseForm): Promise<{ expense: Expense }> {
    const response = await this.api.post('/expenses', data);
    return response.data;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<{ expense: Expense }> {
    const response = await this.api.put(`/expenses/${id}`, data);
    return response.data;
  }

  async deleteExpense(id: string): Promise<void> {
    await this.api.delete(`/expenses/${id}`);
  }

  // Reports API
  async getReports(params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Report>> {
    const response = await this.api.get('/reports', { params });
    return response.data;
  }

  async getReport(id: string): Promise<{ report: Report }> {
    const response = await this.api.get(`/reports/${id}`);
    return response.data;
  }

  async generateProfitLossReport(data: { startDate: string; endDate: string }): Promise<{ report: Report; data: any }> {
    const response = await this.api.post('/reports/profit-loss', data);
    return response.data;
  }

  async generateCashFlowReport(data: { startDate: string; endDate: string }): Promise<{ report: Report; data: any }> {
    const response = await this.api.post('/reports/cash-flow', data);
    return response.data;
  }

  async generateProductAnalysisReport(data: { startDate: string; endDate: string }): Promise<{ report: Report; data: any }> {
    const response = await this.api.post('/reports/product-analysis', data);
    return response.data;
  }

  async deleteReport(id: string): Promise<void> {
    await this.api.delete(`/reports/${id}`);
  }

  // Dashboard API
  async getDashboardStats(params?: { period?: string }): Promise<DashboardStats> {
    const response = await this.api.get('/dashboard', { params });
    return response.data;
  }

  async getFinancialOverview(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.api.get('/dashboard/financial', { params });
    return response.data;
  }

  async getProductAnalytics(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.api.get('/dashboard/products', { params });
    return response.data;
  }

  // Warehouse API
  async getWarehouseMaterials(): Promise<{ materials: any[]; total: number }> {
    const response = await this.api.get('/warehouse/materials');
    return response.data;
  }

  async getLowStockMaterials(): Promise<{ materials: any[]; total: number }> {
    const response = await this.api.get('/warehouse/materials/low-stock');
    return response.data;
  }

  async addMaterialToStock(data: {
    materialId: string;
    quantity: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.api.post('/warehouse/materials/add', data);
    return response.data;
  }

  async removeMaterialFromStock(data: {
    materialId: string;
    quantity: number;
    reason: string;
    referenceId?: string;
    referenceType?: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.api.post('/warehouse/materials/remove', data);
    return response.data;
  }

  async adjustStock(data: {
    materialId: string;
    newQuantity: number;
    reason: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.api.post('/warehouse/materials/adjust', data);
    return response.data;
  }

  async getMaterialMovements(materialId: string, limit?: number): Promise<{ movements: any[]; total: number }> {
    const response = await this.api.get(`/warehouse/materials/${materialId}/movements`, {
      params: { limit }
    });
    return response.data;
  }

  async getAllMovements(limit?: number): Promise<{ movements: any[]; total: number }> {
    const response = await this.api.get('/warehouse/movements', {
      params: { limit }
    });
    return response.data;
  }

  async getWarehouseStats(): Promise<{ stats: any }> {
    const response = await this.api.get('/warehouse/stats');
    return response.data;
  }
}

export default new ApiService();
