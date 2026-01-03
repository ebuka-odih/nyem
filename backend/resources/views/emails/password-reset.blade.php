<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
        }
        h1 {
            color: #1f2937;
            font-size: 24px;
            margin: 0;
        }
        .code-container {
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #6366f1;
            font-family: 'Courier New', monospace;
        }
        .message {
            color: #6b7280;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #92400e;
        }
        .icon {
            width: 60px;
            height: 60px;
            background-color: #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .icon svg {
            width: 30px;
            height: 30px;
            fill: #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Nyem</div>
            <h1>Reset Your Password</h1>
        </div>

        <div class="message">
            <p>You requested to reset your password. Use the code below to create a new password:</p>
        </div>

        <div class="code-container">
            <div class="code">{{ $code }}</div>
        </div>

        <div class="warning">
            <strong>Security Notice:</strong> This code will expire in 15 minutes. Never share this code with anyone. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </div>

        <div class="message">
            <p>For your security, this code can only be used once.</p>
        </div>

        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; {{ date('Y') }} Nyem. All rights reserved.</p>
        </div>
    </div>
</body>
</html>




















