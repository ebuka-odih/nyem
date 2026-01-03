<?php

namespace App\Http\Controllers;

use App\Events\ConversationCreated;
use App\Events\MessageSent;
use App\Models\MessageRequest;
use App\Models\UserConversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MessageRequestController extends Controller
{
    /**
     * Get all pending message requests for the authenticated user (seller)
     */
    public function pending(Request $request)
    {
        $user = $request->user();

        // Get all pending message requests where current user is the recipient (seller)
        $messageRequests = MessageRequest::where('to_user_id', $user->id)
            ->where('status', 'pending')
            ->with(['fromUser', 'listing'])
            ->latest()
            ->get();

        // Filter out requests from blocked users
        $blockedUserIds = $this->blockedUserIds($user);

        $filteredRequests = $messageRequests->filter(function ($request) use ($blockedUserIds) {
            return !in_array($request->from_user_id, $blockedUserIds);
        })->map(function ($request) {
            $listing = $request->listing;
            $listingPhotos = $listing && !empty($listing->photos) ? $listing->photos : [];
            
            return [
                'id' => $request->id,
                'from_user' => [
                    'id' => $request->fromUser->id,
                    'username' => $request->fromUser->username,
                    'name' => $request->fromUser->name ?? $request->fromUser->username,
                    'photo' => $request->fromUser->profile_photo ?? null,
                    'city' => $request->fromUser->city,
                ],
                'listing' => [
                    'id' => $listing->id ?? null,
                    'title' => $listing->title ?? 'Unknown Listing',
                    'photo' => !empty($listingPhotos) ? $listingPhotos[0] : null,
                    'price' => $listing->price ?? null,
                ],
                'item' => [ // Backward compatibility
                    'id' => $listing->id ?? null,
                    'title' => $listing->title ?? 'Unknown Listing',
                    'photo' => !empty($listingPhotos) ? $listingPhotos[0] : null,
                ],
                'message_text' => $request->message_text,
                'status' => $request->status,
                'created_at' => $request->created_at,
            ];
        })->values();

        return response()->json([
            'requests' => $filteredRequests,
        ]);
    }

    /**
     * Respond to a message request (accept or decline)
     */
    public function respond(Request $request, string $id)
    {
        $data = $request->validate([
            'decision' => 'required|in:accept,decline',
        ]);

        $user = $request->user();
        $messageRequest = MessageRequest::with(['fromUser', 'listing'])->findOrFail($id);

        // Verify the request is for the current user (seller)
        if ($messageRequest->to_user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Not authorized for this request',
            ], 403);
        }

        // Verify request is still pending
        if ($messageRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Request is no longer pending',
            ], 422);
        }

        // Check if users are blocked
        if ($this->isBlockedBetween($user, $messageRequest->from_user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'User blocked',
            ], 403);
        }

        $conversation = null;
        $conversationCreated = false;
        $firstMessage = null;

        DB::transaction(function () use ($user, $messageRequest, $data, &$conversation, &$conversationCreated, &$firstMessage) {
            if ($data['decision'] === 'accept') {
                // Accept the request: create conversation and send the initial message
                $userIds = [$user->id, $messageRequest->from_user_id];
                sort($userIds);

                // Get or create conversation
                $conversation = UserConversation::firstOrCreate(
                    [
                        'user1_id' => $userIds[0],
                        'user2_id' => $userIds[1],
                    ]
                );

                $conversationCreated = $conversation->wasRecentlyCreated;

                // Create the initial message from the buyer
                $messageText = trim($messageRequest->message_text);
                $messageText = mb_convert_encoding($messageText, 'UTF-8', 'UTF-8');

                $firstMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $messageRequest->from_user_id,
                    'receiver_id' => $user->id,
                    'message_text' => $messageText,
                ]);

                // Update conversation's updated_at timestamp
                $conversation->touch();

                // Update message request status
                $messageRequest->update(['status' => 'accepted']);

                // Broadcast events after transaction commits
                DB::afterCommit(function () use ($conversation, $conversationCreated, $firstMessage) {
                    if ($conversationCreated) {
                        broadcast(new ConversationCreated($conversation));

                        // CUSTOM WEBSOCKET BROADCAST - Conversation Created
                        try {
                            $convEvent = new ConversationCreated($conversation);
                            Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                                'type' => 'conversation.created',
                                'receivers' => [$conversation->user1_id, $conversation->user2_id],
                                'data' => $convEvent->broadcastWith()
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Custom WebSocket broadcast (conversation) failed: ' . $e->getMessage());
                        }
                    }

                    if ($firstMessage) {
                        broadcast(new MessageSent($firstMessage));

                        // CUSTOM WEBSOCKET BROADCAST - Message Sent
                        try {
                            Http::timeout(2)->post('http://127.0.0.1:6001/broadcast', [
                                'type' => 'message.sent',
                                'receivers' => [$firstMessage->sender_id, $firstMessage->receiver_id],
                                'data' => [
                                    'message' => $firstMessage->load(['sender', 'receiver']),
                                    'conversation_id' => $conversation->id
                                ]
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Custom WebSocket broadcast (message) failed: ' . $e->getMessage());
                        }
                    }
                });
            } else {
                // Decline the request
                $messageRequest->update(['status' => 'declined']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => $data['decision'] === 'accept' ? 'Message request accepted' : 'Message request declined',
            'data' => [
                'message_request' => $messageRequest->fresh(),
                'conversation' => $conversation ? [
                    'id' => $conversation->id,
                    'conversation_id' => $conversation->id,
                    'other_user' => $messageRequest->fromUser,
                    'created_at' => $conversation->created_at,
                    'updated_at' => $conversation->updated_at,
                ] : null,
                'first_message' => $firstMessage ? $firstMessage->load(['sender', 'receiver']) : null,
                'conversation_created' => $conversationCreated,
            ],
        ]);
    }
}
