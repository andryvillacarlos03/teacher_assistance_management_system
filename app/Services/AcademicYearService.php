<?php

namespace App\Services;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcademicYearService {

    public function all(): Collection {

        return AcademicYear::query()->latestFirst()->get();
    }

    public function create(array $data): AcademicYear {

        return DB::transaction(function () use ($data) {
            $year = AcademicYear::create($data);
            if (AcademicYear::query()->count() === 1) {
                $year->activate();
            }

            return $year->refresh();
        });
    }

    public function update(AcademicYear $year, array $data): AcademicYear {

        $year->update($data);

        return $year->refresh();
    }

    public function activate(AcademicYear $year): AcademicYear {

        return $year->activate();
    }

    public function delete(AcademicYear $year): void {

        $blockers = $year->deletionBlockers();

        if ($blockers !== []) {
            throw ValidationException::withMessages([
                'academic_year' => 'This school year cannot be deleted. ' . implode(' ', $blockers),
            ]);
        }

        $year->delete();
    }
}