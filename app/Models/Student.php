<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model {

    use SoftDeletes;

    protected $fillable = ['student_number', 'first_name', 'middle_name', 'last_name', 'suffix'];

    /* ---------------------------------------------------------------
     | Relationships
     |  Models marked (later) are created in later modules.
     * ------------------------------------------------------------- */

    /*
    public function enrollments(): HasMany          // next: Enrollment model
    {
        return $this->hasMany(Enrollment::class);
    }

    public function attendanceRecords(): HasMany    // (later)
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function assessmentScores(): HasMany     // (later)
    {
        return $this->hasMany(AssessmentScore::class);
    }

    public function quarterlyGrades(): HasMany      // (later)
    {
        return $this->hasMany(QuarterlyGrade::class);
    }
    */

    /* Scopes */

    #[Scope]
    protected function ordered(Builder $query): Builder {

        return $query->orderBy('last_name')->orderBy('first_name')->orderBy('middle_name');
    }

    #[Scope]
    protected function search(Builder $query, ?string $term): Builder {

        return $query->when(filled($term), function ($q) use ($term) {
            $like = '%' . trim($term) . '%';

            $q->where(fn ($w) => $w
                ->where('first_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhere('middle_name', 'like', $like)
                ->orWhere('student_number', 'like', $like)
                // "dela cruz juan" or "juan dela cruz" in one search box
                ->orWhereRaw("(first_name || ' ' || last_name) like ?", [$like])
                ->orWhereRaw("(last_name || ' ' || first_name) like ?", [$like]));
        });
    }

    /* Name handling: trim and collapse spaces, but keep the teacher's capitalization. */

    protected function firstName(): Attribute {

        return Attribute::make(set: fn ($v) => $this->cleanName($v));
    }

    protected function middleName(): Attribute {

        return Attribute::make(set: fn ($v) => $this->cleanName($v));
    }

    protected function lastName(): Attribute {

        return Attribute::make(set: fn ($v) => $this->cleanName($v));
    }

    protected function suffix(): Attribute {

        return Attribute::make(set: fn ($v) => $this->cleanName($v));
    }

    protected function studentNumber(): Attribute {

        return Attribute::make(set: fn ($v) => filled($v) ? trim($v) : null);
    }

    protected function fullName(): Attribute {

        return Attribute::get(function () {
            $given = trim(implode(' ', array_filter([
                $this->first_name,
                $this->middle_name ? mb_substr($this->middle_name, 0, 1) . '.' : null,
                $this->suffix,
            ])));

            return "{$this->last_name}, {$given}";
        });
    }

    protected function displayName(): Attribute {

        return Attribute::get(fn () => trim(implode(' ', array_filter([
            $this->first_name, $this->last_name, $this->suffix,
        ]))));
    }

    private function cleanName(?string $value): ?string {

        $value = preg_replace('/\s+/u', ' ', trim((string) $value));

        return $value === '' ? null : $value;
    }
}