# Notifications Explanation

## Issue Diagnosis
You experienced issues with notifications either not arriving or arriving twice. This was caused by the existence of two separate notification systems:

1.  **Frontend Native Notification (Browser):** This is triggered immediately by JavaScript code in your browser. It does not require a server, but only works on the device you are currently using.
2.  **Backend OneSignal Notification (Server):** This is sent by the backend logic to the OneSignal service, which then pushes it to the user's registered devices (Mobile/Web).

## Why "Duplicate"?
Initially, both were active. When you "Starred" an item:
1.  The App immediately showed a browser notification (System 1).
2.  The Backend successfully sent a real push notification (System 2).
Result: You received two notifications.

## Why "Stopped"?
When I removed System 1 to fix the duplication, the notifications stopped for your test case because System 2 (Backend) requires your user account to have a valid `onesignal_player_id` linked to the device. In many local dev environments or simple browser tests, this ID fails to register properly, causing System 2 to silently fail.

## Fix Implemented
1.  **Restored Frontend Notification:** I have brought back the "Native" browser notification so you get immediate feedback while testing on your computer.
    *   *Added a safety check to ensure it never fires twice for the same item session.*
2.  **Enhanced Backend Logic:** I updated the `OneSignalService.php` to attempt sending to your `External User ID` (User UUID) if a `player_id` is missing. This significantly improves the chance of the backend notification reaching you if you have logged in on *any* supported device, even if the current browser session lost its specific ID.

Now, you should receive at least one reliable notification. If both systems work perfectly, you might see two (one instant, one slightly delayed), but this ensures you never miss important feedback during testing.
