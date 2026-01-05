<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test OneSignal Push Notifications</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        select, input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        select:focus, input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 10px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .btn:active {
            transform: translateY(0);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .alert {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .user-info {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }
        .no-users {
            padding: 20px;
            text-align: center;
            color: #666;
            background: #f5f5f5;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔔 Test Push Notifications</h1>
        <p class="subtitle">Send a test notification to verify OneSignal is working</p>

        <div id="alert" class="alert"></div>

        @if($users->isEmpty())
            <div class="no-users">
                <p>⚠️ No users with OneSignal player ID found.</p>
                <p style="margin-top: 10px; font-size: 12px;">Users need to register their device first via the app.</p>
            </div>
        @else
            <form id="notificationForm">
                <div class="form-group">
                    <label for="user_id">Select User:</label>
                    <select id="user_id" name="user_id" required>
                        <option value="">-- Select a user --</option>
                        @foreach($users as $user)
                            <option value="{{ $user->id }}">
                                {{ $user->name ?? $user->username ?? 'User' }} 
                                @if($user->email) ({{ $user->email }}) @endif
                            </option>
                        @endforeach
                    </select>
                    <div class="user-info">Total users with OneSignal: {{ $users->count() }}</div>
                </div>

                <div class="form-group">
                    <label for="title">Notification Title:</label>
                    <input type="text" id="title" name="title" value="Test Notification" placeholder="Enter notification title">
                </div>

                <div class="form-group">
                    <label for="message">Notification Message:</label>
                    <input type="text" id="message" name="message" value="This is a test notification from Nyem!" placeholder="Enter notification message">
                </div>

                <button type="submit" class="btn" id="sendBtn">
                    📤 Send Test Notification
                </button>
            </form>
        @endif
    </div>

    <script>
        const form = document.getElementById('notificationForm');
        const alertDiv = document.getElementById('alert');
        const sendBtn = document.getElementById('sendBtn');

        function showAlert(message, type) {
            alertDiv.textContent = message;
            alertDiv.className = `alert alert-${type}`;
            alertDiv.style.display = 'block';
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = {
                    user_id: formData.get('user_id'),
                    title: formData.get('title'),
                    message: formData.get('message')
                };

                sendBtn.disabled = true;
                sendBtn.textContent = 'Sending...';

                try {
                    const response = await fetch('/notifications/test/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': '{{ csrf_token() }}'
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (result.success) {
                        showAlert(`✅ ${result.message}`, 'success');
                        form.reset();
                        document.getElementById('title').value = 'Test Notification';
                        document.getElementById('message').value = 'This is a test notification from Nyem!';
                    } else {
                        showAlert(`❌ ${result.message}`, 'error');
                    }
                } catch (error) {
                    showAlert(`❌ Error: ${error.message}`, 'error');
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.textContent = '📤 Send Test Notification';
                }
            });
        }
    </script>
</body>
</html>

