<?php

namespace App\Http\Controllers\Settings\AcademicYearSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SectionRequest;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Services\SectionService;
use Illuminate\Http\RedirectResponse;

class SectionController extends Controller {

    public function __construct(private SectionService $service) {}

    public function store(SectionRequest $request, AcademicYear $academicYear): RedirectResponse {

        $this->service->create($academicYear, $request->validated());

        return back()->with('success', 'Section added.');
    }

    public function update(SectionRequest $request, AcademicYear $academicYear, Section $section): RedirectResponse {

        $this->service->update($section, $request->validated());

        return back()->with('success', 'Section updated.');
    }

    public function destroy(AcademicYear $academicYear, Section $section): RedirectResponse {

        $this->service->delete($section);

        return back()->with('success', 'Section removed.');
    }
}