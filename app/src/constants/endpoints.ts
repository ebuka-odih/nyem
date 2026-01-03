export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/send-otp',
    sendEmailOtp: '/auth/send-email-otp',
    verifyOtp: '/auth/verify-otp',
    verifyPhoneForSeller: '/auth/verify-phone-for-seller',
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
  },
  categories: '/categories',
  locations: '/locations',
  swipes: '/swipes',
  pendingRequests: '/swipes/pending-requests', // deprecated
  tradeOffers: {
    pending: '/trade-offers/pending',
    respond: (id: string) => `/trade-offers/${id}/respond`,
  },
  matches: '/matches',
  conversations: '/conversations',
  conversationsStart: '/conversations/start',
  conversationMessages: (id: string) => `/conversations/${id}/messages`,
  conversationMatches: (id: string) => `/conversations/${id}/matches`,
  messages: '/messages',
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
};
