<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model {

    public const STATUSES = ['active', 'inactive', 'transferred'];

    protected $fillable = ['student_id', 'academic_year_id', 'section_id', 'status'];

    public function student(): BelongsTo {

        return $this->belongsTo(Student::class)->withTrashed();   // archived students keep their history
    }

    public function section(): BelongsTo {

        return $this->belongsTo(Section::class)->withTrashed();
    }

    public function academicYear(): BelongsTo {

        return $this->belongsTo(AcademicYear::class)->withTrashed();
    }

    #[Scope]
    protected function forYear(Builder $query, AcademicYear|int $year): Builder {

        return $query->where('academic_year_id', $year instanceof AcademicYear ? $year->id : $year);
    }
}