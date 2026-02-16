import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './pages/admin/Dashboard';
import EventsList from './pages/admin/Events';
import AvailabilitiesList from './pages/admin/Availabilities';
import BookingsList from './pages/admin/Bookings';
import Settings from './pages/admin/Settings';
import BookingPage from './pages/public/BookingPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="availabilities" element={<AvailabilitiesList />} />
            <Route path="bookings" element={<BookingsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Public Booking Route */}
          <Route path="/book/:slug" element={<BookingPage />} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
