<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsArticle;
use App\Models\NewsCategory;
use App\Services\NewsAggregatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $query = NewsArticle::with('category')
            ->published()
            ->orderBy('published_at', 'desc');

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('source', 'like', "%{$q}%")
                    ->orWhere('author_name', 'like', "%{$q}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 12), 50);
        $articles = $query->paginate($perPage);

        return response()->json([
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
                'has_more' => $articles->hasMorePages(),
            ],
        ]);
    }

    public function show($id)
    {
        $article = NewsArticle::with('category')->published()->findOrFail($id);
        return response()->json($article);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'category_id' => 'nullable|exists:news_categories,id',
            'source' => 'nullable|string|max:255',
            'author_name' => 'nullable|string|max:255',
            'image_url' => 'nullable|url|max:500',
            'external_url' => 'nullable|url|max:500',
            'is_external' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $validated['is_published'] = $validated['is_published'] ?? true;
        $validated['is_external'] = $validated['is_external'] ?? false;
        $validated['published_at'] = $validated['published_at'] ?? now();
        $validated['user_id'] = $request->user()->id;

        $article = NewsArticle::create($validated);

        return response()->json($article->load('category'), 201);
    }

    public function update(Request $request, $id)
    {
        $article = NewsArticle::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content' => 'nullable|string',
            'category_id' => 'nullable|exists:news_categories,id',
            'source' => 'nullable|string|max:255',
            'author_name' => 'nullable|string|max:255',
            'image_url' => 'nullable|url|max:500',
            'external_url' => 'nullable|url|max:500',
            'is_external' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $article->update($validated);

        return response()->json($article->load('category'));
    }

    public function destroy($id)
    {
        $article = NewsArticle::findOrFail($id);
        $article->delete();

        return response()->json(['message' => 'Article deleted.']);
    }

    public function categories()
    {
        $categories = NewsCategory::where('is_active', true)->get();
        return response()->json($categories);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:news_categories,slug',
            'color' => 'nullable|string|max:20',
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $category = NewsCategory::create($validated);

        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = NewsCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255|unique:news_categories,slug,' . $id,
            'color' => 'nullable|string|max:20',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    public function destroyCategory($id)
    {
        $category = NewsCategory::findOrFail($id);
        NewsArticle::where('category_id', $id)->update(['category_id' => null]);
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    public function refresh(Request $request)
    {
        $cacheKey = 'news_rss_last_refresh';
        $lastRefresh = Cache::get($cacheKey);

        if ($lastRefresh && $lastRefresh > now()->subMinutes(15)) {
            return response()->json([
                'message' => 'Already refreshed recently. Try again later.',
                'last_refresh' => $lastRefresh,
            ]);
        }

        $service = app(NewsAggregatorService::class);
        $count = $service->fetchAll();

        Cache::put($cacheKey, now(), 1440);

        return response()->json([
            'message' => "News feed refreshed. {$count} new articles added.",
            'new_articles' => $count,
        ]);
    }
}
