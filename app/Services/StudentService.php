<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StudentService {

    private const FIELDS = ['student_number', 'first_name', 'middle_name', 'last_name', 'suffix'];

    public function enrollmentsForYear(AcademicYear $year): Collection {

        return Enrollment::query()
            ->forYear($year)
            ->with(['student', 'section.gradeLevel'])
            ->get()
            ->sortBy(fn (Enrollment $e) => mb_strtolower("{$e->student->last_name} {$e->student->first_name}"))
            ->values();
    }

    public function historyFor(Collection $studentIds): Collection {

        return Enrollment::query()
            ->whereIn('student_id', $studentIds)
            ->with(['academicYear', 'section.gradeLevel'])
            ->get()
            ->sortByDesc(fn (Enrollment $e) => $e->academicYear->start_date)
            ->groupBy('student_id');
    }

    public function create(array $data): Student {

        return DB::transaction(function () use ($data) {
            $student = Student::create(Arr::only($data, self::FIELDS));
            $this->enroll($student, $data);

            return $student->refresh();
        });
    }

    public function update(Student $student, array $data): Student {

        return DB::transaction(function () use ($student, $data) {
            $student->update(Arr::only($data, self::FIELDS));

            if (filled($data['section_id'] ?? null)) {
                $this->enroll($student, $data);
            } else {
                // "Not enrolled this year" in the dialog.
                Enrollment::query()
                    ->where('student_id', $student->id)
                    ->where('academic_year_id', $data['academic_year_id'])
                    ->delete();
            }

            return $student->refresh();
        });
    }

    /** Soft delete: attendance, scores and grades keep pointing at the student. */
    public function archive(Student $student): void {

        $student->delete();
    }

    public function restore(Student $student): Student {

        $student->restore();

        return $student->refresh();
    }

    /** Another student with the same first and last name (case-insensitive). */
    public function hasSameName(array $data, ?Student $except = null): bool {

        return Student::query()
            ->whereRaw('lower(first_name) = ?', [mb_strtolower($data['first_name'])])
            ->whereRaw('lower(last_name) = ?', [mb_strtolower($data['last_name'])])
            ->when($except, fn ($q) => $q->whereKeyNot($except->getKey()))
            ->exists();
    }

    private function enroll(Student $student, array $data): void {

        Enrollment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year_id' => $data['academic_year_id']],
            ['section_id' => $data['section_id'], 'status' => $data['status']],
        );
    }
}