<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\NormalizesName;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\GradingPeriod;

class AcademicYear extends Model {

    use HasSlug, NormalizesName, SoftDeletes;

    protected $fillable = ['name', 'start_date', 'end_date'];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
        'is_active'  => 'boolean',
    ];

    protected static function booted(): void {

        static::deleting(function (AcademicYear $year) {
            if ($year->is_active) {
                throw ValidationException::withMessages([
                    'academic_year' => 'The active school year cannot be deleted. Make another school year active first.',
                ]);
            }
        });
    }

    public function getRouteKeyName(): string {

        return 'slug';
    }

    /* ---------------------------------------------------------------
     | Relationships
     |  Models marked (later) are created in later modules.
     * ------------------------------------------------------------- */
   
    public function gradingPeriods(): HasMany
    {
        return $this->hasMany(GradingPeriod::class)->orderBy('sequence');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

     /*

    public function enrollments(): HasMany          // (later)
    {
        return $this->hasMany(Enrollment::class);
    }

    public function schedules(): HasMany            // (later)
    {
        return $this->hasMany(Schedule::class);
    }

    public function lessonPlans(): HasMany          // (later)
    {
        return $this->hasMany(LessonPlan::class);
    }

    public function gradingSchemes(): HasMany       // (later)
    {
        return $this->hasMany(GradingScheme::class);
    }

    */
   
    #[Scope]
    protected function active(Builder $query): Builder {

        return $query->where('is_active', true);
    }

    #[Scope]
    protected function latestFirst(Builder $query): Builder {

        return $query->orderByDesc('start_date');
    }

    #[Scope]
    protected function containing(Builder $query, CarbonInterface|string $date): Builder {

        return $query->whereDate('start_date', '<=', $date)->whereDate('end_date', '>=', $date);
    }
 
    protected function label(): Attribute {

        return Attribute::get(fn () => "S.Y. {$this->name}");
    }

    protected function isOngoing(): Attribute {
        return Attribute::get(fn () => today()->between($this->start_date, $this->end_date));
    }

    public static function current(): ?self {

        return static::query()->active()->first();
    }

    public function activate(): static {

        DB::transaction(function () {
            static::query()
                ->where('is_active', true)
                ->when($this->exists, fn ($q) => $q->whereKeyNot($this->getKey()))
                ->update(['is_active' => false]);

            $this->forceFill(['is_active' => true])->save();
        });

        return $this;
    }

    public function contains(CarbonInterface|string $date): bool {

        return $this->start_date->lte($date) && $this->end_date->gte($date);
    }

    public function deletionBlockers(): array {

        $blockers = [];

        if ($this->is_active) {
            $blockers[] = 'It is the active school year.';
        }
        if ($this->sections()->exists()) {
            $blockers[] = 'It has sections.';
        }
        if ($this->gradingPeriods()->exists()) {
            $blockers[] = 'It has grading periods.';
        }

        return $blockers;
    }
}