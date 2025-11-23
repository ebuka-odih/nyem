<?php

namespace Tests\Feature;

use App\Models\Item;
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
        $userA = User::factory()->create(['city' => 'Lagos']);
        $userB = User::factory()->create(['city' => 'Lagos']);

        $tokenA = $userA->createToken('test')->plainTextToken;
        $tokenB = $userB->createToken('test')->plainTextToken;

        $this->assertEquals($userA->id, PersonalAccessToken::findToken($tokenA)->tokenable_id);
        $this->assertEquals($userB->id, PersonalAccessToken::findToken($tokenB)->tokenable_id);

        $itemA = Item::factory()->create(['user_id' => $userA->id, 'city' => 'Lagos']);
        $itemB = Item::factory()->create(['user_id' => $userB->id, 'city' => 'Lagos']);

        $this->assertEquals($userB->id, $itemB->user_id);

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
            'target_item_id' => $itemA->id,
            'direction' => 'right',
        ])->assertOk()->assertJson(['match_created' => false]);

        Auth::forgetGuards();
        $swipeResponse = $this->withToken($tokenA)->postJson('/api/swipes', [
            'target_item_id' => $itemB->id,
            'direction' => 'right',
        ])->assertOk();

        $swipeResponse->assertJson(['match_created' => true]);
        $matchId = $swipeResponse->json('match.id');
        $this->assertNotNull($matchId);

        $this->withToken($tokenA)->postJson('/api/messages', [
            'match_id' => $matchId,
            'message_text' => 'Hello there',
        ])->assertCreated();

        $messages = $this->withToken($tokenB)->getJson("/api/messages/{$matchId}")
            ->assertOk()
            ->json('messages');

        $this->assertCount(1, $messages);
        $this->assertEquals('Hello there', $messages[0]['message_text']);
    }
}
