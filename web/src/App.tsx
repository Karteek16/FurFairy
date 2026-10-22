import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { Protected } from './components/Protected';

import { BrowseShops } from './pages/BrowseShops';
import { ShopPublicPage } from './pages/ShopPublicPage';
import { StaffLogin } from './pages/StaffLogin';
import { CustomerLogin } from './pages/CustomerLogin';

import { CustomerPets } from './pages/customer/CustomerPets';
import { CustomerBookings } from './pages/customer/CustomerBookings';
import { BookBoarding } from './pages/customer/BookBoarding';
import { BookGrooming } from './pages/customer/BookGrooming';
import { Checkout } from './pages/customer/Checkout';

import { ShopLayout } from './components/ShopLayout';
import { ShopDashboard } from './pages/shop/ShopDashboard';
import { ShopBoardingConfig } from './pages/shop/ShopBoardingConfig';
import { ShopEmployees } from './pages/shop/ShopEmployees';
import { ShopReservations } from './pages/shop/ShopReservations';
import { ShopAppointments } from './pages/shop/ShopAppointments';
import { ShopSettings } from './pages/shop/ShopSettings';
import { ShopInventory } from './pages/shop/ShopInventory';
import { ShopPOS } from './pages/shop/ShopPOS';
import { SellerCatalogue } from './pages/SellerCatalogue';

import { AdminVerification } from './pages/admin/AdminVerification';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<BrowseShops />} />
        <Route path="/shops/:slug" element={<ShopPublicPage />} />
        <Route path="/shops/:slug/products" element={<SellerCatalogue />} />
        <Route path="/book/:slug/boarding" element={<BookBoarding />} />
        <Route path="/book/:slug/grooming" element={<BookGrooming />} />
        <Route path="/checkout/:slug" element={<Checkout />} />
        <Route path="/login" element={<StaffLogin />} />
        <Route path="/account/login" element={<CustomerLogin />} />

        {/* Customer */}
        <Route
          path="/account/pets"
          element={
            <Protected allow={['CUSTOMER']}>
              <CustomerPets />
            </Protected>
          }
        />
        <Route
          path="/account/bookings"
          element={
            <Protected allow={['CUSTOMER']}>
              <CustomerBookings />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Shop workspace — light sidebar shell (shop admin / staff) */}
      <Route
        element={
          <Protected allow={['EMPLOYEE']}>
            <ShopLayout />
          </Protected>
        }
      >
        <Route path="/shop" element={<ShopDashboard />} />
        <Route path="/shop/settings" element={<ShopSettings />} />
        <Route path="/shop/boarding" element={<ShopBoardingConfig />} />
        <Route path="/shop/reservations" element={<ShopReservations />} />
        <Route path="/shop/grooming" element={<ShopAppointments />} />
        <Route path="/shop/inventory" element={<ShopInventory />} />
        <Route path="/shop/pos" element={<ShopPOS />} />
        <Route path="/shop/employees" element={<ShopEmployees />} />
      </Route>

      {/* Super Admin — dedicated dark control-centre shell */}
      <Route
        element={
          <Protected allow={['PLATFORM_ADMIN']}>
            <AdminLayout />
          </Protected>
        }
      >
        <Route path="/admin" element={<AdminVerification />} />
      </Route>
    </Routes>
  );
}
