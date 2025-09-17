// Основные типы данных

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PictureSize {
  id: string;
  name: string;
  width: number;
  height: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  category: 'CANVAS' | 'PAINT' | 'BRUSH' | 'FRAME' | 'NUMBER' | 'PACKAGING' | 'OTHER';
  isActive: boolean;
  pictureSizeId?: string;
  pictureSize?: PictureSize;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPurchase {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
  purchaseDate: string;
  notes?: string;
  material: Material;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  materialId: string;
  quantity: number;
  minLevel?: number;
  lastUpdated: string;
  material: Material;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED';
  totalPrice: number;
  notes?: string;
  orderDate: string;
  dueDate?: string;
  completedAt?: string;
  userId: string;
  user: User;
  pictures: Picture[];
  incomes: Income[];
  _count: {
    pictures: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Picture {
  id: string;
  orderId: string;
  pictureSizeId: string;
  name: string;
  description?: string;
  type: 'READY_MADE' | 'CUSTOM_PHOTO';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
  costPrice?: number;
  workHours?: number;
  notes?: string;
  order: Order;
  pictureSize: PictureSize;
  materials: PictureMaterial[];
  profit?: {
    profit: number;
    margin: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PictureMaterial {
  id: string;
  pictureId: string;
  materialId: string;
  quantity: number;
  picture: Picture;
  material: Material;
}

export interface Income {
  id: string;
  orderId?: string;
  amount: number;
  description: string;
  category: 'SALES' | 'OTHER';
  date: string;
  notes?: string;
  userId: string;
  user: User;
  order?: Order;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'MATERIALS' | 'PRODUCTION' | 'LOGISTICS' | 'RENT' | 'MARKETING' | 'OTHER';
  date: string;
  notes?: string;
  receipt?: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'PROFIT_LOSS' | 'CASH_FLOW' | 'PRODUCT_ANALYSIS' | 'CUSTOM';
  periodStart: string;
  periodEnd: string;
  data: any;
  filePath?: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

// API Response типы
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard типы
export interface DashboardStats {
  period: {
    startDate: string;
    endDate: string;
    type: string;
  };
  orders: {
    total: number;
    revenue: number;
    byStatus: Array<{
      status: string;
      _count: { id: number };
      _sum: { totalPrice: number };
    }>;
  };
  pictures: {
    total: number;
    revenue: number;
    cost: number;
    profit: number;
    byType: Array<{
      type: string;
      _count: { id: number };
      _sum: { price: number; costPrice: number };
    }>;
  };
  finances: {
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    expensesByCategory: Array<{
      category: string;
      _sum: { amount: number };
      _count: { id: number };
    }>;
  };
  analytics: {
    topCustomers: Array<{
      customerName: string;
      _count: { id: number };
      _sum: { totalPrice: number };
    }>;
    recentOrders: Order[];
    lowStockMaterials: Array<{
      id: string;
      name: string;
      unit: string;
      category: string;
      currentStock: number;
      minLevel: number;
    }>;
  };
}

// Form типы
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface CreateOrderForm {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  dueDate?: string;
  notes?: string;
  pictures: Array<{
    pictureSizeId: string;
    name: string;
    description?: string;
    type: 'READY_MADE' | 'CUSTOM_PHOTO';
    price: number;
    workHours?: number;
    notes?: string;
  }>;
}

export interface CreatePictureForm {
  orderId: string;
  pictureSizeId: string;
  name: string;
  description?: string;
  type: 'READY_MADE' | 'CUSTOM_PHOTO';
  price: number;
  workHours?: number;
  notes?: string;
  materials?: Array<{
    materialId: string;
    quantity: number;
  }>;
}

export interface CreateMaterialForm {
  name: string;
  description?: string;
  unit: string;
  category: 'CANVAS' | 'PAINT' | 'BRUSH' | 'FRAME' | 'NUMBER' | 'PACKAGING' | 'OTHER';
  pictureSizeId?: string;
}

export interface CreateIncomeForm {
  orderId?: string;
  amount: number;
  description: string;
  category: 'SALES' | 'OTHER';
  date?: string;
  notes?: string;
}

export interface CreateExpenseForm {
  amount: number;
  description: string;
  category: 'MATERIALS' | 'PRODUCTION' | 'LOGISTICS' | 'RENT' | 'MARKETING' | 'OTHER';
  date?: string;
  notes?: string;
  receipt?: string;
}
