<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message->load(['sender', 'receiver']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.'.$this->message->conversation_id),
            new PrivateChannel('user.'.$this->message->receiver_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $sender = $this->message->sender;
        
        return [
            'type' => 'message.sent',
            'conversation_id' => $this->message->conversation_id,
            'message' => [
                'id' => $this->message->id,
                'message_id' => $this->message->id,
                'sender_id' => $this->message->sender_id,
                'receiver_id' => $this->message->receiver_id,
                'message_text' => $this->message->message_text,
                'text' => $this->message->message_text, // Also include 'text' for compatibility
                'created_at' => $this->message->created_at->toIso8601String(),
                'timestamp' => $this->message->created_at->toIso8601String(),
                'sender' => $sender ? [
                    'id' => $sender->id,
                    'username' => $sender->username,
                    'profile_photo' => $sender->profile_photo,
                ] : null,
            ],
        ];
    }
}

