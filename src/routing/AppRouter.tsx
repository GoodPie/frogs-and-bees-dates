import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { ProtectedRoute } from './ProtectedRoute';
import SignIn from '@/screens/SignIn';
import ActivitySelection from '@/screens/activities/ActivitySelection';
import ViewCalendar from '@/screens/calendar/ViewCalendar';
import RecipeList from '@/screens/recipe-management/RecipeList';
import ViewRecipe from '@/screens/recipe-management/ViewRecipe';
import AddRecipe from '@/screens/recipe-management/AddRecipe';
import EditRecipe from '@/screens/recipe-management/EditRecipe';

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
