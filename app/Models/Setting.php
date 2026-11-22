<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Small key/value store for app settings, e.g. "backup.folder".
 * Values keep their type (string, number, boolean, array) because they are saved as JSON.
 *
 * @property string $key
 * @property mixed  $value
 */
class Setting extends Model {

    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'json',
    ];

    /** Values read during this request. A missing setting is remembered too. */
    private static array $cache = [];

    public static function get(string $key, mixed $default = null): mixed {

        if (! array_key_exists($key, self::$cache)) {
            $row = static::query()->where('key', $key)->first();
            self::$cache[$key] = $row ? ['found' => true, 'value' => $row->value] : ['found' => false];
        }

        $entry = self::$cache[$key];

        return $entry['found'] ? $entry['value'] : $default;
    }

    public static function set(string $key, mixed $value): void {

        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);

        self::$cache[$key] = ['found' => true, 'value' => $value];
    }

    public static function has(string $key): bool {

        static::get($key);

        return self::$cache[$key]['found'];
    }

    public static function forget(string $key): void {

        static::query()->where('key', $key)->delete();

        self::$cache[$key] = ['found' => false];
    }

    public static function flushCache(): void {
        
        self::$cache = [];
    }
}