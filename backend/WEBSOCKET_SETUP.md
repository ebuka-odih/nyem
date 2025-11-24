# WebSocket/Real-time Broadcasting Setup

This document explains how to set up and use the real-time WebSocket broadcasting system for match notifications and messaging.

## Overview

The system uses Laravel's broadcasting feature to send real-time events via WebSockets. It supports:
- **Match Created**: Notifies users when they match with someone
- **Message Sent**: Notifies users when they receive a new message
- **Conversation Created**: Notifies users when a new conversation is created

## Broadcasting Driver Options

**Current Setup: Laravel Reverb** ✅ (Installed and Running)

### Option 1: Laravel Reverb (Currently Active - Laravel's Official WebSocket Server) ✅

**Status: Installed and Running on port 8080**

1. **Install Reverb:**
   ```bash
   composer require laravel/reverb
   php artisan reverb:install
   ```

2. **Configure `.env` with production credentials:**
   
   Generate credentials:
   ```bash
   php artisan tinker --execute="echo 'REVERB_APP_ID=' . \Illuminate\Support\Str::uuid() . PHP_EOL; echo 'REVERB_APP_KEY=' . \Illuminate\Support\Str::random(20) . PHP_EOL; echo 'REVERB_APP_SECRET=' . \Illuminate\Support\Str::random(40) . PHP_EOL;"
   ```
   
   Add to `.env`:
   ```env
   BROADCAST_DRIVER=reverb
   
   # Production Credentials (generate unique values for your deployment)
   REVERB_APP_ID=your-generated-app-id
   REVERB_APP_KEY=your-generated-app-key
   REVERB_APP_SECRET=your-generated-app-secret
   REVERB_HOST=yourdomain.com  # ⚠️ Update with your production domain
   REVERB_PORT=443
   REVERB_SCHEME=https
   ```
   
   **⚠️ Never commit `.env` files to version control. Credentials should only exist in your `.env` file.**
   
   **📋 See `REVERB_PRODUCTION_CREDENTIALS.md` for detailed production setup instructions.**

3. **Start Reverb server:**
   ```bash
   php artisan reverb:start
   ```
   
   The server is currently running in the background on `127.0.0.1:8080`

### Option 2: Pusher (For Production/Cloud Deployment)

1. **Install Pusher PHP SDK:**
   ```bash
   composer require pusher/pusher-php-server
   ```

2. **Configure `.env`:**
   ```env
   BROADCAST_DRIVER=pusher
   
   PUSHER_APP_ID=your-app-id
   PUSHER_APP_KEY=your-app-key
   PUSHER_APP_SECRET=your-app-secret
   PUSHER_APP_CLUSTER=mt1
   ```

3. **Get Pusher credentials:**
   - Sign up at https://pusher.com
   - Create a new app
   - Copy your credentials to `.env`

## Channel Authorization

The system uses private channels that require authentication:

- **`private-user.{user_id}`**: User-specific channel for matches and messages
- **`private-conversation.{conversation_id}`**: Conversation-specific channel for real-time chat

Channel authorization is handled in `routes/channels.php`. Users can only subscribe to:
- Their own user channel
- Conversation channels they are part of

## Events

### MatchCreated Event

**Triggered when:** A reciprocal swipe completes and a UserMatch is created

**Broadcast to:**
- `private-user.{user1_id}`
- `private-user.{user2_id}`

**Payload:**
```json
{
  "type": "match.created",
  "match_id": "uuid",
  "conversation_id": "uuid",
  "user1": {
    "id": "uuid",
    "username": "string",
    "photo": "url"
  },
  "user2": {
    "id": "uuid",
    "username": "string",
    "photo": "url"
  },
  "item1": {
    "id": "uuid",
    "title": "string",
    "photo": "url"
  },
  "item2": {
    "id": "uuid",
    "title": "string",
    "photo": "url"
  },
  "item1_user_id": "uuid",
  "item2_user_id": "uuid",
  "created_at": "timestamp"
}
```

**Frontend handling:**
- Determine which user/item is "yours" vs "theirs" based on authenticated user
- Show full-screen match modal
- Play vibration feedback
- Play match sound
- Offer "Start Chat" button

### MessageSent Event

**Triggered when:** A message is created in the database

**Broadcast to:**
- `private-conversation.{conversation_id}`
- `private-user.{receiver_id}`

