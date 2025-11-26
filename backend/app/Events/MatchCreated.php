<?php

namespace App\Events;

use App\Models\UserMatch;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $match;
    public $user1Id;
    public $user2Id;

    /**
     * Create a new event instance.
     */
    public function __construct(UserMatch $match)
    {
        $this->match = $match->load(['user1', 'user2', 'item1', 'item2', 'conversation']);
        $this->user1Id = $match->user1_id;
        $this->user2Id = $match->user2_id;
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
        return 'match.created';
    }

    /**
     * Get the data to broadcast.
     * Note: This method is called once, but we need different payloads per user.
     * Laravel will broadcast the same payload to both channels.
     * The frontend should handle determining "your_item" vs "their_item" based on the user.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $match = $this->match;
        $user1 = $match->user1;
        $user2 = $match->user2;
        $item1 = $match->item1;
        $item2 = $match->item2;

        // Include all data - frontend will determine which is "your_item" vs "their_item"
        // based on the authenticated user receiving the event
        return [
            'type' => 'match.created',
            'match_id' => $match->id,
            'conversation_id' => $match->conversation_id,
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
            'item1' => [
                'id' => $item1->id,
                'title' => $item1->title,
                'photo' => !empty($item1->photos) ? $item1->photos[0] : null,
            ],
            'item2' => [
                'id' => $item2->id,
                'title' => $item2->title,
                'photo' => !empty($item2->photos) ? $item2->photos[0] : null,
            ],
            'item1_user_id' => $item1->user_id,
            'item2_user_id' => $item2->user_id,
            'created_at' => $match->created_at->toIso8601String(),
        ];
    }
}

