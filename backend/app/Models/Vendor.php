<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    protected $fillable = [
        'film_id', 'name', 'type', 'contact_name', 'contact_phone',
        'contact_email', 'address', 'services', 'rate', 'currency',
        'is_active', 'notes',
    ];
    protected $casts = ['is_active' => 'boolean', 'rate' => 'float'];
    public function film() { return $this->belongsTo(Film::class); }
}
