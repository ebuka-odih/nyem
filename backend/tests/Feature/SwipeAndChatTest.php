<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class SwipeAndChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_swipe_creates_match_and_allows_messaging(): void
    {
        $category = Category::create([
            'name' => 'General',
            'type' => 'main',
            'slug' => 'general',
        ]);

        $userA = User::factory()->create(['city' => 'Lagos']);
        $userB = User::factory()->create(['city' => 'Lagos']);

        $tokenA = $userA->createToken('test')->plainTextToken;
        $tokenB = $userB->createToken('test')->plainTextToken;

        $this->assertEquals($userA->id, PersonalAccessToken::findToken($tokenA)->tokenable_id);
        $this->assertEquals($userB->id, PersonalAccessToken::findToken($tokenB)->tokenable_id);

        $listingA = Listing::factory()->create([
            'user_id' => $userA->id,
            'city' => 'Lagos',
            'type' => Listing::TYPE_BARTER,
            'category_id' => $category->id,
        ]);
        $listingB = Listing::factory()->create([
            'user_id' => $userB->id,
            'city' => 'Lagos',
            'type' => Listing::TYPE_BARTER,
            'category_id' => $category->id,
        ]);

        $this->assertEquals($userB->id, $listingB->user_id);

        // Reset guards between requests so bearer tokens are re-evaluated.
        Auth::forgetGuards();
        $this->assertEquals(
            $userA->id,
            $this->withToken($tokenA)->getJson('/api/profile/me')->json('user.id')
        );
        Auth::forgetGuards();
        $this->assertEquals(
            $userB->id,
            $this->withToken($tokenB)->getJson('/api/profile/me')->json('user.id')
        );

        $this->withToken($tokenB)->postJson('/api/swipes', [
            'target_listing_id' => $listingA->id,
            'direction' => 'right',
            'offered_listing_id' => $listingB->id,
        ])->assertOk()->assertJson(['match_created' => false]);

        Auth::forgetGuards();
        $swipeResponse = $this->withToken($tokenA)->postJson('/api/swipes', [
            'target_listing_id' => $listingB->id,
            'direction' => 'right',
            'offered_listing_id' => $listingA->id,
        ])->assertOk();

        $swipeResponse->assertJson(['match_created' => true]);
        $conversationId = $swipeResponse->json('conversation_id');
        $this->assertNotNull($conversationId);

        $this->withToken($tokenA)->postJson('/api/messages', [
            'conversation_id' => $conversationId,
            'message_text' => 'Hello there',
        ])->assertCreated();

        $messages = $this->withToken($tokenB)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->json('messages');

        $this->assertCount(1, $messages);
        $this->assertEquals('Hello there', $messages[0]['message_text']);
    }
}
