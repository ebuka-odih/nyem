<?php

namespace App\Events;

use App\Models\UserConversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversation;
    public $user1Id;
    public $user2Id;

    /**
     * Create a new event instance.
     */
    public function __construct(UserConversation $conversation)
    {
        $this->conversation = $conversation->load(['user1', 'user2']);
        $this->user1Id = $conversation->user1_id;
        $this->user2Id = $conversation->user2_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->user1Id),
            new PrivateChannel('user.'.$this->user2Id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'conversation.created';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $conversation = $this->conversation;
        $user1 = $conversation->user1;
        $user2 = $conversation->user2;

        // Include both users so frontend can determine which is "other"
        return [
            'type' => 'conversation.created',
            'conversation_id' => $conversation->id,
            'user1' => [
                'id' => $user1->id,
                'username' => $user1->username,
                'photo' => $user1->profile_photo,
            ],
            'user2' => [
                'id' => $user2->id,
                'username' => $user2->username,
                'photo' => $user2->profile_photo,
            ],
        ];
    }
}

