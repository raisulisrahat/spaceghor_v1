import axios from 'axios';

export const BASE_URL = 'https://api.spaceghor.com';
// export const BASE_URL = 'http://127.0.0.1:8000' 

const API_BASE_URL = `${BASE_URL}/api/`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Add interceptor to include token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Token ${token}`;
  }
  return config;
});

export const getProducts = (params?: any) => api.get('products/', { params });
export const getProductBySlug = (slug: string) => api.get(`products/${slug}/`);
export const getCategories = () => api.get('categories/');
export const getBrands = () => api.get('brands/');
export const getBanners = () => api.get('banners/');
export const getSiteSettings = () => api.get('site-settings/');
export const updateSiteSettings = (id: number, data: any) => api.patch(`site-settings/${id}/`, data);
export const searchProducts = (query: string) => api.get(`products/?search=${query}`);
export const getDistricts = () => api.get('districts/');
export const getUpazilas = (districtId?: string) => api.get(`upazilas/${districtId ? `?district=${districtId}` : ''}`);
export const getShippingZones = () => api.get('shipping-zones/');
export const getPaymentMethods = () => api.get('payment-methods/');
export const getFlashSales = () => api.get('flash-sales/');
export const getBlogPosts = () => api.get('blog-posts/');
export const getFunnelBySlug = (slug: string) => api.get(`funnels/${slug}/`);
export const getFunnels = () => api.get('funnels/');

// Auth
export const login = (credentials: any) => api.post('login/', credentials);
export const register = (userData: any) => api.post('register/', userData);
export const getProfile = () => api.get('profile/');
export const updateProfile = (data: any) => api.patch('profile/', data);
export const changePassword = (data: any) => api.post('profile/', data);

// Wishlist
export const getWishlist = () => api.get('wishlist/');
export const addToWishlist = (product_id: number) => api.post('wishlist/', { product_id });
export const removeFromWishlist = (id: number) => api.delete(`wishlist/${id}/`);

// Orders
export const createOrder = (orderData: any) => api.post('orders/', orderData);
export const getMyOrders = () => api.get('orders/', { params: { mine: true } });
export const getOrderDetails = (id: number) => api.get(`orders/${id}/`);
export const requestCancelOrder = (id: number) => api.post(`orders/${id}/request_cancel/`);
export const createDraftOrder = (orderData: any) => api.post('incomplete-orders/', orderData);
export const updateDraftOrder = (id: number, orderData: any) => api.patch(`incomplete-orders/${id}/`, orderData);
export const deleteDraftOrder = (id: number) => api.delete(`incomplete-orders/${id}/`);

// OTP & Password Reset
export const requestOTP = (phone_number: string) => api.post('otp/request_otp/', { phone_number });
export const verifyOTP = (phone_number: string, code: string) => api.post('otp/verify_otp/', { phone_number, code });
export const resetPassword = (data: any) => api.post('otp/reset_password/', data);
export const checkPhone = (phone_number: string) => api.post('otp/check_phone/', { phone_number });
export const setupPassword = (data: any) => api.post('otp/setup_password/', data);

// Admin/Staff
export const getAdminStats = () => api.get('admin-stats/');
export const getOrders = () => api.get('orders/');
export const getOrderById = (id: number) => api.get(`orders/${id}/`);
export const updateOrder = (id: number, data: any) => api.patch(`orders/${id}/`, data);
export const deleteOrder = (id: number) => api.delete(`orders/${id}/`);
export const createProduct = (data: any) => api.post('products/', data);
export const updateProduct = (id: number, data: any) => api.patch(`products/${id}/`, data);
export const deleteProduct = (id: number) => api.delete(`products/${id}/`);

export default api;
