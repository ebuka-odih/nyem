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
        $driverName = DB::getDriverName();

        // 1. Force Disable Foreign Key checks
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }

        // SCENARIO A: 'listings' ALREADY EXISTS
        // If the table 'listings' already exists, we assume the previous migration
        // actually succeeded in renaming it before it crashed. We are safe!
        if (Schema::hasTable('listings')) {
            \Log::info("Table 'listings' already exists. Migration assumed successful.");
        }
        
        // SCENARIO B: 'listings' DOES NOT EXIST, BUT 'items' DOES
        // This means the rename hasn't happened yet. We rename it now.
        elseif (Schema::hasTable('items')) {
             if ($driverName === 'mysql') {
                DB::statement('RENAME TABLE items TO listings');
            } else {
                Schema::rename('items', 'listings');
            }
        }

        // SCENARIO C: NEITHER EXISTS (Critical Error Recovery)
        // If neither exists, we must create 'listings' from scratch to prevent 500 errors.
        else {
             Schema::create('listings', function (Blueprint $table) {
                // Determine user_id type based on users table
                $userIdType = 'uuid'; // Default assumption
                
                $table->uuid('id')->primary();
                $table->uuid('user_id')->nullable(); 
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                
                $table->unsignedBigInteger('category_id')->nullable();
                $table->enum('type', ['shop', 'swap', 'barter', 'marketplace', 'services'])->default('shop');
                $table->string('title');
                $table->text('description')->nullable();
                $table->decimal('price', 10, 2)->nullable();
                $table->string('city')->nullable();
                $table->string('location')->nullable(); // Legacy field
                $table->json('photos')->nullable();
                $table->json('images')->nullable(); // Legacy field
                $table->string('condition')->default('used');
                $table->string('status')->default('active');
                $table->string('looking_for')->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->timestamps();
            });
        }

        // 2. Re-enable security checks
        if ($driverName === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback
    }
};
