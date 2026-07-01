<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $query = Media::where('user_id', $request->user()->id)->orderBy('created_at', 'desc');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $perPage = min((int) $request->get('per_page', 24), 50);
        $media = $query->paginate($perPage);

        $media->getCollection()->transform(function ($item) {
            $item->url = $item->url;
            return $item;
        });

        return response()->json([
            'data' => $media->items(),
            'meta' => [
                'current_page' => $media->currentPage(),
                'last_page' => $media->lastPage(),
                'per_page' => $media->perPage(),
                'total' => $media->total(),
                'has_more' => $media->hasMorePages(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,svg,mp4,mov,avi,mkv,mp3,wav,ogg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv|max:102400',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $size = $file->getSize();

        $type = match (true) {
            str_starts_with($mimeType, 'image/') => 'image',
            str_starts_with($mimeType, 'video/') => 'video',
            str_starts_with($mimeType, 'audio/') => 'audio',
            default => 'document',
        };

        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40) . '.' . $extension;
        $path = $file->storeAs('media', $filename, 'public');

        $media = Media::create([
            'user_id' => $request->user()->id,
            'filename' => $filename,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size' => $size,
            'path' => $path,
            'type' => $type,
        ]);

        $media->url = $media->url;

        return response()->json($media, 201);
    }

    public function destroy($id)
    {
        $media = Media::where('user_id', request()->user()->id)->findOrFail($id);

        Storage::disk('public')->delete($media->path);
        $media->delete();

        return response()->json(['message' => 'Media deleted.']);
    }
}
