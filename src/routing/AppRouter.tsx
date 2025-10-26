import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { ProtectedRoute } from './ProtectedRoute';
import SignIn from '@/screens/SignIn';
import ActivitySelection from '@/screens/ActivitySelection';
import ViewCalendar from '@/screens/ViewCalendar';
import RecipeList from '@/screens/RecipeList';
import ViewRecipe from '@/screens/ViewRecipe';
import AddRecipe from '@/screens/AddRecipe';
import EditRecipe from '@/screens/EditRecipe';

export function AppRouter() {
  return (
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
        path={ROUTES.ACTIVITIES_TYPE}
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
      <Route
        path={ROUTES.RECIPES}
        element={
          <ProtectedRoute>
            <RecipeList />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECIPE_ADD}
        element={
          <ProtectedRoute>
            <AddRecipe />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECIPE_VIEW}
        element={
          <ProtectedRoute>
            <ViewRecipe />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECIPE_EDIT}
        element={
          <ProtectedRoute>
            <EditRecipe />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.ACTIVITIES} replace />} />
    </Routes>
  );
}
