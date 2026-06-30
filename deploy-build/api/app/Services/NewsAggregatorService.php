<?php

namespace App\Services;

use App\Models\NewsArticle;
use App\Models\NewsCategory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewsAggregatorService
{
    public function fetchAll(): int
    {
        $nepaliCategory = NewsCategory::where('slug', 'nepali')->first();
        $globalCategory = NewsCategory::where('slug', 'global')->first();

        if (!$nepaliCategory || !$globalCategory) {
            Log::warning('[NewsAggregator] Categories not found. Run migrations first.');
            return 0;
        }

        $nepaliSources = [
            ['name' => 'OnlineKhabar', 'url' => 'https://www.onlinekhabar.com/feed/'],
            ['name' => 'Setopati', 'url' => 'https://www.setopati.com/feed/'],
            ['name' => 'MyRepublica', 'url' => 'https://myrepublica.nagariknetwork.com/feed'],
            ['name' => 'The Kathmandu Post', 'url' => 'https://kathmandupost.com/rss'],
            ['name' => 'Cinepatra', 'url' => 'https://www.cinepatra.com/feed'],
            ['name' => 'ReelNepal', 'url' => 'https://www.reelnepal.com/feed'],
        ];

        $globalSources = [
            ['name' => 'Variety', 'url' => 'https://variety.com/feed/'],
            ['name' => 'Hollywood Reporter', 'url' => 'https://www.hollywoodreporter.com/feed'],
            ['name' => 'Deadline', 'url' => 'https://deadline.com/feed/'],
            ['name' => 'IMDb News', 'url' => 'https://www.imdb.com/rss/news'],
        ];

        $allSources = array_merge(
            array_map(fn($s) => array_merge($s, ['category_id' => $nepaliCategory->id]), $nepaliSources),
            array_map(fn($s) => array_merge($s, ['category_id' => $globalCategory->id]), $globalSources),
        );

        $newCount = 0;
        $errors = [];

        foreach ($allSources as $source) {
            if ($newCount >= 100) break;

            try {
                $response = Http::timeout(8)->get($source['url']);
                if (!$response->successful()) continue;

                $xml = simplexml_load_string($response->body());
                if (!$xml || !isset($xml->channel->item)) continue;

                foreach ($xml->channel->item as $item) {
                    if ($newCount >= 100) break 2;

                    $title = trim((string) $item->title);
                    if (empty($title)) continue;

                    $link = trim((string) $item->link);
                    $existing = NewsArticle::where('link', $link)->first();
                    if ($existing) continue;

                    $pubDate = (string) $item->pubDate;
                    $description = strip_tags((string) $item->description);
                    $content = $this->extractContent((string) $item->children('content', true)->encoded ?: $description);

                    NewsArticle::create([
                        'title' => $title,
                        'description' => mb_substr($description, 0, 500),
                        'content' => mb_substr($content, 0, 10000),
                        'link' => $link,
                        'source' => $source['name'],
                        'category_id' => $source['category_id'],
                        'author_name' => (string) $item->author ?: (string) $item->children('dc', true)->creator ?: null,
                        'published_at' => $pubDate ? date('Y-m-d H:i:s', strtotime($pubDate)) : now(),
                        'is_published' => true,
                        'is_external' => true,
                        'external_url' => $link,
                    ]);

                    $newCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "{$source['name']}: {$e->getMessage()}";
                continue;
            }
        }

        if (!empty($errors)) {
            Log::warning('[NewsAggregator] Partial errors: ' . implode('; ', $errors));
        }

        return $newCount;
    }

    protected function extractContent(string $html): string
    {
        $html = preg_replace('/<script[^>]*>.*?<\/script>/i', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/i', '', $html);
        return strip_tags($html);
    }
}
