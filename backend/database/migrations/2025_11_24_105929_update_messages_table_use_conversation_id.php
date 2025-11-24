<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
            $table->foreign('conversation_id')->references('id')->on('user_conversations')->cascadeOnDelete();
        });

        // Migrate existing data: get conversation_id from user_matches
        DB::statement("
            UPDATE messages
            INNER JOIN user_matches ON messages.match_id = user_matches.id
            SET messages.conversation_id = user_matches.conversation_id
            WHERE messages.match_id IS NOT NULL
        ");

        // Drop old match_id foreign key and column
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['match_id']);
            $table->dropColumn('match_id');
        });

        // Make conversation_id not nullable after dropping match_id
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
