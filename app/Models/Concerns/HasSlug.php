<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
/**
 * @property string|null $slug
 *
 * @method static \Illuminate\Database\Eloquent\Builder query()
 * @method static void creating(\Closure|string $callback)
 */
trait HasSlug {

    protected static function bootHasSlug(): void {

        static::creating(function (Model $model) {
            if (blank($model->slug)) {
                $model->slug = $model->generateUniqueSlug();
            }
        });
    }

    protected function slugSource(): string {
        return 'name';
    }

    protected function slugScope(): array {
        return [];
    }

    public function generateUniqueSlug(?string $source = null): string {

        $text = $source ?? (string) $this->{$this->slugSource()};

        $text = str_replace(['–', '—'], '-', $text);

        $base = Str::slug($text) ?: 'item';
        $slug = $base;
        $suffix = 2;

        while ($this->slugExists($slug)) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    public function regenerateSlug(): static {

        $this->slug = $this->generateUniqueSlug();

        return $this;
    }

    protected function slugExists(string $slug): bool {

        $query = static::query()->where('slug', $slug);

        if (in_array(SoftDeletes::class, class_uses_recursive(static::class), true)) {
            $query->withTrashed();
        }

        foreach ($this->slugScope() as $column) {
            $query->where($column, $this->{$column});
        }

        if ($this->exists) {
            $query->whereKeyNot($this->getKey());
        }

        return $query->exists();
    }
}