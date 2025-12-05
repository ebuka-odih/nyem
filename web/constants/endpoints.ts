/**
 * API Endpoints Constants
 * Centralized endpoint definitions for the application
 */
export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    login: '/auth/login',
    register: '/auth/register',
  },
  profile: {
    me: '/profile/me',
    update: '/profile/update',
    updatePassword: '/profile/update-password',
  },
  items: {
    feed: '/items/feed',
    create: '/posts', // alias to ItemController@store
    show: (id: string | number) => `/items/${id}`,
    update: (id: string | number) => `/items/${id}`,
    delete: (id: string | number) => `/items/${id}`,
  },
  categories: '/categories',
  locations: '/locations',
  swipes: {
    create: '/swipes',
    pendingRequests: '/swipes/pending-requests',
  },
  tradeOffers: {
    pending: '/trade-offers/pending',
    respond: (id: string | number) => `/trade-offers/${id}/respond`,
  },
  matches: {
    list: '/matches',
    show: (id: string | number) => `/matches/${id}`,
  },
  conversations: {
    list: '/conversations',
    messages: (id: string | number) => `/conversations/${id}/messages`,
    matches: (id: string | number) => `/conversations/${id}/matches`,
  },
  messages: {
    create: '/messages',
  },
  reports: '/report',
  block: '/block',
  location: {
    update: '/location/update',
    nearby: '/location/nearby',
    status: '/location/status',
  },
};

