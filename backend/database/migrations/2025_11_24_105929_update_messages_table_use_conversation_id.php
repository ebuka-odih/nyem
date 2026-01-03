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
        // Only add conversation_id column if it doesn't already exist
        if (!Schema::hasColumn('messages', 'conversation_id')) {
            Schema::table('messages', function (Blueprint $table) {
                // Add conversation_id column (nullable initially for data migration)
                $table->uuid('conversation_id')->nullable()->after('id');
            });
        }

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
        // Use database-specific syntax for UPDATE with JOIN
        $driverName = DB::getDriverName();
        
        if ($driverName === 'sqlite') {
            // SQLite doesn't support UPDATE ... INNER JOIN, use subquery instead
            DB::statement("
                UPDATE messages
                SET conversation_id = (
                    SELECT user_matches.conversation_id
                    FROM user_matches
                    WHERE user_matches.id = messages.match_id
                    AND user_matches.conversation_id IS NOT NULL
                    LIMIT 1
                )
                WHERE messages.match_id IS NOT NULL
                AND EXISTS (
                    SELECT 1
                    FROM user_matches
                    WHERE user_matches.id = messages.match_id
                    AND user_matches.conversation_id IS NOT NULL
                )
            ");
        } else {
            // MySQL/MariaDB/PostgreSQL support UPDATE ... INNER JOIN
            DB::statement("
                UPDATE messages
                INNER JOIN user_matches ON messages.match_id = user_matches.id
                SET messages.conversation_id = user_matches.conversation_id
                WHERE messages.match_id IS NOT NULL
                AND user_matches.conversation_id IS NOT NULL
            ");
        }

        // Delete orphaned messages that couldn't be migrated
        DB::table('messages')->whereNull('conversation_id')->delete();

        // Drop old match_id foreign key and column (only if they exist)
        if (Schema::hasColumn('messages', 'match_id')) {
            $driverName = DB::getDriverName();
            
            // Drop foreign key constraint if it exists (MySQL/MariaDB specific)
            if ($driverName === 'mysql' || $driverName === 'mariadb') {
                $constraintName = DB::selectOne("
                    SELECT CONSTRAINT_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'messages'
                    AND COLUMN_NAME = 'match_id'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");

                if ($constraintName) {
                    DB::statement("ALTER TABLE `messages` DROP FOREIGN KEY `{$constraintName->CONSTRAINT_NAME}`");
                }
            }

            // Drop the match_id column
            Schema::table('messages', function (Blueprint $table) {
                $table->dropColumn('match_id');
            });
        }

        // Add foreign key constraint to conversation_id (only if it doesn't exist)
        $driverName = DB::getDriverName();
        $fkExists = false;
        
        if ($driverName === 'mysql' || $driverName === 'mariadb') {
            // Check if foreign key already exists for MySQL/MariaDB
            $existingFk = DB::selectOne("
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'messages'
                AND COLUMN_NAME = 'conversation_id'
                AND REFERENCED_TABLE_NAME = 'user_conversations'
            ");
            $fkExists = $existingFk !== null;
        }
        
        // For SQLite and other databases, try to add the foreign key
        // If it already exists, it will throw an exception which we'll catch
        if (!$fkExists) {
            try {
                Schema::table('messages', function (Blueprint $table) {
                    $table->foreign('conversation_id')->references('id')->on('user_conversations')->cascadeOnDelete();
                });
            } catch (\Exception $e) {
                // Foreign key might already exist, continue with migration
                // This is expected for SQLite and other databases where checking is difficult
            }
        }

        // Make conversation_id not nullable
        Schema::table('messages', function (Blueprint $table) {
            $table->uuid('conversation_id')->nullable(false)->change();
        });
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
        $driverName = DB::getDriverName();
        
        if ($driverName === 'sqlite') {
            // SQLite doesn't support UPDATE ... INNER JOIN, use subquery instead
            DB::statement("
                UPDATE messages
                SET match_id = (
                    SELECT MIN(user_matches.id)
                    FROM user_matches
                    WHERE user_matches.conversation_id = messages.conversation_id
                )
                WHERE messages.conversation_id IS NOT NULL
                AND EXISTS (
                    SELECT 1
                    FROM user_matches
                    WHERE user_matches.conversation_id = messages.conversation_id
                )
            ");
        } else {
            // MySQL/MariaDB/PostgreSQL support UPDATE ... INNER JOIN
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
        }

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
