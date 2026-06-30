<?php

namespace App\Events;

use App\Models\Script;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class ScriptUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public int $scriptId;
    public int $filmId;
    public string $title;
    public string $content;
    public string $userName;
    public string $action;

    public function __construct(Script $script, User $user, string $action = 'saved')
    {
        $this->scriptId = $script->id;
        $this->filmId = $script->film_id;
        $this->title = $script->title;
        $this->content = $script->content;
        $this->userName = $user->name;
        $this->action = $action;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('scripts.' . $this->filmId),
        ];
    }
}
