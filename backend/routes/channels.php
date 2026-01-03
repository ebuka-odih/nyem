<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private user channel: user.{userId}
Broadcast::channel('user.{userId}', function ($user, $userId) {
    // Users can only subscribe to their own channel
    return (string) $user->id === (string) $userId;
});

// Private conversation channel: conversation.{conversationId}
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    // Check if user is part of the conversation
    $conversation = \App\Models\UserConversation::find($conversationId);
    
    if (!$conversation) {
        return false;
    }
    
    return in_array($user->id, [$conversation->user1_id, $conversation->user2_id], true);
});

