# Nyem - Item Trading App

A Tinder-style mobile application for trading items locally, built with React Native and Expo.

## Project Overview

Nyem is an MVP mobile app that allows users to trade items with others in their city using a swipe-based interface. Users can upload items they want to trade, specify what they're looking for in exchange, and swipe through available items to find matches.

## Features Implemented

### ✅ Authentication Flow
- **Welcome Screen**: App introduction with branding and features
- **Phone Login**: Phone number-based authentication with OTP
- **OTP Verification**: 6-digit OTP input with auto-focus
- **Profile Setup**: User profile creation with photo upload, username, bio, and city selection

### ✅ Main App Screens
- **Swipe Feed**: Tinder-style card interface for browsing items
  - Swipeable cards with item photos
  - Item details (title, condition, category)
  - Owner information
  - "Looking for" field
  - Swipe left to pass, right to show interest
  
- **Upload Item**: Form to post new items for trade
  - Multiple photo upload
  - Title, description, category, condition
  - "Looking for" specification
  
- **Match List**: View matched traders
  - List of users who matched with you
  - Navigate to chat from matches
  
- **Profile Screen**: User profile management
  - Profile photo and info
  - List of user's posted items
  - Settings and logout options
  
- **Chat Screen**: One-to-one messaging
  - Message bubbles
  - Real-time chat interface (mock)
  
- **Item Details**: Detailed view of items
  - Image carousel
  - Full item description
  - Owner profile
  - Action buttons (Pass/Interested)

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **UI Components**: React Native core components
- **Gestures**: React Native Gesture Handler
- **Swipe Cards**: react-native-deck-swiper
- **Image Picker**: expo-image-picker
- **Icons**: @expo/vector-icons (Ionicons)

## Project Structure

```
app/
├── src/
│   ├── screens/          # All app screens
│   │   ├── WelcomeScreen.tsx
│   │   ├── PhoneLoginScreen.tsx
│   │   ├── OTPVerificationScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── SwipeFeedScreen.tsx
│   │   ├── UploadItemScreen.tsx
│   │   ├── MatchListScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ItemDetailsScreen.tsx
│   ├── navigation/       # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/       # App constants and colors
│   │   └── colors.ts
│   ├── components/      # Reusable components (empty for now)
│   └── utils/          # Utility functions (empty for now)
├── assets/             # Images and fonts
├── App.tsx            # Main app entry point
├── app.json           # Expo configuration
├── babel.config.js    # Babel configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript configuration
```

## Design System

### Color Palette
- **Primary**: #FF4F5A (Vibrant red/pink)
- **Secondary**: #FFFFFF (White)
- **Background**: #F8F8F8 (Light gray)
- **Text Primary**: #222222 (Dark gray)
- **Text Secondary**: #555555 (Medium gray)
- **Success**: #4CAF50 (Green)
- **Warning**: #FFC107 (Amber)
- **Error**: #F44336 (Red)

### UI Principles
- Clean, modern card-based design
- Rounded corners and subtle shadows
- Minimal text, focus on visuals
- Large, tappable buttons
- Smooth animations and transitions

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Install Dependencies
```bash
cd app
npm install
```

### Run the App

#### Web
```bash
npm run web
# or
npx expo start --web
```

#### iOS Simulator
```bash
npm run ios
# or
npx expo start --ios
```

#### Android Emulator
```bash
npm run android
# or
npx expo start --android
```

#### Expo Go (Physical Device)
```bash
npm start
# Scan the QR code with Expo Go app
```

## Current Status

### ✅ Completed
- Project setup and configuration
- All screen interfaces designed and implemented
- Navigation flow between screens
- Mock data for testing
- TypeScript type definitions
- Color scheme and design system
- Web support configured

### 🚧 To Be Implemented (Backend Integration)
- Actual API integration for authentication
- Real-time chat functionality (WebSockets)
- Image upload to cloud storage
- Swipe history tracking
- Match algorithm
- Push notifications
- User profile management
- Item CRUD operations
- City-based filtering
- Report/Block functionality

## Mock Data

The app currently uses mock data for demonstration:
- Sample items in SwipeFeed
- Sample matches in MatchList
- Sample user profile

## API Endpoints (To Be Implemented)

Based on APP.json specifications:

### Auth
- `POST /auth/send-otp`
- `POST /auth/verify-otp`

### Profile
- `GET /profile/me`
- `PUT /profile/update`

### Items
- `POST /items`
- `GET /items/feed`
- `GET /items/:id`
- `PUT /items/:id`
- `DELETE /items/:id`

### Swipes
- `POST /swipes`

### Matches
- `GET /matches`
- `GET /matches/:id`

### Chat
- `GET /messages/:match_id`
- `POST /messages`

### Moderation
- `POST /report`
- `POST /block`

## Categories Supported

- Electronics
- Fashion
- Household
- Food Items
- Accessories
- Beauty
- Baby/Kids
- Books
- Sports
- Other

## Item Conditions

- New
- Like New
- Used

## Testing

The app has been tested on:
- ✅ Web browser (localhost:8081)
- ⏳ iOS Simulator (pending)
- ⏳ Android Emulator (pending)
- ⏳ Physical devices (pending)

## Known Issues

1. Profile Setup screen doesn't navigate to main app on web (button click handler may need debugging)
2. Some package version warnings (react-native-gesture-handler, react-native-screens)
3. Image picker requires permissions on mobile devices
4. Swipe gestures may not work perfectly on web

## Next Steps

1. Debug profile setup navigation issue
2. Integrate with backend API
3. Implement real-time chat with WebSockets
4. Add image upload to cloud storage (e.g., Cloudinary, AWS S3)
5. Implement swipe matching algorithm
6. Add push notifications
7. Test on iOS and Android devices
8. Optimize performance
9. Add error handling and loading states
10. Implement user feedback (toasts, alerts)

## License

This project is part of the Nyem MVP development.

## Contact

For questions or support, please contact the development team.
