<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeSuperAdmin extends Command
{
    protected $signature = 'user:make-super-admin {email? : Email of the user to promote}';
    protected $description = 'Promote a user to super admin by email, or list all users';

    public function handle()
    {
        $email = $this->argument('email');

        if (!$email) {
            $users = User::select('id', 'name', 'email', 'is_super_admin', 'is_active')
                ->orderBy('created_at', 'desc')
                ->get();

            $this->info('Users:');
            $headers = ['ID', 'Name', 'Email', 'Super Admin', 'Active'];
            $rows = $users->map(fn($u) => [
                $u->id,
                $u->name,
                $u->email,
                $u->is_super_admin ? 'Yes' : 'No',
                $u->is_active ? 'Yes' : 'No',
            ])->toArray();
            $this->table($headers, $rows);

            $email = $this->ask('Enter the email of the user to promote to super admin');
            if (!$email) {
                $this->error('No email provided.');
                return 1;
            }
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }

        $user->update(['is_super_admin' => true]);

        $this->info("User '{$user->name}' ({$user->email}) is now a super admin.");
        return 0;
    }
}
