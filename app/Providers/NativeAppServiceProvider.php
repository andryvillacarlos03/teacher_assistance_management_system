<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;
use Native\Desktop\Facades\Menu;
use Illuminate\Support\Facades\Log;

class NativeAppServiceProvider implements ProvidesPhpIni {

   public function boot(): void {

        try {
            $code = Artisan::call('migrate', ['--force' => true]);

            if ($code !== 0) {
                Log::error('Migration failed: ' . Artisan::output());
            }
        } catch (\Throwable $e) {
            Log::error('Migration exception: ' . $e->getMessage());
        }

        Menu::create();

        Window::open('main')
            ->route('entry')
            ->width(1280)
            ->height(800)
            ->hideMenu()
            ->rememberState();
    }

    public function phpIni(): array {
        
        return [
        ];
    }
}