**Payload:**
```json
{
  "type": "message.sent",
  "conversation_id": "uuid",
  "message": {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "text": "string",
    "created_at": "timestamp"
  }
}
```

**Frontend handling:**
- Vibrate device lightly when receiving a message
- Append new message to chat screen
- If user is NOT in chat page, show notification badge
- Play small notification 'ping' tone

### ConversationCreated Event

**Triggered when:** Two users match for the very first time (new conversation created)

**Broadcast to:**
- `private-user.{user1_id}`
- `private-user.{user2_id}`

**Payload:**
```json
{
  "type": "conversation.created",
  "conversation_id": "uuid",
  "user1": {
    "id": "uuid",
    "username": "string",
    "photo": "url"
  },
  "user2": {
    "id": "uuid",
    "username": "string",
    "photo": "url"
  }
}
```

**Frontend handling:**
- Update chat list UI immediately
- No need to poll for conversations again

## Frontend Integration

### React Native Example (using Pusher or compatible client)

```javascript
import Pusher from 'pusher-js/react-native';

// Initialize Pusher (works with Reverb too)
const pusher = new Pusher(REVERB_APP_KEY, {
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'https://your-api.com/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  },
});

// Subscribe to user channel
const userChannel = pusher.subscribe(`private-user.${userId}`);

// Listen for match created
userChannel.bind('match.created', (data) => {
  // Determine which item is yours
  const yourItem = data.item1_user_id === userId ? data.item1 : data.item2;
  const theirItem = data.item1_user_id === userId ? data.item2 : data.item1;
  const otherUser = data.user1.id === userId ? data.user2 : data.user1;
  
  // Show match modal
  showMatchModal({
    matchId: data.match_id,
    conversationId: data.conversation_id,
    user: otherUser,
    yourItem,
    theirItem,
  });
  
  // Vibrate and play sound
  Vibration.vibrate([0, 80, 60, 80]);
  playMatchSound();
});

// Listen for messages
userChannel.bind('message.sent', (data) => {
  if (data.message.receiver_id === userId) {
    // This is a message for you
    appendMessage(data.message);
    Vibration.vibrate([0, 40]);
    playNotificationSound();
  }
});

// Subscribe to conversation channel when in chat
const conversationChannel = pusher.subscribe(`private-conversation.${conversationId}`);

conversationChannel.bind('message.sent', (data) => {
  appendMessage(data.message);
});
```

## Authentication for Broadcasting

The frontend needs to authenticate WebSocket connections. Create an endpoint to handle this:

**Add to `routes/api.php`:**
```php
Route::middleware('auth:sanctum')->post('/broadcasting/auth', function (Request $request) {
    $user = $request->user();
    
    return response()->json([
        'auth' => \Illuminate\Support\Str::random(32),
    ]);
});
```

Or use Laravel's built-in broadcasting auth endpoint (if using Sanctum with stateful requests).

## Testing

1. **Test match creation:**
   - Create two users
   - Have User A swipe right on User B's item
   - Have User B swipe right on User A's item
   - Both users should receive `match.created` event

2. **Test messaging:**
   - Send a message from User A to User B
   - User B should receive `message.sent` event on both:
     - `private-user.{userB_id}` channel
     - `private-conversation.{conversation_id}` channel (if subscribed)

3. **Test channel authorization:**
   - Try to subscribe to another user's private channel
   - Should be rejected by authorization

## Queue Configuration

For production, events should be queued. Configure your queue driver in `.env`:

```env
QUEUE_CONNECTION=database
# or
QUEUE_CONNECTION=redis
```

Then run the queue worker:
```bash
php artisan queue:work
```

## Troubleshooting

1. **Events not broadcasting:**
   - Check `BROADCAST_DRIVER` in `.env`
   - Verify broadcasting credentials are correct
   - Check Laravel logs for errors
   - Ensure queue worker is running (if using queues)

2. **Channel authorization failing:**
   - Verify user is authenticated
   - Check `routes/channels.php` authorization logic
   - Ensure Bearer token is sent with WebSocket connection

3. **Frontend not receiving events:**
   - Verify WebSocket connection is established
   - Check browser console for connection errors
   - Verify channel subscription is successful
   - Check event names match (case-sensitive)

## Security Notes

- All channels are private and require authentication
- Users can only subscribe to their own user channel
- Users can only subscribe to conversations they're part of
- Bearer token authentication is required for WebSocket connections
- Consider implementing HMAC signature validation for additional security (future enhancement)

