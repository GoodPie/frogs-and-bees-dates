import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { ProtectedRoute } from './ProtectedRoute';
import SignIn from '@/screens/SignIn';
import ActivitySelection from '@/screens/ActivitySelection';
import ViewCalendar from '@/screens/ViewCalendar';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.SIGNIN} element={<SignIn />} />
        <Route
          path={ROUTES.ACTIVITIES}
          element={
            <ProtectedRoute>
              <ActivitySelection />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CALENDAR}
          element={
            <ProtectedRoute>
              <ViewCalendar />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.ACTIVITIES} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
