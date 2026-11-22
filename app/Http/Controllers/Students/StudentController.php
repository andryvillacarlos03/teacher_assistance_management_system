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

class StudentController extends Controller {

    public function __construct(private StudentService $service) {}

    public function index(Request $request): Response {

        $filters = [
            'search'   => $request->string('search')->toString() ?: null,
            'archived' => $request->boolean('archived'),
        ];

        return Inertia::render('Students', [
            'students' => $this->service->paginate($filters)->through(fn (Student $s) => [
                'id'             => $s->id,
                'student_number' => $s->student_number,
                'first_name'     => $s->first_name,
                'middle_name'    => $s->middle_name,
                'last_name'      => $s->last_name,
                'suffix'         => $s->suffix,
                'full_name'      => $s->full_name,
                'display_name'   => $s->display_name,
                'archived'       => $s->trashed(),
            ]),
            'filters' => $filters,
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