<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Auth\AuthenticationException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the exception types that are not reported.
     */
    protected $dontReport = [
        //
    ];

    /**
     * The list of the inputs that are never flashed to the session.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        //
    }

    /**
     * Override default redirect-to-login behavior.
     *
     * This ensures API requests return JSON when unauthenticated.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        // If request expects JSON (API), return JSON instead of redirect
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // Fallback for web (if any)
        return redirect()->guest(route('login'));
    }
}
