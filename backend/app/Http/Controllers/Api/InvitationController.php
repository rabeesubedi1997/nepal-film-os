<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class InvitationController extends Controller
{
    public function accept(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $validated['email'])
            ->where('invitation_token', $validated['token'])
            ->where('invitation_token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired invitation link.'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'invitation_token' => null,
            'invitation_token_expires_at' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->loadCount('films');

        return response()->json([
            'message' => 'Password set successfully.',
            'user' => $user,
            'token' => $token,
        ]);
    }
}
