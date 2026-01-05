<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use OneSignal;

class NotificationController extends Controller
{
    /**
     * Send a test notification to a specific user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string|exists:users,id',
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->input('user_id'));

            // Check if user has OneSignal player ID
            if (!$user->onesignal_player_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User does not have a OneSignal player ID registered',
                    'user_id' => $user->id,
                ], 400);
            }

            // Get notification content from request or use defaults
            $title = $request->input('title', 'Test Notification');
            $message = $request->input('message', 'This is a test notification from Nyem!');

            // Send notification using the OneSignal package
            // If no exception is thrown, the notification was sent successfully
            OneSignal::sendNotificationToUser(
                $message,
                $user->onesignal_player_id,
                $url = null,
                $data = [
                    'type' => 'test',
                    'timestamp' => now()->toIso8601String(),
                ],
                $buttons = null,
                $schedule = null,
                $headings = $title
            );

            Log::info('Test notification sent successfully', [
                'user_id' => $user->id,
                'player_id' => $user->onesignal_player_id,
                'title' => $title,
                'message' => $message,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name ?? $user->username,
                    'player_id' => $user->onesignal_player_id,
                    'title' => $title,
                    'message' => $message,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Exception while sending test notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send a notification to the authenticated user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sendToMe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();

            if (!$user->onesignal_player_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have a OneSignal player ID registered. Please register your device first.',
                ], 400);
            }

            $title = $request->input('title', 'Test Notification');
            $message = $request->input('message', 'This is a test notification from Nyem!');

            OneSignal::sendNotificationToUser(
                $message,
                $user->onesignal_player_id,
                $url = null,
                $data = [
                    'type' => 'test',
                    'timestamp' => now()->toIso8601String(),
                ],
                $buttons = null,
                $schedule = null,
                $headings = $title
            );

            Log::info('Test notification sent to authenticated user', [
                'user_id' => $user->id,
                'player_id' => $user->onesignal_player_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully to your device',
                'data' => [
                    'title' => $title,
                    'message' => $message,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Exception while sending test notification to authenticated user', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the test notification page
     * 
     * @return \Illuminate\View\View
     */
    public function showTestPage()
    {
        // Get all users with OneSignal player ID
        $users = User::whereNotNull('onesignal_player_id')
            ->select('id', 'name', 'username', 'email', 'phone', 'onesignal_player_id')
            ->orderBy('name')
            ->orderBy('username')
            ->get();

        return view('notifications.test', [
            'users' => $users,
        ]);
    }

    /**
     * Send test notification via web form (no auth required for testing)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sendTestNotificationWeb(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string|exists:users,id',
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->input('user_id'));

            if (!$user->onesignal_player_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User does not have a OneSignal player ID registered',
                    'user_id' => $user->id,
                ], 400);
            }

            $title = $request->input('title', 'Test Notification');
            $message = $request->input('message', 'This is a test notification from Nyem!');

            OneSignal::sendNotificationToUser(
                $message,
                $user->onesignal_player_id,
                $url = null,
                $data = [
                    'type' => 'test',
                    'timestamp' => now()->toIso8601String(),
                ],
                $buttons = null,
                $schedule = null,
                $headings = $title
            );

            Log::info('Test notification sent via web interface', [
                'user_id' => $user->id,
                'player_id' => $user->onesignal_player_id,
                'title' => $title,
                'message' => $message,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification sent successfully!',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name ?? $user->username,
                    'player_id' => $user->onesignal_player_id,
                    'title' => $title,
                    'message' => $message,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Exception while sending test notification via web', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

