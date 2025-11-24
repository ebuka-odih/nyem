<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Add conversation_id column (nullable initially for data migration)
            $table->uuid('conversation_id')->nullable()->after('id');
        });

        // First, ensure all matches have a conversation_id
        // Get all unique user pairs from matches that don't have a conversation_id
        $matchesWithoutConversation = DB::table('user_matches')
            ->whereNull('conversation_id')
            ->select('user1_id', 'user2_id')
            ->distinct()
            ->get();

        foreach ($matchesWithoutConversation as $match) {
            // Sort user IDs alphabetically
            $userIds = [$match->user1_id, $match->user2_id];
            sort($userIds);
            $user1Id = $userIds[0];
            $user2Id = $userIds[1];

            // Get or create conversation using DB facade
            $conversation = DB::table('user_conversations')
                ->where('user1_id', $user1Id)
                ->where('user2_id', $user2Id)
                ->first();

            if (!$conversation) {
                $conversationId = (string) Str::uuid();
                DB::table('user_conversations')->insert([
                    'id' => $conversationId,
                    'user1_id' => $user1Id,
                    'user2_id' => $user2Id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $conversation = (object) ['id' => $conversationId];
            }

            // Update all matches for this user pair
            DB::table('user_matches')
                ->where(function ($query) use ($user1Id, $user2Id) {
                    $query->where('user1_id', $user1Id)
                        ->where('user2_id', $user2Id);
                })
                ->orWhere(function ($query) use ($user1Id, $user2Id) {
                    $query->where('user1_id', $user2Id)
                        ->where('user2_id', $user1Id);
                })
                ->whereNull('conversation_id')
                ->update(['conversation_id' => $conversation->id]);
        }

        // Migrate existing data: get conversation_id from user_matches
        DB::statement("
            UPDATE messages
            INNER JOIN user_matches ON messages.match_id = user_matches.id
            SET messages.conversation_id = user_matches.conversation_id
            WHERE messages.match_id IS NOT NULL
            AND user_matches.conversation_id IS NOT NULL
        ");

        // Delete orphaned messages that couldn't be migrated
        DB::table('messages')->whereNull('conversation_id')->delete();

        // Drop old match_id foreign key and column
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['match_id']);
            $table->dropColumn('match_id');
        });

        // Add foreign key constraint to conversation_id
        // Note: For SQLite, we'll keep it nullable in the schema but enforce it in application logic
        // SQLite has limited ALTER TABLE support, so we'll add the foreign key if possible
        try {
            Schema::table('messages', function (Blueprint $table) {
                $table->foreign('conversation_id')->references('id')->on('user_conversations')->cascadeOnDelete();
            });
        } catch (\Exception $e) {
            // If foreign key addition fails (SQLite limitation), we'll rely on application-level constraints
            // The column is already created, so we can continue
        }

        // For databases that support it, make conversation_id not nullable
        // For SQLite, we'll enforce this at the application level
        $driver = DB::getDriverName();
        if ($driver !== 'sqlite') {
            Schema::table('messages', function (Blueprint $table) {
                $table->uuid('conversation_id')->nullable(false)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Add match_id back (nullable initially)
            $table->uuid('match_id')->nullable()->after('id');
            $table->foreign('match_id')->references('id')->on('user_matches')->cascadeOnDelete();
        });

        // Note: We can't perfectly restore match_id from conversation_id
        // since multiple matches can share a conversation
        // This is a best-effort restoration - assign to first match in conversation
        DB::statement("
            UPDATE messages
            INNER JOIN (
                SELECT conversation_id, MIN(id) as first_match_id
                FROM user_matches
                GROUP BY conversation_id
            ) as first_matches ON messages.conversation_id = first_matches.conversation_id
            SET messages.match_id = first_matches.first_match_id
            WHERE messages.conversation_id IS NOT NULL
        ");

        // Make match_id not nullable
        Schema::table('messages', function (Blueprint $table) {
            $table->uuid('match_id')->nullable(false)->change();
        });

        // Drop conversation_id
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['conversation_id']);
            $table->dropColumn('conversation_id');
        });
    }
};
