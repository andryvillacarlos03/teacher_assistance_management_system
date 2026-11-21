<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\GradingPeriod;
use Illuminate\Support\Facades\DB;

class GradingPeriodService {

    public function create(AcademicYear $year, array $data): GradingPeriod {

        return DB::transaction(function () use ($year, $data) {
            $period = $year->gradingPeriods()->create($data);

            $this->resequence($year);

            return $period->refresh();
        });
    }

    public function update(GradingPeriod $period, array $data): GradingPeriod {

        return DB::transaction(function () use ($period, $data) {
            $period->update($data);

            $this->resequence($period->academicYear);

            return $period->refresh();
        });
    }

    public function delete(GradingPeriod $period): void {

        // Once assessments exist, check them here (see issue 3 below).
        DB::transaction(function () use ($period) {
            $period->delete();

            $this->resequence($period->academicYear);
        });
    }

    /** Keep `sequence` (1, 2, 3, 4) in line with chronological order. */
    private function resequence(AcademicYear $year): void {

        $year->gradingPeriods()
            ->reorder('start_date')
            ->get()
            ->each(fn (GradingPeriod $p, int $i) => $p->update(['sequence' => $i + 1]));
    }
}