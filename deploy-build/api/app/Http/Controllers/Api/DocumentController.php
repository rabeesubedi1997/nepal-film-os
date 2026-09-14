<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\FilmPermissionTrait;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    use FilmPermissionTrait;

    /**
     * Normalize `access_roles` coming from the client: the UI currently
     * sends a comma-separated string ("Director, Producer"), but the
     * column is an array — sending the raw string always failed Laravel's
     * `array` validation rule before. Accept either shape.
     */
    private function normalizeAccessRoles($value)
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('trim', $value), fn ($v) => $v !== ''));
        }
        if (is_string($value) && $value !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $value)), fn ($v) => $v !== ''));
        }
        return [];
    }

    /**
     * Can the current user see confidential documents without an explicit
     * access_roles match (film admins / super admins)?
     */
    private function canSeeAllDocuments(Request $request, $filmId)
    {
        if ($request->user()->is_super_admin) return true;
        $filmUser = $this->getFilmUser($filmId, $request->user()->id);
        return $filmUser && $filmUser->isFilmAdmin();
    }

    private function canSeeDocument(Document $document, Request $request, $filmId, ?bool $isAdmin = null)
    {
        if (!$document->is_confidential) return true;
        $isAdmin = $isAdmin ?? $this->canSeeAllDocuments($request, $filmId);
        if ($isAdmin) return true;

        $filmUser = $this->getFilmUser($filmId, $request->user()->id);
        $allowed = $document->access_roles ?? [];
        if (empty($allowed) || !$filmUser) return false;

        return in_array($filmUser->filmRole->slug ?? null, $allowed, true)
            || in_array($filmUser->filmRole->name ?? null, $allowed, true);
    }

    public function index(Request $request, $filmId)
    {
        $documents = Document::where('film_id', $filmId)
            ->with('uploader')
            ->orderBy('created_at', 'desc')
            ->get();

        $isAdmin = $this->canSeeAllDocuments($request, $filmId);
        // "Confidential" was previously purely decorative — every active
        // film member could list/view every document regardless of the
        // flag or access_roles. Filter it out here instead.
        $documents = $documents
            ->filter(fn ($doc) => $this->canSeeDocument($doc, $request, $filmId, $isAdmin))
            ->values();

        return response()->json($documents);
    }

    public function show(Request $request, $filmId, $id)
    {
        $document = Document::where('film_id', $filmId)
            ->with('uploader')
            ->findOrFail($id);

        if (!$this->canSeeDocument($document, $request, $filmId)) {
            return response()->json(['message' => 'This document is restricted.'], 403);
        }

        return response()->json($document);
    }

    public function store(Request $request, $filmId)
    {
        $this->requireCan($request, $filmId, 'document.create');
        $validated = $request->validate([
            'folder' => 'nullable|string',
            'document_name' => 'required|string|max:255',
            'file_path' => 'required|string',
            'file_type' => 'nullable|string',
            'file_size' => 'nullable|integer',
            'access_roles' => 'nullable',
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
            'access_roles' => $this->normalizeAccessRoles($validated['access_roles'] ?? null),
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
        $this->requireCan($request, $filmId, 'document.edit');
        $document = Document::where('film_id', $filmId)->findOrFail($id);

        $validated = $request->validate([
            'folder' => 'nullable|string',
            'document_name' => 'nullable|string|max:255',
            'file_path' => 'nullable|string',
            'access_roles' => 'nullable',
            'version' => 'nullable|integer',
            'expires_at' => 'nullable|date',
            'is_watermarked' => 'nullable|boolean',
            'is_confidential' => 'nullable|boolean',
        ]);

        if (array_key_exists('access_roles', $validated)) {
            $validated['access_roles'] = $this->normalizeAccessRoles($validated['access_roles']);
        }

        $document->update($validated);

        return response()->json($document->load('uploader'));
    }

    public function destroy(Request $request, $filmId, $id)
    {
        $this->requireCan($request, $filmId, 'document.delete');
        $document = Document::where('film_id', $filmId)->findOrFail($id);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }
}
