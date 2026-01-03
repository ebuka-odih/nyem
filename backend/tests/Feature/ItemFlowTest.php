<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_item_and_filter_feed(): void
    {
        $user = User::factory()->create(['city' => 'Paris']);
        $token = $user->createToken('test')->plainTextToken;

        $createResponse = $this->withToken($token)->postJson('/api/items', [
            'title' => 'Vintage Jacket',
            'description' => 'Nice jacket',
            'category' => 'Fashion',
            'condition' => 'like_new',
            'photos' => ['https://example.com/photo.jpg'],
            'looking_for' => 'Sneakers',
        ])->assertCreated();

        $item = $createResponse->json('item');
        $this->assertEquals('Paris', $item['city']);

        $otherUser = User::factory()->create(['city' => 'Paris']);
        Item::factory()->create([
            'user_id' => $otherUser->id,
            'city' => 'Paris',
            'category' => 'Fashion',
        ]);

        Item::factory()->create(['city' => 'Berlin']);

        $feedResponse = $this->withToken($token)->getJson('/api/items/feed')
            ->assertOk()
            ->json('items');

        $this->assertCount(1, $feedResponse, 'Feed should only return same-city items from other users');

        Block::create([
            'blocker_id' => $user->id,
            'blocked_user_id' => $otherUser->id,
        ]);

        $this->withToken($token)->getJson('/api/items/feed')
            ->assertOk()
            ->assertJsonCount(0, 'items');
    }
}
