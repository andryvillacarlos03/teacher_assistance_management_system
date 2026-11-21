<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\NormalizesName;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class GradeLevel extends Model {

    use HasSlug, NormalizesName;

    protected $fillable = ['name', 'sort_order'];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected static function booted(): void {

        static::creating(function (GradeLevel $level) {
            if (blank($level->sort_order)) {
                $level->sort_order = (int) static::max('sort_order') + 1;
            }
        });

        static::deleting(function (GradeLevel $level) {
            if ($blockers = $level->deletionBlockers()) {
                throw ValidationException::withMessages([
                    'grade_level' => "{$level->name} cannot be deleted. " . implode(' ', $blockers),
                ]);
            }
        });
    }

    public function getRouteKeyName(): string {

        return 'slug';
    }

    
    public function sections(): HasMany {

        return $this->hasMany(Section::class);
    }

    public function subjects(): HasMany {
        
        return $this->hasMany(Subject::class);
    }
   
   
    
    #[Scope]
    protected function ordered(Builder $query): Builder {
        return $query->orderBy('sort_order')->orderBy('name');
    }
   
    #[Scope]
    protected function search(Builder $query, ?string $term): Builder {
        return $query->when(filled($term), fn ($q) => $q->where('name', 'like', '%' . trim($term) . '%'));
    }
    
    #[Scope]
    protected function deletionBlockers(): array {
        $blockers = [];

        if ($n = $this->sections()->withTrashed()->count()) {
            $blockers[] = "It is used by {$n} section" . ($n === 1 ? '' : 's') . '.';
        }
        if ($n = $this->subjects()->withTrashed()->count()) {
            $blockers[] = "It is used by {$n} subject" . ($n === 1 ? '' : 's') . '.';
        }

        return $blockers;
    }
}