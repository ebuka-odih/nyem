@component('mail::message')
# ⭐ New Interest in Your Item!

Hi {{ $seller->name ?? $seller->username }},

**{{ $buyer->name ?? $buyer->username }}** is highly interested in your item: **{{ $listing->title }}**.

@component('mail::button', ['url' => $url])
View Request
@endcomponent

You can accept this request in the app to start a conversation.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
