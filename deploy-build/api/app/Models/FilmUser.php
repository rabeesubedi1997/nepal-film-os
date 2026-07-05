<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilmUser extends Model
{
    protected $table = 'film_users';

    protected $fillable = [
        'film_id',
        'user_id',
        'role',
        'role_id',
        'department',
        'permissions',
        'is_active',
        'joined_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function film()
    {
        return $this->belongsTo(Film::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function filmRole()
    {
        return $this->belongsTo(FilmRole::class, 'role_id');
    }

    public function hasPermission($permission)
    {
        // Check individual user-level permissions first
        if ($this->permissions && in_array($permission, $this->permissions)) {
            return true;
        }

        // Fall back to role permissions
        if ($this->filmRole) {
            return $this->filmRole->hasPermission($permission);
        }
        return false;
    }

    public function hasAnyPermission(array $permissions)
    {
        // Check individual user-level permissions first
        if ($this->permissions && !empty(array_intersect($permissions, $this->permissions))) {
            return true;
        }

        // Fall back to role permissions
        if ($this->filmRole) {
            return $this->filmRole->hasAnyPermission($permissions);
        }
        return false;
    }

    public function isFilmAdmin()
    {
        return $this->filmRole && $this->filmRole->is_admin;
    }
}
