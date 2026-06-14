import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';
import FacebookPixel from './components/FacebookPixel';
import GoogleTag from './components/GoogleTag';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import FlashSale from './pages/FlashSale';
import ChangePassword from './pages/ChangePassword';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import OfferPage from './pages/OfferPage';
import Offers from './pages/Offers';
import ForgotPassword from './pages/ForgotPassword';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnPolicy from './pages/ReturnPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import StepFunnel from './pages/StepFunnel';
import NotFound from './pages/NotFound';


// Admin
import StaffDashboard from './pages/Admin/StaffDashboard';

import UserLayout from './components/UserLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Router>
                <ScrollToTop />
                <FacebookPixel />
                <GoogleTag />
                <div className="flex flex-col min-h-screen bg-neutral-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
                  <Routes>
                    {/* User Routes */}
                    <Route element={<UserLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Shop />} />
                      <Route path="/product/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/flash-sale" element={<FlashSale />} />
                      <Route path="/offer" element={<Offers />} />
                      <Route path="/blogs" element={<BlogList />} />
                      <Route path="/blog/:slug" element={<BlogDetail />} />
                      <Route path="/about-us" element={<AboutUs />} />
                      <Route path="/contact-us" element={<ContactUs />} />
                      <Route path="/shipping-policy" element={<ShippingPolicy />} />
                      <Route path="/return-replacement-policy" element={<ReturnPolicy />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-conditions" element={<TermsConditions />} />
                      <Route path="/brands" element={<Brands />} />
                      <Route path="/categories" element={<Categories />} />


                      {/* Guest Only Routes */}
                      <Route element={<PublicRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                      </Route>

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/account" element={<Account />} />
                        <Route path="/account/profile" element={<Account />} />
                        <Route path="/account/orders" element={<MyOrders />} />
                        <Route path="/account/orders/:id" element={<OrderDetails />} />
                        <Route path="/account/change-password" element={<ChangePassword />} />
                      </Route>
                    </Route>

                    {/* Standalone Landing Pages */}
                    <Route path="/offer/:slug" element={<OfferPage />} />

                    <Route path="/step/:slug" element={<StepFunnel />} />

                    {/* Admin Routes */}
                    <Route path="/staff/admin/*" element={<StaffDashboard role="admin" />} />
                    <Route path="/staff/moderator/*" element={<StaffDashboard role="moderator" />} />
                    <Route path="/staff/ads_manager/*" element={<StaffDashboard role="ads_manager" />} />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Router>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
        </LanguageProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}


export default App;
