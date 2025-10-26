// Route path constants for type-safe navigation
// Use these constants instead of string literals throughout the application

export const ROUTES = {
  SIGNIN: '/signin',
  ACTIVITIES: '/activities',
  ACTIVITIES_TYPE: '/activities/:type',
  CALENDAR: '/calendar',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];

// Helper to generate activity type route
export const getActivityTypeRoute = (type: string) => `/activities/${type.toLowerCase()}`;
