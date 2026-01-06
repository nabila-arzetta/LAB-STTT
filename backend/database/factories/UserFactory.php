<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Bagian; // <-- PENTING: Import Bagian

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Kolom Bawaan (kita sesuaikan)
            'name' => fake()->name(), // Kita tetap buat 'name' (jika migrasi 'users' masih ada)
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            
            // --- Kolom Custom Sesuai Model User.php Kamu ---
            'username' => fake()->unique()->userName(),
            'full_name' => fake()->name(),
            'role' => 'user', // Default role 'user'
            'is_active' => true,
            
            // Ini akan ambil 'kode_bagian' acak dari tabel 'bagian'
            'kode_bagian' => function () {
                // Ambil 1 kode bagian secara acak. Jika 'bagian' kosong, buat 1
                return Bagian::inRandomOrder()->first()->kode_bagian ?? Bagian::factory()->create()->kode_bagian;
            },
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}