<?php

namespace App\Mail;

use App\Models\Film;
use App\Models\FilmRole;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FilmInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Film $film,
        public FilmRole $role,
        public string $password
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to {$this->film->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            html: <<<'HTML'
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
                    <h1 style="font-size: 20px; margin: 0 0 8px; color: #f1f5f9;">Welcome to {{ $film->title }}</h1>
                    <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">You've been added as <strong style="color: #f59e0b;">{{ $role->name }}</strong></p>
                    <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">Your login credentials:</p>
                        <p style="margin: 0; font-size: 14px; color: #e2e8f0;"><strong>Email:</strong> {{ $user->email }}</p>
                        <p style="margin: 0; font-size: 14px; color: #e2e8f0;"><strong>Password:</strong> {{ $password }}</p>
                    </div>
                    <a href="{{ url('/login') }}" style="display: inline-block; background: #f59e0b; color: #0f172a; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Log in to Nepal Films OS</a>
                    <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Please change your password after logging in.</p>
                </div>
            </body>
            </html>
            HTML,
        );
    }
}
