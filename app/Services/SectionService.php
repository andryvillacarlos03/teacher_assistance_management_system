<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Section;
use Illuminate\Database\Eloquent\Collection;

class SectionService {

    public function all(?string $search = null): Collection {

        return Section::query()
            ->with('gradeLevel')
            ->search($search)
            ->ordered()
            ->get();
    }

    public function create(AcademicYear $year, array $data): Section {
        return $year->sections()->create($data)->refresh();
    }

    public function update(Section $section, array $data): Section {

        $section->update($data);

        return $section->refresh();
    }

    public function delete(Section $section): void {
        // Soft delete: enrollments, attendance and grades keep their history.
        // Add deletionBlockers() here once Enrollment exists (see issue 3).
        $section->delete();
    }
}