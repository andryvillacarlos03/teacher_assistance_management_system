<?php

namespace App\Http\Controllers\Settings\AcademicYearSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GradeLevelRequest;
use App\Models\GradeLevel;
use App\Services\GradeLevelService;
use Illuminate\Http\RedirectResponse;

class GradeLevelController extends Controller {

    public function __construct(private GradeLevelService $service) {}

    public function store(GradeLevelRequest $request): RedirectResponse {

        $this->service->create($request->validated());

        return back()->with('success', 'Grade level added.');
    }

    public function update(GradeLevelRequest $request, GradeLevel $gradeLevel): RedirectResponse {

        $this->service->update($gradeLevel, $request->validated());

        return back()->with('success', 'Grade level updated.');
    }

    public function destroy(GradeLevel $gradeLevel): RedirectResponse {

        $this->service->delete($gradeLevel);

        return back()->with('success', 'Grade level removed.');
    }
}