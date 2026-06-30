<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request, $filmId)
    {
        $documents = Document::where('film_id', $filmId)
            ->with('uploader')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    public function show(Request $request, $filmId, $id)
    {
        $document = Document::where('film_id', $filmId)
            ->with('uploader')
            ->findOrFail($id);

        return response()->json($document);
    }

    public function store(Request $request, $filmId)
    {
        $validated = $request->validate([
            'folder' => 'nullable|string',
            'document_name' => 'required|string|max:255',
            'file_path' => 'required|string',
            'file_type' => 'nullable|string',
            'file_size' => 'nullable|integer',
            'access_roles' => 'nullable|array',
            'version' => 'nullable|integer',
            'expires_at' => 'nullable|date',
            'is_watermarked' => 'nullable|boolean',
            'is_confidential' => 'nullable|boolean',
        ]);

        $document = Document::create([
            'film_id' => $filmId,
            'folder' => $validated['folder'] ?? 'General',
            'document_name' => $validated['document_name'],
            'file_path' => $validated['file_path'],
            'file_type' => $validated['file_type'] ?? null,
            'file_size' => $validated['file_size'] ?? null,
            'access_roles' => $validated['access_roles'] ?? [],
            'uploaded_by' => $request->user()->id,
            'version' => $validated['version'] ?? 1,
            'expires_at' => $validated['expires_at'] ?? null,
            'is_watermarked' => $validated['is_watermarked'] ?? false,
            'is_confidential' => $validated['is_confidential'] ?? false,
        ]);

        return response()->json($document->load('uploader'), 201);
    }

    public function update(Request $request, $filmId, $id)
    {
        $document = Document::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'folder' => 'nullable|string',
            'document_name' => 'nullable|string|max:255',
            'file_path' => 'nullable|string',
            'access_roles' => 'nullable|array',
            'version' => 'nullable|integer',
            'expires_at' => 'nullable|date',
            'is_watermarked' => 'nullable|boolean',
            'is_confidential' => 'nullable|boolean',
        ]);

        $document->update($validated);

        return response()->json($document->load('uploader'));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $document = Document::where('film_id', $filmId)->findOrFail($id);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }
}
