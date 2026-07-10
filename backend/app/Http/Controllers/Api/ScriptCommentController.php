<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\ScriptComment;
use Illuminate\Http\Request;

class ScriptCommentController extends Controller
{
    use FilmPermissionTrait;

    public function index(Request $request, $filmId, $scriptId)
    {
        $comments = ScriptComment::with('user:id,name')
            ->where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->whereNull('parent_id')
            ->with(['replies' => function ($q) {
                $q->with('user:id,name')->orderBy('created_at', 'asc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }

    public function show(Request $request, $filmId, $scriptId, $id)
    {
        $comment = ScriptComment::with('user:id,name', 'replies.user:id,name')
            ->where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->findOrFail($id);

        return response()->json($comment);
    }

    public function store(Request $request, $filmId, $scriptId)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:script_comments,id',
            'element_selector' => 'nullable|string|max:255',
        ]);

        $comment = ScriptComment::create([
            'film_id' => $filmId,
            'script_id' => $scriptId,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
            'element_selector' => $validated['element_selector'] ?? null,
        ]);

        $comment->load('user:id,name');

        return response()->json($comment, 201);
    }

    public function update(Request $request, $filmId, $scriptId, $id)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment = ScriptComment::where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->findOrFail($id);

        if ($comment->user_id !== $request->user()->id) {
            abort(403, 'You can only edit your own comments.');
        }

        $comment->update($validated);
        $comment->load('user:id,name');

        return response()->json($comment);
    }

    public function destroy(Request $request, $filmId, $scriptId, $id)
    {
        $comment = ScriptComment::where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->findOrFail($id);

        if ($comment->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own comments.');
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }

    public function resolve(Request $request, $filmId, $scriptId, $id)
    {
        $comment = ScriptComment::where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->findOrFail($id);

        $comment->update(['resolved_at' => now()]);

        return response()->json($comment);
    }

    public function reopen(Request $request, $filmId, $scriptId, $id)
    {
        $comment = ScriptComment::where('film_id', $filmId)
            ->where('script_id', $scriptId)
            ->findOrFail($id);

        $comment->update(['resolved_at' => null]);

        return response()->json($comment);
    }
}
