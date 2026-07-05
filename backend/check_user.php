<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$user = App\Models\User::where('email', 'test@nepalfilmos.com')->first();
if ($user) {
    echo "ID: " . $user->id . "\n";
    echo "Name: " . $user->name . "\n";
    echo "Email: " . $user->email . "\n";
    echo "is_super_admin: " . ($user->is_super_admin ? 'true' : 'false') . "\n";
    echo "is_active: " . ($user->is_active ? 'true' : 'false') . "\n";
} else {
    echo "User not found\n";
}
