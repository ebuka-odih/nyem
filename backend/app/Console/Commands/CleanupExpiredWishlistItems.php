<?php

namespace App\Console\Commands;

use App\Models\Swipe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupExpiredWishlistItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wishlist:cleanup-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete wishlist items (swipes with direction=up) that are older than 24 hours and not accepted';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $twentyFourHoursAgo = now()->subHours(24);
        
        // Find all 'up' swipes (wishlist items) older than 24 hours
        $expiredSwipes = Swipe::where('direction', 'up')
            ->where('created_at', '<', $twentyFourHoursAgo)
            ->get();
        
        $count = $expiredSwipes->count();
        
        if ($count > 0) {
            // Delete expired wishlist items
            $deleted = Swipe::where('direction', 'up')
                ->where('created_at', '<', $twentyFourHoursAgo)
                ->delete();
            
            $this->info("Deleted {$deleted} expired wishlist items.");
        } else {
            $this->info("No expired wishlist items to delete.");
        }
        
        return 0;
    }
}
