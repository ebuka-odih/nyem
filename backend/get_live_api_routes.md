# Live API Routes for Nyem

**Base URL:** `https://nyem.gnosisbrand.com/backend/public/api`

## Authentication Routes (No Auth Required)

### POST `/api/auth/send-otp`
Send OTP code to phone number
- **Body:** `{ "phone": "string" }`

### POST `/api/auth/verify-otp`
Verify OTP and create/login user
- **Body:** 
  ```json
  {
    "phone": "string",
    "code": "string",
    "username": "string (optional)",
    "bio": "string (optional)",
    "profile_photo": "string (optional)",
    "city": "string (optional)",
    "password": "string (optional, min:6)"
  }
  ```

### POST `/api/auth/login`
Login with username/phone and password
- **Body:** 
  ```json
  {
    "username_or_phone": "string",
    "password": "string"
  }
  ```

### POST `/api/auth/register`
Register new user
- **Body:**
  ```json
  {
    "phone": "string (unique)",
    "username": "string (unique)",
    "password": "string (min:6)",
    "city": "string (optional)",
    "profile_photo": "string (optional)"
  }
  ```

## Protected Routes (Requires Bearer Token)

All routes below require `Authorization: Bearer {token}` header.

### Profile Routes

#### GET `/api/profile/me`
Get current user profile

#### PUT `/api/profile/update`
Update user profile
- **Body:**
  ```json
  {
    "username": "string (optional)",
    "city": "string (optional)",
    "bio": "string (optional)",
    "profile_photo": "string (optional)",
    "password": "string (optional)"
  }
  ```

#### PUT `/api/profile/update-password`
Update user password
- **Body:**
  ```json
  {
    "current_password": "string",
    "new_password": "string",
    "new_password_confirmation": "string"
  }
  ```

### Items/Posts Routes

#### POST `/api/items`
Create a new item/post
- **Body:** (see ItemController for full schema)

#### POST `/api/posts`
Alias for `/api/items` - Create a new post

#### GET `/api/items/feed`
Get feed of items

#### GET `/api/items/{item}`
Get specific item by ID

#### PUT `/api/items/{item}`
Update item by ID

#### DELETE `/api/items/{item}`
Delete item by ID

### Swipes Routes

#### POST `/api/swipes`
Create a swipe (like/dislike)
- **Body:** (see SwipeController for full schema)

### Matches Routes

#### GET `/api/matches`
Get all matches for current user

#### GET `/api/matches/{match}`
Get specific match by ID

### Messages Routes

#### GET `/api/messages/{match}`
Get messages for a specific match

#### POST `/api/messages`
Send a message
- **Body:** (see MessageController for full schema)

### Moderation Routes

#### POST `/api/report`
Report content/user
- **Body:** (see ModerationController for full schema)

#### POST `/api/block`
Block a user
- **Body:** (see ModerationController for full schema)

## Testing the API

You can test the API endpoints using curl:

```bash
# Test base endpoint
curl https://nyem.gnosisbrand.com/backend/public/api/

# Test login
curl -X POST https://nyem.gnosisbrand.com/backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_phone":"test","password":"password"}'

# Test authenticated endpoint (replace TOKEN with actual token)
curl https://nyem.gnosisbrand.com/backend/public/api/profile/me \
  -H "Authorization: Bearer TOKEN"
```





































