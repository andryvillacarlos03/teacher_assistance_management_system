<?php

namespace App\Services;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;

class SubjectService {

    public function all(?string $search = null): Collection {

        return Subject::query()
            ->with('gradeLevel')
            ->search($search)
            ->ordered()
            ->get();
    }

    public function create(array $data): Subject {

        return Subject::create($data)->refresh();
    }

    public function update(Subject $subject, array $data): Subject {

        $subject->update($data);

        return $subject->refresh();
    }

    public function delete(Subject $subject): void {

        // Soft delete: schedules, lesson plans and grades keep their history.
        // Add deletionBlockers() here once those models exist (see issue 4).
        $subject->delete();
    }
}