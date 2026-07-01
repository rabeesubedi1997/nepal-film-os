<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Message;
use App\Models\MessageRead;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    use FilmPermissionTrait;
    use FilmPermissionTrait;
    public function index(Request $request, $filmId)
    {
        $userId = $request->user()->id;

        $messages = Message::where('film_id', $filmId)
            ->where(function ($q) use ($userId) {
                $q->where('receiver_id', $userId)
                  ->orWhereNull('receiver_id')
                  ->orWhere('sender_id', $userId);
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    public function show(Request $request, $filmId, $id)
    {
        $message = Message::where('film_id', $filmId)
            ->with(['sender', 'receiver', 'reads.user'])
            ->findOrFail($id);

        return response()->json($message);
    }

    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'message.create');
        $validated = $request->validate([
            'receiver_id' => 'nullable|integer|exists:users,id',
            'group_id' => 'nullable|integer',
            'message' => 'required|string',
            'attachments' => 'nullable|array',
            'is_announcement' => 'nullable|boolean',
            'is_pinned' => 'nullable|boolean',
        ]);

        $message = Message::create([
            'film_id' => $filmId,
            'sender_id' => $request->user()->id,
            'receiver_id' => $validated['receiver_id'] ?? null,
            'group_id' => $validated['group_id'] ?? null,
            'message' => $validated['message'],
            'attachments' => $validated['attachments'] ?? [],
            'is_announcement' => $validated['is_announcement'] ?? false,
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        return response()->json($message->load('sender'), 201);
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'message.delete');
        $message = Message::where('film_id', $filmId)->findOrFail($id);

        if ($message->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $message->reads()->delete();
        $message->delete();

        return response()->json(['message' => 'Message deleted.']);
    }

    public function markRead(Request $request, $filmId, $id)
    {
        $message = Message::where('film_id', $filmId)->findOrFail($id);

        MessageRead::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Marked as read.']);
    }
}
