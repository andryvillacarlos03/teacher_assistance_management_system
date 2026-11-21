<?php

namespace App\Http\Controllers\Settings\AcademicYearSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SubjectRequest;
use App\Models\Subject;
use App\Services\SubjectService;
use Illuminate\Http\RedirectResponse;

class SubjectController extends Controller {

    public function __construct(private SubjectService $service) {}

    public function store(SubjectRequest $request): RedirectResponse {

        $this->service->create($request->validated());

        return back()->with('success', 'Subject added.');
    }

    public function update(SubjectRequest $request, Subject $subject): RedirectResponse {

        $this->service->update($subject, $request->validated());

        return back()->with('success', 'Subject updated.');
    }

    public function destroy(Subject $subject): RedirectResponse {

        $this->service->delete($subject);

        return back()->with('success', 'Subject removed.');
    }
}