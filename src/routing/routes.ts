export const ROUTES = {
    SIGNIN: '/signin',
    ACTIVITIES: '/activities',
    ACTIVITIES_TYPE: '/activities/:type',
    CALENDAR: '/calendar',
    RECIPES: '/recipes',
    RECIPE_VIEW: '/recipes/:id',
    RECIPE_ADD: '/recipes/new',
    RECIPE_EDIT: '/recipes/:id/edit',
} as const;

// Helper to generate activity type route
export const getActivityTypeRoute = (type: string) => `/activities/${type.toLowerCase()}`;

// Helper to generate recipe routes
export const getRecipeViewRoute = (id: string) => `/recipes/${id}`;
export const getRecipeEditRoute = (id: string) => `/recipes/${id}/edit`;
