<?php

namespace App\Http\Controllers\Settings\AcademicYearSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AcademicYearRequest;
use App\Models\AcademicYear;
use App\Services\AcademicYearService;
use Illuminate\Http\RedirectResponse;

class AcademicYearController extends Controller {

    public function __construct(private AcademicYearService $service) {}

    public function store(AcademicYearRequest $request): RedirectResponse {

        $this->service->create($request->validated());

        return back()->with('success', 'School year created.');
    }

    public function update(AcademicYearRequest $request, AcademicYear $academicYear): RedirectResponse {

        $this->service->update($academicYear, $request->validated());

        return back()->with('success', 'School year updated.');
    }

    public function activate(AcademicYear $academicYear): RedirectResponse {

        $this->service->activate($academicYear);

        return back()->with('success', 'Active school year changed.');
    }

    public function destroy(AcademicYear $academicYear): RedirectResponse {

        $this->service->delete($academicYear);

        return back()->with('success', 'School year deleted.');
    }
}