<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\NormalizesName;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradingPeriod extends Model {

    use HasSlug, NormalizesName;

    protected $fillable = ['academic_year_id', 'name', 'sequence', 'start_date', 'end_date'];

    protected $casts = [
        'sequence'   => 'integer',
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
    ];

    protected function slugScope(): array {

        return ['academic_year_id'];
    }

    protected static function booted(): void {
        // If no order number is given, put the period after the existing ones
        static::creating(function (GradingPeriod $period) {
            if (blank($period->sequence)) {
                $period->sequence = (int) static::where('academic_year_id', $period->academic_year_id)->max('sequence') + 1;
            }
        });
    }

    /* Relationships */

    public function academicYear(): BelongsTo {

        return $this->belongsTo(AcademicYear::class);
    }

    /*

    public function assessments(): HasMany          // (later)
    {
        return $this->hasMany(Assessment::class);
    }

    public function quarterlyGrades(): HasMany      // (later)
    {
        return $this->hasMany(QuarterlyGrade::class);
    }

    */

    #[Scope]
    protected function ordered(Builder $query): Builder {
        return $query->orderBy('sequence');
    }
    
    #[Scope]
    protected function forYear(Builder $query, AcademicYear|int $year): Builder {
        return $query->where('academic_year_id', $year instanceof AcademicYear ? $year->id : $year);
    }

    #[Scope]
    protected function containing(Builder $query, CarbonInterface|string $date):  Builder {

        return $query->whereDate('start_date', '<=', $date)->whereDate('end_date', '>=', $date);
    }
     
    #[Scope]
    protected function overlapping(Builder $query, CarbonInterface|string $start, CarbonInterface|string $end): Builder {
        return $query->whereDate('start_date', '<=', $end)->whereDate('end_date', '>=', $start);
    }

    #[Scope]
    protected function current(Builder $query): Builder {

        return $query
            ->whereHas('academicYear', fn ($q) => $q->active())
            ->containing(today());
    }

    protected function status(): Attribute {

        return Attribute::get(function () {
            $today = today();

            return match (true) {
                $today->lt($this->start_date) => 'upcoming',
                $today->gt($this->end_date)   => 'past',
                default                       => 'current',
            };
        });
    }

    protected function isCurrent(): Attribute {

        return Attribute::get(fn () => $this->status === 'current');
    }

    protected function dateRange(): Attribute {

        return Attribute::get(fn () => $this->start_date->format('M j, Y') . ' – ' . $this->end_date->format('M j, Y'));
    }

    public static function forDate(CarbonInterface|string|null $date = null): ?self {
        return static::query()
            ->whereHas('academicYear', fn ($q) => $q->active())
            ->containing($date ?? today())
            ->first();
    }

    public function contains(CarbonInterface|string $date): bool {
        
        return $this->start_date->lte($date) && $this->end_date->gte($date);
    }
}