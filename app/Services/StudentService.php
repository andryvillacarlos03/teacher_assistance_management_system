<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Pagination\LengthAwarePaginator;

class StudentService {

    /**
     * @param array{search?: ?string, archived?: bool} $filters
     */
    public function paginate(array $filters = [], int $perPage = 25): LengthAwarePaginator {

        return Student::query()
            ->when($filters['archived'] ?? false, fn ($q) => $q->onlyTrashed())
            ->search($filters['search'] ?? null)
            ->ordered()
            ->paginate($perPage)
            ->withQueryString();

        // After the Enrollment model exists, add:
        //   ->with(['enrollments' => fn ($q) => $q->forYear($year)->with('section.gradeLevel')])
        // and filter by section or status with whereHas('enrollments', ...).
    }

    public function create(array $data): Student {

        return Student::create($data)->refresh();
    }

    public function update(Student $student, array $data): Student {

        $student->update($data);

        return $student->refresh();
    }

    /** Soft delete: attendance, scores and grades keep pointing at the student. */
    public function archive(Student $student): void {

        // Once enrollments exist, nothing needs blocking here: archiving only hides
        // the student from lists. Permanent deletion is not offered.
        $student->delete();
    }

    public function restore(Student $student): Student {

        $student->restore();

        return $student->refresh();
    }

    /** Another active student with the same first and last name (case-insensitive). */
    public function hasSameName(array $data, ?Student $except = null): bool {

        return Student::query()
            ->whereRaw('lower(first_name) = ?', [mb_strtolower($data['first_name'])])
            ->whereRaw('lower(last_name) = ?', [mb_strtolower($data['last_name'])])
            ->when($except, fn ($q) => $q->whereKeyNot($except->getKey()))
            ->exists();
    }
}