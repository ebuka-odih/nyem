<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ItemStarredEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $seller;
    public $listing;
    public $buyer;
    public $url;

    public function __construct(User $seller, Listing $listing, User $buyer)
    {
        $this->seller = $seller;
        $this->listing = $listing;
        $this->buyer = $buyer;
        $this->url = config('app.frontend_url', 'https://nyem.app') . '/matches';
    }

    public function build()
    {
        return $this->subject('⭐ New Interest in Your Item: ' . $this->listing->title)
                    ->markdown('emails.item_starred');
    }
}
