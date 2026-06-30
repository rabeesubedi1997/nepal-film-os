<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $tasks = Task::where('film_id', $filmId)
            ->with(['assignedTo', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tasks);
    }

    public function show(Request $request, $filmId, $id)
    {
        $task = Task::where('film_id', $filmId)
            ->with(['assignedTo', 'creator'])
            ->findOrFail($id);

        return response()->json($task);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string|in:Low,Medium,High,Urgent',
            'status' => 'nullable|string|in:todo,in_progress,done',
            'related_module' => 'nullable|string',
            'related_id' => 'nullable|integer',
        ]);

        $task = Task::create([
            'film_id' => $filmId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'priority' => $validated['priority'] ?? 'Medium',
            'status' => $validated['status'] ?? 'todo',
            'related_module' => $validated['related_module'] ?? null,
            'related_id' => $validated['related_id'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($task->load(['assignedTo', 'creator']), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $task = Task::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string|in:Low,Medium,High,Urgent',
            'status' => 'nullable|string|in:todo,in_progress,done',
            'related_module' => 'nullable|string',
            'related_id' => 'nullable|integer',
        ]);

        $task->update($validated);

        return response()->json($task->load(['assignedTo', 'creator']));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $task = Task::where('film_id', $filmId)->findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }
}
