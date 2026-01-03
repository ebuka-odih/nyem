<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Updates categories table to support hierarchical structure:
     * - type: 'main' or 'sub' category
     * - parent_id: nullable foreign key to parent category (for sub-categories)
     * - slug: URL-friendly identifier
     * - icon: icon identifier/name for UI display
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Add type field: 'main' or 'sub'
            $table->enum('type', ['main', 'sub'])->default('main')->after('name');
            
            // Add parent_id for hierarchical structure (nullable for main categories)
            $table->unsignedBigInteger('parent_id')->nullable()->after('type');
            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('cascade');
            
            // Add slug for URL-friendly identifiers
            $table->string('slug')->unique()->nullable()->after('parent_id');
            
            // Add icon field for UI display
            $table->string('icon')->nullable()->after('slug');
            
            // Remove the unique constraint on name since sub-categories can have same names
            $table->dropUnique(['name']);
            
            // Add index on parent_id for faster queries
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['parent_id']);
            $table->dropColumn(['type', 'parent_id', 'slug', 'icon']);
            $table->unique('name');
        });
    }
};
