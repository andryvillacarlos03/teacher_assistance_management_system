<?php

namespace App\Http\Controllers\Settings\AcademicYearSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\GradingPeriodRequest;
use App\Models\AcademicYear;
use App\Models\GradingPeriod;
use App\Services\GradingPeriodService;
use Illuminate\Http\RedirectResponse;

class GradingPeriodController extends Controller {

    public function __construct(private GradingPeriodService $service) {}

    public function store(GradingPeriodRequest $request, AcademicYear $academicYear): RedirectResponse {

        $this->service->create($academicYear, $request->validated());

        return back()->with('success', 'Grading period added.');
    }

    public function update(GradingPeriodRequest $request, AcademicYear $academicYear, GradingPeriod $gradingPeriod): RedirectResponse {

        $this->service->update($gradingPeriod, $request->validated());

        return back()->with('success', 'Grading period updated.');
    }

    public function destroy(AcademicYear $academicYear, GradingPeriod $gradingPeriod): RedirectResponse {

        $this->service->delete($gradingPeriod);

        return back()->with('success', 'Grading period removed.');
    }
}