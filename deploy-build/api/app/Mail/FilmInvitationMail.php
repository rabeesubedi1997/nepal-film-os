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
        public string $token,
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
            view: 'emails.film-invitation',
            with: [
                'acceptUrl' => url("/invitation/accept?token={$this->token}&email={$this->user->email}"),
            ],
        );
    }
}
