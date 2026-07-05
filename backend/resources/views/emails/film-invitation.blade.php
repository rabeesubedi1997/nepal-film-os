<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
        <h1 style="font-size: 20px; margin: 0 0 8px; color: #f1f5f9;">Welcome to {{ $film->title }}</h1>
        <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">You've been invited as <strong style="color: #f59e0b;">{{ $role->name }}</strong></p>
        <p style="color: #94a3b8; margin: 0 0 4px; font-size: 14px;">Account: <strong style="color: #f1f5f9;">{{ $user->email }}</strong></p>
        <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
            Click the button below to set your password and get started.
        </p>
        <a href="{{ $acceptUrl }}" style="display: inline-block; background: #f59e0b; color: #0f172a; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Set Your Password</a>
        <p style="margin-top: 24px; font-size: 12px; color: #64748b;">This link expires in 7 days. If you didn't expect this invitation, you can ignore this email.</p>
    </div>
</body>
</html>
