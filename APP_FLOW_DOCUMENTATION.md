# Nyem App Flow Documentation

## Overview

**Nyem** is a mobile item trading/swapping application built with React Native (frontend) and Laravel (backend). The app uses a Tinder-style swipe interface where users can swipe right on items they're interested in trading for, and swipe left to pass. When two users both swipe right on each other's items, a match is created, enabling them to chat and arrange a trade.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Item Management Flow](#item-management-flow)
3. [Swipe & Match Flow](#swipe--match-flow)
4. [Match Request Flow](#match-request-flow)
5. [Chat Flow](#chat-flow)
6. [User Profile Flow](#user-profile-flow)
7. [Blocking & Moderation Flow](#blocking--moderation-flow)
8. [Technical Architecture](#technical-architecture)

---

## Authentication Flow

### Phone-Based OTP Authentication

**Frontend Screens:**
- `WelcomeScreen` → `PhoneLoginScreen` → `OTPVerificationScreen` → `AccountSetupScreen` (for new users) or `MainTabs` (for existing users)

**Backend Endpoints:**
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/login` (alternative: username/password)
- `POST /auth/register` (alternative: username/password)

**Flow Steps:**

1. **Send OTP** (`POST /auth/send-otp`)
   - User enters phone number
   - Backend generates 6-digit OTP code
   - OTP stored in `otp_codes` table with 5-minute expiry
   - Returns debug code (for development/testing)

2. **Verify OTP** (`POST /auth/verify-otp`)
   - User enters OTP code
   - Backend validates OTP (checks phone, code, expiry, not consumed)
   - If valid:
     - Marks OTP as consumed
     - Creates user if doesn't exist (or updates existing user)
     - Generates Laravel Sanctum token
     - Returns token and user data
   - Frontend stores token in AsyncStorage
   - If new user (`new_user: true`), navigates to `AccountSetupScreen`
   - If existing user, navigates to `MainTabs`

3. **Token Management**
   - Token stored in AsyncStorage as `auth_token`
   - Token sent in `Authorization: Bearer {token}` header for authenticated requests
   - Token validated via Laravel Sanctum middleware (`auth:sanctum`)

---

## Item Management Flow

### Creating an Item

**Frontend:** `UploadItemScreen`
**Backend:** `POST /items` (or `/posts` alias)

**Flow:**
1. User fills form:
   - Title (required)
   - Description (optional)
   - Category (required, from predefined list)
   - Condition (required: `new`, `like_new`, `used`)
   - Photos (required, array of URLs, max 5)
   - Looking For (required - what they want in exchange)
   - City (optional, defaults to user's city)

2. Backend creates item:
   - Validates all fields
   - Sets `user_id` to authenticated user
   - Sets `status` to `active`
   - Sets `city` to provided city or user's city
   - Stores photos array as JSON

3. Item appears in feed for other users in the same city

### Viewing Items Feed

**Frontend:** `SwipeFeedScreen`
**Backend:** `GET /items/feed`

**Filtering Logic:**
- Only shows items where `status = 'active'`
- Excludes user's own items
- Excludes items from blocked users
- **City-based filtering:** Only shows items from users in the same city as the current user
- Optional category filter via query parameter
- Ordered by `latest` (newest first)

**Display:**
- Card-based swipe interface
- Shows: main photo, title, condition, owner username, looking_for, city
- User can filter by category
- User can swipe left (pass) or right (interested)

---

## Swipe & Match Flow

### The Core Matching Logic

This is the heart of the application. Here's how matches are created:

### Step-by-Step Match Creation

#### Scenario 1: User A swipes right on User B's item

1. **User A swipes right** on an item owned by User B
   - Frontend calls `POST /swipes` with:
     ```json
     {
       "target_item_id": "item-b-id",
       "direction": "right"
     }
     ```

2. **Backend Processing** (`SwipeController@store`):
   - Validates request (authenticated user, valid item, direction is left/right)
   - Checks: user can't swipe on own items
   - Checks: users aren't blocked
   - Creates/updates `Swipe` record:
     - `from_user_id`: User A
     - `target_item_id`: User B's item
     - `direction`: "right"

3. **Match Check** (if direction is "right"):
   - Backend checks if User B has swiped right on ANY of User A's items
   - Query: Find swipes where:
     - `from_user_id` = User B
     - `target_item_id` IN (all of User A's item IDs)
     - `direction` = "right"
     - Get the most recent one

4. **If Reciprocal Swipe Found:**
   - A match is created in `user_matches` table
   - User IDs are sorted alphabetically (for consistent ordering with UUIDs)
   - Creates `UserMatch` record:
     - `user1_id`: Lower UUID (alphabetically)
     - `user2_id`: Higher UUID (alphabetically)
     - `item1_id`: Item from user1
     - `item2_id`: Item from user2
   - Returns `match_created: true` and match data

5. **Frontend Response:**
   - If `match_created: true`, shows match modal
   - User can navigate to Matches tab or continue swiping

#### Scenario 2: User B swipes right on User A's item (after User A already swiped)

1. **User B swipes right** on User A's item
2. Same backend processing occurs
3. Backend finds User A's previous right swipe on User B's item
4. Match is created immediately
5. Both users see the match

### Key Points:

- **Match is created when BOTH users swipe right on each other's items**
- The order doesn't matter - match is created when the second person swipes right
- Each match links two specific items (the items that were swiped on)
- Users can have multiple matches with the same person (if they have multiple items)

### Swipe Left (Pass)

- Creates/updates `Swipe` record with `direction: "left"`
- No match check is performed
- Item is removed from user's feed (won't show again)

### Swipe Data Model

```php
Swipe {
  id: UUID
  from_user_id: UUID (user who swiped)
  target_item_id: UUID (item that was swiped on)
  direction: "left" | "right"
  created_at: timestamp
}
```

### Match Data Model

```php
UserMatch {
  id: UUID
  user1_id: UUID (alphabetically first)
  user2_id: UUID (alphabetically second)
  item1_id: UUID (item from user1)
  item2_id: UUID (item from user2)
  created_at: timestamp
}
```

---

## Match Request Flow

### What is a Match Request?

A **match request** is when someone has swiped right on YOUR item, but you haven't swiped on their items yet. It's a notification that someone is interested in your item.

**Frontend:** `MatchRequestScreen` (accessible from Matches tab)
**Backend:** `GET /swipes/pending-requests`

### How Match Requests Work

1. **User A swipes right on User B's item**
   - Creates a swipe record
   - User B hasn't swiped on User A's items yet
   - This creates a "pending request" for User B

2. **User B views Match Requests**
   - Backend query finds all right swipes on User B's items
   - Filters out:
     - Swipes from blocked users
     - Items User B has already swiped on
     - Swipes from User B themselves
   - Returns list of requests with:
     - User who swiped (from_user)
     - Item they swiped on (target_item)
     - Other items from that user (that User B can swipe on)
     - Whether they're already matched (`is_matched`)

3. **User B Responds to Request**
   - Opens request modal
   - Sees the other user's items
   - Can swipe right (interested) or left (not interested) on each item
   - If User B swipes right on User A's item:
     - Match is created immediately (since User A already swiped right)
     - Match modal appears
   - If User B swipes left:
     - No match created
     - Request is removed from list

### Match Request Data Structure

```json
{
  "id": "swipe-id",
  "from_user": {
    "id": "user-id",
    "username": "username",
    "profile_photo": "url",
    "city": "city"
  },
  "target_item": {
    "id": "item-id",
    "title": "Item Title",
    "photos": ["url1", "url2"],
    "condition": "new"
  },
  "other_user_items": [
    {
      "id": "item-id",
      "title": "Item Title",
      "photos": ["url"],
      "condition": "used",
      "category": "Electronics",
      "looking_for": "Something"
    }
  ],
  "is_matched": false,
  "created_at": "timestamp"
}
```

---

## Chat Flow

### Accessing Chat

**Frontend:** `ChatScreen`
**Backend:** `GET /messages/{match_id}`, `POST /messages`

### Flow:

1. **User views Matches** (`MatchListScreen`)
   - Fetches all matches via `GET /matches`
   - Shows list of matched users with their profile photos
   - Displays the item they matched on

2. **User opens Chat**
   - Taps on a match
   - Navigates to `ChatScreen` with match data
   - Fetches messages via `GET /messages/{match_id}`
   - Backend validates user is part of the match
   - Backend checks for blocking between users

3. **Sending Messages**
   - User types message
   - Frontend calls `POST /messages` with:
     ```json
     {
       "match_id": "match-id",
       "message_text": "Hello!"
     }
     ```
   - Backend:
     - Validates user is part of match
     - Checks for blocking
     - Creates `Message` record:
       - `match_id`: The match ID
       - `sender_id`: Current user
       - `receiver_id`: Other user in match
       - `message_text`: Message content
   - Message appears in chat

### Message Data Model

```php
Message {
  id: UUID
  match_id: UUID (links to UserMatch)
  sender_id: UUID
  receiver_id: UUID
  message_text: string (max 1000 chars)
  created_at: timestamp
}
```

### Chat Features

- One-to-one messaging (only between matched users)
- Messages are scoped to a specific match
- Real-time updates (currently requires refresh - websockets not implemented yet)
- Blocked users cannot send/receive messages

---

## User Profile Flow

### Viewing Profile

**Frontend:** `ProfileScreen`
**Backend:** `GET /profile/me`

### Profile Data:
- Username
- Profile photo
- Bio
- City
- List of user's items
- Edit profile button

### Editing Profile

**Frontend:** `EditProfileScreen`
**Backend:** `PUT /profile/update`

**Editable Fields:**
- Username
- Bio
- Profile photo (URL)
- City

### Updating Password

**Frontend:** `UpdatePasswordScreen`
**Backend:** `PUT /profile/update-password`

**Flow:**
- Requires current password
- Validates new password and confirmation match
- Updates password hash

---

## Blocking & Moderation Flow

### Blocking Users

**Backend:** `POST /block`
**Model:** `Block`

**Flow:**
1. User A blocks User B
2. Creates `Block` record:
   - `blocker_id`: User A
   - `blocked_user_id`: User B
3. Effects:
   - User A won't see User B's items in feed
   - User B won't see User A's items in feed
   - Cannot swipe on each other's items
   - Cannot send/receive messages (even if matched)
   - Cannot view matches with blocked user

### Reporting Users

**Backend:** `POST /report`
**Model:** `Report`

**Flow:**
1. User submits report with:
   - Reported user ID
   - Reason/category
   - Description
2. Creates `Report` record for admin review
3. No immediate action (admin must review)

### Blocking Logic Implementation

The `Controller` base class provides helper methods:

- `blockedUserIds(User $user)`: Returns array of all user IDs that are blocked (either user blocked them or they blocked user)
- `isBlockedBetween(User $user, string $otherUserId)`: Checks if blocking exists in either direction

These methods are used throughout:
- Item feed filtering
- Swipe validation
- Match viewing
- Message sending
- Match request filtering

---

## Technical Architecture

### Frontend (React Native)

**Tech Stack:**
- React Native with TypeScript
- React Navigation (Stack + Bottom Tabs)
- Expo (for image picking, etc.)
- AsyncStorage (for token persistence)
- Context API (AuthContext for global auth state)

**Key Components:**
- `AppNavigator`: Main navigation structure
- `AuthContext`: Global authentication state management
- `SwipeFeedScreen`: Main swipe interface using `react-native-deck-swiper`
- `MatchRequestScreen`: Shows pending match requests
- `MatchListScreen`: Lists all matches
- `ChatScreen`: One-to-one messaging interface

**State Management:**
- Local component state (useState)
- Context API for auth
- AsyncStorage for persistence

### Backend (Laravel)

**Tech Stack:**
- Laravel (PHP framework)
- Laravel Sanctum (API token authentication)
- SQLite database (development)
- UUID primary keys for all models

**Key Models:**
- `User`: User accounts
- `Item`: Items for trade
- `Swipe`: Swipe records
- `UserMatch`: Matches between users
- `Message`: Chat messages
- `Block`: User blocking records
- `Report`: User reports
- `OtpCode`: OTP verification codes

**Key Controllers:**
- `AuthController`: Authentication (OTP, login, register)
- `ItemController`: Item CRUD operations
- `SwipeController`: Swipe creation and match logic
- `MatchController`: Match retrieval
- `MessageController`: Message CRUD
- `ProfileController`: User profile management
- `ModerationController`: Blocking and reporting

**Database Relationships:**
- User hasMany Items
- User hasMany Swipes (as from_user)
- Item hasMany Swipes (as target_item)
- UserMatch belongsTo User (user1, user2)
- UserMatch belongsTo Item (item1, item2)
- UserMatch hasMany Messages
- Message belongsTo UserMatch
- Message belongsTo User (sender, receiver)

### API Authentication

- Laravel Sanctum tokens
- Token stored in `personal_access_tokens` table
- Token sent in `Authorization: Bearer {token}` header
- Middleware: `auth:sanctum` protects routes

### API Endpoints Summary

**Public:**
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/register`

**Authenticated:**
- `GET /profile/me`
- `PUT /profile/update`
- `PUT /profile/update-password`
- `POST /items` (create)
- `GET /items/feed` (list)
- `GET /items/{id}` (show)
- `PUT /items/{id}` (update)
- `DELETE /items/{id}` (delete)
- `POST /swipes` (create swipe)
- `GET /swipes/pending-requests` (get match requests)
- `GET /matches` (list matches)
- `GET /matches/{id}` (show match)
- `GET /messages/{match_id}` (get messages)
- `POST /messages` (send message)
- `POST /report` (report user)
- `POST /block` (block user)

---

## Data Flow Diagrams

### Match Creation Flow

```
User A                    Backend                    User B
  |                          |                         |
  |-- Swipe Right ---------->|                         |
  |   (Item B)               |                         |
  |                          |-- Create Swipe          |
  |                          |   Record                |
  |                          |                         |
  |                          |-- Check for             |
  |                          |   Reciprocal Swipe      |
  |                          |   (None found)          |
  |<-- No Match -------------|                         |
  |                          |                         |
  |                          |                         |
  |                          |<-- Swipe Right ---------|
  |                          |   (Item A)              |
  |                          |                         |
  |                          |-- Create Swipe          |
  |                          |   Record                |
  |                          |                         |
  |                          |-- Check for             |
  |                          |   Reciprocal Swipe      |
  |                          |   (Found!)              |
  |                          |                         |
  |                          |-- Create Match          |
  |                          |                         |
  |<-- Match Created! -------|                         |
  |                          |-- Match Created! ------->
```

### Match Request Flow

```
User A                    Backend                    User B
  |                          |                         |
  |-- Swipe Right ---------->|                         |
  |   (Item B)               |                         |
  |                          |-- Create Swipe          |
  |                          |   Record                |
  |                          |                         |
  |                          |                         |
  |                          |<-- Get Pending ---------|
  |                          |   Requests              |
  |                          |                         |
  |                          |-- Find Swipes on        |
  |                          |   User B's Items        |
  |                          |                         |
  |                          |-- Return Request ------->
  |                          |   (User A swiped)       |
  |                          |                         |
  |                          |<-- Swipe Right ---------|
  |                          |   (Item A)              |
  |                          |                         |
  |                          |-- Create Match          |
  |                          |                         |
  |<-- Match Created! -------|-- Match Created! ------->
```

---

## Key Business Rules

1. **City-Based Filtering**: Users only see items from users in the same city
2. **Mutual Interest Required**: Both users must swipe right on each other's items to create a match
3. **Item-Specific Matches**: Each match is tied to specific items (not just users)
4. **Blocking is Bidirectional**: If User A blocks User B, they can't interact in either direction
5. **No Self-Swiping**: Users cannot swipe on their own items
6. **Swipe Updates**: If a user swipes on the same item again, the swipe record is updated (not duplicated)
7. **Match Uniqueness**: `firstOrCreate` ensures one match per user pair + item pair combination
8. **Alphabetical User Ordering**: User IDs are sorted alphabetically in matches for consistency (UUIDs)

---

## Future Enhancements (Not in MVP)

- Real-time messaging (WebSockets)
- Push notifications for matches and messages
- Image upload to cloud storage (currently URLs)
- Advanced filtering (beyond city/category)
- Search functionality
- Rating/review system
- Delivery coordination
- Payment integration
- AI-based matching suggestions

---

## Notes

- The app uses UUIDs for all primary keys
- OTP codes are returned in debug mode for development
- Photos are stored as URLs (not uploaded to backend yet)
- Chat messages are not real-time (requires refresh)
- Match requests show all items from the other user that haven't been swiped on yet
- The feed ordering is currently just "latest" - future enhancement could include smart ordering based on "looking_for" matches

