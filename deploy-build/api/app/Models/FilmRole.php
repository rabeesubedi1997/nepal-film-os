<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmRole extends Model
{
    protected $fillable = [
        'film_id',
        'name',
        'slug',
        'description',
        'is_admin',
        'permissions',
        'created_by',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_admin' => 'boolean',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function filmUsers()
    {
        return $this->hasMany(FilmUser::class, 'role_id');
    }

    public function hasPermission($permission)
    {
        if ($this->is_admin) return true;
        if (!$this->permissions) return false;
        return in_array($permission, $this->permissions);
    }

    public function hasAnyPermission(array $permissions)
    {
        if ($this->is_admin) return true;
        if (!$this->permissions) return false;
        return !empty(array_intersect($permissions, $this->permissions));
    }
}
