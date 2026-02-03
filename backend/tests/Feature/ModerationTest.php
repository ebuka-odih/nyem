<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Category;
use App\Models\User;
use App\Models\UserMatch;
use App\Models\UserConversation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocking_user_prevents_chat_and_reports_work(): void
    {
        $category = Category::create([
            'name' => 'General',
            'type' => 'main',
            'slug' => 'general',
        ]);

        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $tokenA = $userA->createToken('test')->plainTextToken;
        $tokenB = $userB->createToken('test')->plainTextToken;

        $listingA = Listing::factory()->create([
            'user_id' => $userA->id,
            'city' => $userA->city,
            'category_id' => $category->id,
        ]);
        $listingB = Listing::factory()->create([
            'user_id' => $userB->id,
            'city' => $userB->city,
            'category_id' => $category->id,
        ]);

        $firstUserId = min($userA->id, $userB->id);
        $conversation = UserConversation::create([
            'user1_id' => $firstUserId,
            'user2_id' => max($userA->id, $userB->id),
        ]);
        $match = UserMatch::create([
            'user1_id' => $firstUserId,
            'user2_id' => max($userA->id, $userB->id),
            'listing1_id' => $firstUserId === $userA->id ? $listingA->id : $listingB->id,
            'listing2_id' => $firstUserId === $userA->id ? $listingB->id : $listingA->id,
            'conversation_id' => $conversation->id,
        ]);

        $this->withToken($tokenA)->postJson('/api/block', [
            'blocked_user_id' => $userB->id,
        ])->assertCreated();

        $this->withToken($tokenB)->postJson('/api/messages', [
            'conversation_id' => $match->conversation_id,
            'message_text' => 'Should not send',
        ])->assertStatus(403);

        $this->withToken($tokenA)->postJson('/api/report', [
            'target_user_id' => $userB->id,
            'reason' => 'Spam',
        ])->assertCreated();
    }
}
