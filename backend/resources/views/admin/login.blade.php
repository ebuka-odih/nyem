<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login - {{ config('app.name', 'Laravel') }}</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    
    <!-- Styles -->
    <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
                background-color: #FDFDFC;
                color: #1b1b18;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            }
            
            .login-container {
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
                padding: 2rem;
                width: 100%;
                max-width: 28rem;
            }
            
            .login-header {
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .login-header h1 {
                font-size: 1.875rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #1b1b18;
            }
            
            .login-header p {
                color: #706f6c;
                font-size: 0.875rem;
            }
            
            .form-group {
                margin-bottom: 1.5rem;
            }
            
            .form-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                color: #1b1b18;
                margin-bottom: 0.5rem;
            }
            
            .form-input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #e3e3e0;
                border-radius: 0.375rem;
                font-size: 0.875rem;
                transition: border-color 0.15s ease-in-out;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #1b1b18;
                box-shadow: 0 0 0 3px rgba(27, 27, 24, 0.1);
            }
            
            .form-checkbox {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }
            
            .form-checkbox input {
                width: 1rem;
                height: 1rem;
                cursor: pointer;
            }
            
            .form-checkbox label {
                font-size: 0.875rem;
                color: #1b1b18;
                cursor: pointer;
            }
            
            .btn {
                width: 100%;
                padding: 0.75rem 1.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                border: none;
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.15s ease-in-out;
            }
            
            .btn-primary {
                background-color: #1b1b18;
                color: white;
            }
            
            .btn-primary:hover {
                background-color: #000;
            }
            
            .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .error-message {
                background-color: #fff2f2;
                border: 1px solid #f53003;
                color: #f53003;
                padding: 0.75rem;
                border-radius: 0.375rem;
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }
            
            .error-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .error-list li {
                margin-bottom: 0.25rem;
            }
            
            .error-list li:last-child {
                margin-bottom: 0;
            }
            
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #0a0a0a;
                }
                
                .login-container {
                    background-color: #161615;
                    border: 1px solid #3E3E3A;
                }
                
                .login-header h1 {
                    color: #EDEDEC;
                }
                
                .login-header p {
                    color: #A1A09A;
                }
                
                .form-label {
                    color: #EDEDEC;
                }
                
                .form-input {
                    background-color: #0a0a0a;
                    border-color: #3E3E3A;
                    color: #EDEDEC;
                }
                
                .form-input:focus {
                    border-color: #EDEDEC;
                    box-shadow: 0 0 0 3px rgba(237, 237, 236, 0.1);
                }
                
                .form-checkbox label {
                    color: #EDEDEC;
                }
                
                .btn-primary {
                    background-color: #EDEDEC;
                    color: #1b1b18;
                }
                
                .btn-primary:hover {
                    background-color: white;
                }
            }
        </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>Admin Login</h1>
            <p>Sign in to access the admin panel</p>
        </div>

        @if ($errors->any())
            <div class="error-message">
                <ul class="error-list">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <div class="form-group">
                <label for="username_or_phone" class="form-label">
                    Username, Email, or Phone
                </label>
                <input
                    type="text"
                    id="username_or_phone"
                    name="username_or_phone"
                    class="form-input"
                    value="{{ old('username_or_phone') }}"
                    required
                    autofocus
                    autocomplete="username"
                >
            </div>

            <div class="form-group">
                <label for="password" class="form-label">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-input"
                    required
                    autocomplete="current-password"
                >
            </div>

            <div class="form-checkbox">
                <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                >
                <label for="remember">Remember me</label>
            </div>

            <button type="submit" class="btn btn-primary">
                Sign In
            </button>
        </form>
    </div>
</body>
</html>

