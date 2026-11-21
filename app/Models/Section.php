<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use App\Models\Concerns\NormalizesName;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model {

    use HasSlug, NormalizesName, SoftDeletes;

    protected $fillable = ['grade_level_id', 'academic_year_id', 'name'];

    protected function slugScope(): array {

        return ['academic_year_id', 'grade_level_id']; 
    }

    public function gradeLevel(): BelongsTo {

        return $this->belongsTo(GradeLevel::class);
    }

    public function academicYear(): BelongsTo {
        return $this->belongsTo(AcademicYear::class);
    }

    /*

    public function enrollments(): HasMany          // (later)
    {
        return $this->hasMany(Enrollment::class);
    }
    
    */

      /*
    public function students(): BelongsToMany       // (later: needs the Student model)
    {
        return $this->belongsToMany(Student::class, 'enrollments')
            ->withPivot(['academic_year_id', 'status'])
            ->withTimestamps();
    }

 


   
    public function activeStudents(): BelongsToMany // (later)
    {
        return $this->students()->wherePivot('status', 'active');
    }

    public function schedules(): HasMany            // (later)
    {
        return $this->hasMany(Schedule::class);
    }

    public function lessonPlans(): HasMany          // (later)
    {
        return $this->hasMany(LessonPlan::class);
    }

    public function attendanceSessions(): HasMany   // (later)
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function assessments(): HasMany          // (later)
    {
        return $this->hasMany(Assessment::class);
    }

          */

    /* Scopes */
    
    #[Scope]
    protected function forYear(Builder $query, AcademicYear|int $year): Builder {
        return $query->where('sections.academic_year_id', $year instanceof AcademicYear ? $year->id : $year);
    }
    
    #[Scope]
    protected function inActiveYear(Builder $query): Builder {
        return $query->whereHas('academicYear', fn ($q) => $q->active());
    }
   
    #[Scope]
    protected function forGradeLevel(Builder $query, GradeLevel|int $level): Builder {
        return $query->where('sections.grade_level_id', $level instanceof GradeLevel ? $level->id : $level);
    }

    #[Scope]
    protected function ordered(Builder $query): Builder {
        return $query
            ->join('grade_levels', 'grade_levels.id', '=', 'sections.grade_level_id')
            ->orderBy('grade_levels.sort_order')
            ->orderBy('sections.name')
            ->select('sections.*');
    }
    
    #[Scope]
    protected function search(Builder $query, ?string $term): Builder {
        return $query->when(filled($term), fn ($q) => $q->where('sections.name', 'like', '%' . trim($term) . '%'));
    }

    protected function fullName(): Attribute {
        return Attribute::get(fn () => collect([$this->gradeLevel?->name, $this->name])->filter()->implode(' – '));
    }
}