<?php

namespace App\Http\Controllers\Settings\Main;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\AcademicYearService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\GradeLevelService;
use App\Models\GradeLevel;
use App\Models\GradingPeriod;
use App\Services\SectionService;
use App\Models\Section;
use App\Services\SubjectService;
use App\Models\Subject;

class SettingsController extends Controller {

public function __construct(
    private AcademicYearService $academicYears,
    private GradeLevelService $gradeLevels,
    private SectionService $sections,
    private SubjectService $subjects
) {}

    public function index(Request $request): Response {

        $user = $request->user();

        return Inertia::render('SettingsAndBackup', [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'preferences' => $this->preferences(),

            // Tab 2: Academic setup
            'academicYears' => $this->academicYears->all()->map(fn (AcademicYear $y) => [
                'id'       => $y->id,
                'slug'     => $y->slug,
                'name'     => $y->name,
                'start'    => $y->start_date->toDateString(),
                'end'      => $y->end_date->toDateString(),
                'active'   => $y->is_active,
                'ongoing'  => $y->is_ongoing,
                'blockers' => $y->deletionBlockers(),
            ])->values(),

            // Filled in once the Phase 2 models exist.
            // (object) [] so it serializes as {} (keyed by year id), not [].
            'gradingPeriods' => (object) $this->academicYears->all()
                                            ->mapWithKeys(fn (AcademicYear $y) => [
                                                $y->id => $y->gradingPeriods->map(fn (GradingPeriod $p) => [
                                                    'id'       => $p->id,
                                                    'slug'     => $p->slug,
                                                    'name'     => $p->name,
                                                    'sequence' => $p->sequence,
                                                    'start'    => $p->start_date->toDateString(),
                                                    'end'      => $p->end_date->toDateString(),
                                                    'status'   => $p->status,
                                                ])->values(),
                                            ])->all(),
            'gradeLevels' => $this->gradeLevels->all()->map(fn (GradeLevel $l) => [
                                    'id'         => $l->id,
                                    'slug'       => $l->slug,
                                    'name'       => $l->name,
                                    'sort_order' => $l->sort_order,
                                ])->values(),
            'sections' => $this->sections->all()->map(fn (Section $s) => [
                                    'id'        => $s->id,
                                    'slug'      => $s->slug,
                                    'name'      => $s->name,
                                    'full_name' => $s->full_name,
                                    'year'      => $s->academic_year_id,  // the page filters on s.year
                                    'level'     => $s->grade_level_id,    // and s.level
                                ])->values(),
            'subjects' => $this->subjects->all()->map(fn (Subject $s) => [
                            'id'           => $s->id,
                            'slug'         => $s->slug,
                            'name'         => $s->name,
                            'code'         => $s->code,
                            'display_name' => $s->display_name,
                            'level'        => $s->grade_level_id,   // the page reads s.level
                        ])->values(),

            // Tab 3: Backup & restore (Phase 8)
            'backups'      => [],
            'storageUsage' => ['database' => 0, 'files' => 0],
        ]);
    }

    /** Placeholder until a preferences store (settings table or JSON file) exists. */
    private function preferences(): array {

        return [
            'schoolName'     => '',
            'teacherTitle'   => 'Teacher I',
            'landing'        => 'dashboard',
            'timeFormat'     => '12h',
            'timetableStart' => 7,
            'timetableEnd'   => 17,
            'autoLock'       => '15',
        ];
    }
}