import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { FEATURE_TAWAD_ENABLED } from '@/constants'
import '@/stores/text-size-store'
import { useBackendSync } from '@/hooks/useBackendSync'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import { useProductsLiveSync } from '@/hooks/useProductsLiveSync'
import { BrandLoader } from '@/components/shared/BrandLoader'
import { RequireAuth } from '@/components/shared/RequireAuth'
import { CustomerLayout } from '@/features/customer/layouts/CustomerLayout'
import AuthPage from '@/features/auth/AuthPage'
import HomePage from '@/features/customer/pages/HomePage'
import ProductsPage from '@/features/customer/pages/ProductsPage'
import ProductDetailPage from '@/features/customer/pages/ProductDetailPage'
import VendorsPage from '@/features/customer/pages/VendorsPage'
import VendorStorePage from '@/features/customer/pages/VendorStorePage'
import CartPage from '@/features/customer/pages/CartPage'
import CheckoutPage from '@/features/customer/pages/CheckoutPage'
import PaymentPage from '@/features/customer/pages/PaymentPage'
import PaymentGroupPage from '@/features/customer/pages/PaymentGroupPage'
import OrdersPage from '@/features/customer/pages/OrdersPage'
import OrderDetailPage from '@/features/customer/pages/OrderDetailPage'
import CustomerProfilePage from '@/features/customer/pages/CustomerProfilePage'
import CustomerOffersPage from '@/features/customer/pages/CustomerOffersPage'
import CustomerChatPage from '@/features/customer/pages/CustomerChatPage'
import NotFoundPage from '@/features/customer/pages/NotFoundPage'

function AppShell() {
  const { catalogReady, catalogError, apiConfigured } = useBackendSync()
  useIdleLogout()
  useProductsLiveSync({ enabled: catalogReady })

  if (apiConfigured && !catalogReady) {
    return <BrandLoader fullScreen label="Loading Palengke" />
  }

  return (
    <>
      {catalogError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          Catalog warning: {catalogError}. Some listings may be empty until the API is available.
        </div>
      ) : null}
      <Routes>
        <Route path="auth" element={<AuthPage portal="customer" />} />
        <Route path="login" element={<AuthPage portal="customer" />} />
        <Route path="customer/login" element={<AuthPage portal="customer" />} />

        <Route path="customer" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="stores/:vendorId" element={<VendorStorePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <RequireAuth roles={['customer']}>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="payment/group/:groupId"
            element={
              <RequireAuth roles={['customer']}>
                <PaymentGroupPage />
              </RequireAuth>
            }
          />
          <Route
            path="payment/:orderId"
            element={
              <RequireAuth roles={['customer']}>
                <PaymentPage />
              </RequireAuth>
            }
          />
          <Route
            path="orders"
            element={
              <RequireAuth roles={['customer']}>
                <OrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="orders/:orderId"
            element={
              <RequireAuth roles={['customer']}>
                <OrderDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="profile"
            element={
              <RequireAuth roles={['customer']}>
                <CustomerProfilePage />
              </RequireAuth>
            }
          />
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
          <Route
            path="chat"
            element={
              <RequireAuth roles={['customer']}>
                <CustomerChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="chat/:threadId"
            element={
              <RequireAuth roles={['customer']}>
                <CustomerChatPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route index element={<Navigate to="/customer" replace />} />
        <Route path="home" element={<Navigate to="/customer" replace />} />
        <Route path="products" element={<Navigate to="/customer/products" replace />} />
        <Route path="cart" element={<Navigate to="/customer/cart" replace />} />
        <Route path="orders" element={<Navigate to="/customer/orders" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-center" closeButton />
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
