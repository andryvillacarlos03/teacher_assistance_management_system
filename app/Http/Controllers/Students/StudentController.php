<?php

namespace App\Http\Controllers\Students;

use App\Http\Requests\Student\StudentRequest;
use App\Http\Controllers\Controller;   
use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Models\Enrollment;

class StudentController extends Controller {

    public function __construct(private StudentService $service) {}

    public function index(Request $request): Response {

        $years = AcademicYear::query()->latestFirst()->get();
        $year  = $years->firstWhere('id', $request->integer('year'))
            ?? $years->firstWhere('is_active', true)
            ?? $years->first();

        $enrollments = $year ? $this->service->enrollmentsForYear($year) : collect();
        $history     = $this->service->historyFor($enrollments->pluck('student_id'));

        return Inertia::render('Students', [
            'academicYears' => $years->map(fn (AcademicYear $y) => [
                'id' => $y->id, 'name' => $y->name, 'active' => $y->is_active,
            ])->values(),
            'yearId'   => $year?->id,
            'sections' => $year
                ? Section::query()->forYear($year)->with('gradeLevel')->ordered()->get()
                    ->map(fn (Section $s) => ['id' => $s->id, 'name' => $s->full_name])->values()
                : [],
            'rows' => $enrollments->map(fn (Enrollment $e) => [
                'student' => [
                    'id'            => $e->student->id,
                    'studentNumber' => $e->student->student_number,
                    'firstName'     => $e->student->first_name,
                    'middleName'    => $e->student->middle_name,
                    'lastName'      => $e->student->last_name,
                    'suffix'        => $e->student->suffix,
                    'archived'      => $e->student->trashed(),
                ],
                'enrollment' => [
                    'id'        => $e->id,
                    'sectionId' => $e->section_id,
                    'section'   => $e->section->full_name,
                    'status'    => $e->status,
                ],
            ])->values(),
            'history' => (object) $history->map(fn ($list) => $list->map(fn (Enrollment $e) => [
                'id'       => $e->id,
                'yearId'   => $e->academic_year_id,
                'yearName' => $e->academicYear->name,
                'section'  => $e->section->full_name,
                'status'   => $e->status,
            ])->values())->all(),
        ]);
    }

    public function store(StudentRequest $request): RedirectResponse {

        $data    = $request->validated();
        $student = $this->service->create($data);

        $redirect = back()->with('success', "{$student->display_name} added.");

        if ($this->service->hasSameName($data, $student)) {
            $redirect->with('warning', 'Another student has the same name. Check that this is not a duplicate.');
        }

        return $redirect;
    }

    public function update(StudentRequest $request, Student $student): RedirectResponse {

        $this->service->update($student, $request->validated());

        return back()->with('success', 'Student updated.');
    }

    public function destroy(Student $student): RedirectResponse {

        $this->service->archive($student);

        return back()->with('success', "{$student->display_name} archived.");
    }

    public function restore(Student $student): RedirectResponse {

        $this->service->restore($student);

        return back()->with('success', "{$student->display_name} restored.");
    }
}