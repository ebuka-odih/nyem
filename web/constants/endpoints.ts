/**
 * API Endpoints Constants
 * Centralized endpoint definitions for the application
 */
export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/send-otp',
    sendEmailOtp: '/auth/send-email-otp',
    verifyOtp: '/auth/verify-otp',
    verifyPhoneForSeller: '/auth/verify-phone-for-seller',
    login: '/auth/login',
    register: '/auth/register',
    google: '/auth/google',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  profile: {
    me: '/profile/me',
    update: '/profile/update',
    updatePassword: '/profile/update-password',
    checkUsername: '/profile/check-username',
    updateOneSignalPlayerId: '/profile/onesignal-player-id',
    payments: '/profile/payments',
    getBanks: '/profile/banks',
    verifyBank: '/profile/verify-bank',
  },
  items: {
    feed: '/items/feed',
    create: '/posts', // alias to ItemController@store
    show: (id: string | number) => `/items/${id}`,
    update: (id: string | number) => `/items/${id}`,
    delete: (id: string | number) => `/items/${id}`,
    trackView: (id: string | number) => `/items/${id}/view`,
    trackShare: (id: string | number) => `/items/${id}/share`,
  },
  categories: '/categories',
  locations: '/locations',
  locationsCities: '/locations/cities',
  locationsAreas: (cityId?: string | number) => cityId ? `/locations/cities/${cityId}/areas` : '/locations/areas',
  swipes: {
    create: '/swipes',
    pendingRequests: '/swipes/pending-requests',
    wishlist: '/swipes/wishlist',
  },
  tradeOffers: {
    pending: '/trade-offers/pending',
    respond: (id: string | number) => `/trade-offers/${id}/respond`,
  },
  messageRequests: {
    pending: '/message-requests/pending',
    respond: (id: string | number) => `/message-requests/${id}/respond`,
  },
  matches: {
    list: '/matches',
    show: (id: string | number) => `/matches/${id}`,
  },
  conversations: {
    list: '/conversations',
    start: '/conversations/start',
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
  images: {
    upload: '/images/upload',
    uploadMultiple: '/images/upload-multiple',
    uploadBase64: '/images/upload-base64',
    uploadMultipleBase64: '/images/upload-multiple-base64',
  },
  serviceProviders: {
    feed: '/service-providers/feed',
    create: '/service-providers',
    me: '/service-providers/me',
  },
  notifications: {
    test: '/notifications/test',
    testMe: '/notifications/test/me',
  },
};




