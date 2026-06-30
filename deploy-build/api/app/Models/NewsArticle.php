<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsArticle extends Model
{
    protected $fillable = [
        'title', 'slug', 'description', 'content', 'link', 'source',
        'source_logo', 'category_id', 'author_name', 'image_url',
        'published_at', 'is_published', 'is_external', 'external_url',
        'user_id',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_published' => 'boolean',
        'is_external' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(NewsCategory::class, 'category_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
