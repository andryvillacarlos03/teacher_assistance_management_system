<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\NormalizesName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model {

    use HasSlug, NormalizesName, SoftDeletes;

    protected $fillable = ['grade_level_id', 'name', 'code'];

    protected function slugScope(): array {

        return ['grade_level_id']; 
    }

    public function gradeLevel(): BelongsTo {

        return $this->belongsTo(GradeLevel::class);
    }

    /*

    public function schedules(): HasMany            // (later)
    {
        return $this->hasMany(Schedule::class);
    }

    public function lessonPlans(): HasMany          // (later)
    {
        return $this->hasMany(LessonPlan::class);
    }

    public function teachingResources(): HasMany    // (later)
    {
        return $this->hasMany(TeachingResource::class);
    }

    public function assessments(): HasMany          // (later)
    {
        return $this->hasMany(Assessment::class);
    }

    public function quarterlyGrades(): HasMany      // (later)
    {
        return $this->hasMany(QuarterlyGrade::class);
    }

    public function gradingSchemes(): BelongsToMany // (later)
    {
        return $this->belongsToMany(GradingScheme::class, 'subject_grading_schemes')->withTimestamps();
    }

    */

    /* Scopes */

    protected function scopeForGradeLevel(Builder $query, GradeLevel|int $level): Builder {
        return $query->where('grade_level_id', $level instanceof GradeLevel ? $level->id : $level);
    }

    public function scopeOrdered(Builder $query): Builder {
        return $query->orderBy('name');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder {
        return $query->when(filled($term), function ($q) use ($term) {
            $term = '%' . trim($term) . '%';
            $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('code', 'like', $term));
        });
    }

    protected function code(): Attribute {
        return Attribute::make(
            set: fn ($value) => filled($value) ? strtoupper(trim($value)) : null,
        );
    }

    protected function displayName(): Attribute {
        return Attribute::get(fn () => $this->code ? "{$this->name} ({$this->code})" : $this->name);
    }

 

    /*
    public function gradingSchemeFor(AcademicYear|int $year): ?GradingScheme   // (later)
    {
        return $this->gradingSchemes()
            ->where('academic_year_id', $year instanceof AcademicYear ? $year->id : $year)
            ->first();
    }
    */
}