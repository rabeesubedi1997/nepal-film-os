<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Film extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'poster_image',
        'genre',
        'language',
        'production_company',
        'status',
        'start_date',
        'expected_wrap_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expected_wrap_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * User who created this film workspace.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Users assigned to this film.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'film_users')
                    ->withPivot('role', 'department', 'permissions', 'is_active', 'joined_at')
                    ->withTimestamps();
    }

    /**
     * Enabled modules on this film.
     */
    public function modules()
    {
        return $this->hasMany(FilmModule::class);
    }

    /**
     * Check if a specific module is enabled.
     */
    public function isModuleEnabled(string $moduleName): bool
    {
        return $this->modules()->where('module_name', $moduleName)->where('is_enabled', true)->exists();
    }

    /**
     * Locations associated with this film.
     */
    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    /**
     * Shoot schedules.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Script scenes.
     */
    public function scenes()
    {
        return $this->hasMany(Scene::class);
    }

    /**
     * Cast and crew members.
     */
    public function castCrew()
    {
        return $this->hasMany(CastCrew::class);
    }

    /**
     * Budgets.
     */
    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    /**
     * Expenses logged.
     */
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * Call sheets generated.
     */
    public function callSheets()
    {
        return $this->hasMany(CallSheet::class);
    }

    /**
     * Progress updates logged.
     */
    public function progressUpdates()
    {
        return $this->hasMany(ProgressUpdate::class);
    }
}
