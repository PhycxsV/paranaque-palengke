import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { FEATURE_TAWAD_ENABLED } from '@/constants'
import { CustomerLayout } from '@/features/customer/layouts/CustomerLayout'
import { VendorLayout } from '@/features/vendor/layouts/VendorLayout'
import AdminLayout from '@/features/admin/layouts/AdminLayout'
import HomePage from '@/features/customer/pages/HomePage'
import ProductsPage from '@/features/customer/pages/ProductsPage'
import ProductDetailPage from '@/features/customer/pages/ProductDetailPage'
import VendorStorePage from '@/features/customer/pages/VendorStorePage'
import CartPage from '@/features/customer/pages/CartPage'
import CheckoutPage from '@/features/customer/pages/CheckoutPage'
import PaymentPage from '@/features/customer/pages/PaymentPage'
import OrdersPage from '@/features/customer/pages/OrdersPage'
import OrderDetailPage from '@/features/customer/pages/OrderDetailPage'
import CustomerOffersPage from '@/features/customer/pages/CustomerOffersPage'
import CustomerChatPage from '@/features/customer/pages/CustomerChatPage'
import VendorDashboardPage from '@/features/vendor/pages/VendorDashboardPage'
import VendorOrdersPage from '@/features/vendor/pages/VendorOrdersPage'
import VendorOrderDetailPage from '@/features/vendor/pages/VendorOrderDetailPage'
import VendorProductsPage from '@/features/vendor/pages/VendorProductsPage'
import VendorStoreProfilePage from '@/features/vendor/pages/VendorStorePage'
import VendorOffersPage from '@/features/vendor/pages/VendorOffersPage'
import VendorChatPage from '@/features/vendor/pages/VendorChatPage'
import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage'
import AdminCommoditiesPage from '@/features/admin/pages/AdminCommoditiesPage'
import AdminPriceHistoryPage from '@/features/admin/pages/AdminPriceHistoryPage'
import AdminVendorsPage from '@/features/admin/pages/AdminVendorsPage'
import AdminVendorDetailPage from '@/features/admin/pages/AdminVendorDetailPage'
import AdminOffersPage from '@/features/admin/pages/AdminOffersPage'
import AdminOrdersPage from '@/features/admin/pages/AdminOrdersPage'
import NotFoundPage from '@/features/customer/pages/NotFoundPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="customer" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="stores/:vendorId" element={<VendorStorePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment/:orderId" element={<PaymentPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route
            path="offers"
            element={
              FEATURE_TAWAD_ENABLED ? (
                <CustomerOffersPage />
              ) : (
                <Navigate to="/customer" replace />
              )
            }
          />
          <Route path="chat" element={<CustomerChatPage />} />
          <Route path="chat/:threadId" element={<CustomerChatPage />} />
        </Route>

        <Route path="vendor" element={<VendorLayout />}>
          <Route index element={<VendorDashboardPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="orders/:orderId" element={<VendorOrderDetailPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="store" element={<VendorStoreProfilePage />} />
          <Route
            path="offers"
            element={
              FEATURE_TAWAD_ENABLED ? (
                <VendorOffersPage />
              ) : (
                <Navigate to="/vendor" replace />
              )
            }
          />
          <Route path="chat" element={<VendorChatPage />} />
          <Route path="chat/:threadId" element={<VendorChatPage />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="commodities" element={<AdminCommoditiesPage />} />
          <Route path="price-history" element={<AdminPriceHistoryPage />} />
          <Route path="vendors" element={<AdminVendorsPage />} />
          <Route path="vendors/:vendorId" element={<AdminVendorDetailPage />} />
          <Route
            path="offers"
            element={
              FEATURE_TAWAD_ENABLED ? (
                <AdminOffersPage />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>

        <Route index element={<Navigate to="/customer" replace />} />
        <Route path="home" element={<Navigate to="/customer" replace />} />
        <Route path="products" element={<Navigate to="/customer/products" replace />} />
        <Route path="cart" element={<Navigate to="/customer/cart" replace />} />
        <Route path="orders" element={<Navigate to="/customer/orders" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-center" closeButton />
    </HashRouter>
  )
}
