<?php

namespace App\Http\Controllers\Settings\Backup;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BackupController extends Controller {

    public function __construct(private BackupService $service) {}

    public function store(Request $request): RedirectResponse {

        $data = $request->validate([
            'include_files' => ['required', 'boolean'],
            'password'      => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $this->service->create($data['include_files'], $data['passseword'] ?? null);

        return back()->with('success', 'Backup created. Test it with Verify to be sure it can be restored.');
    }

    public function verify(Request $request, string $backup): RedirectResponse {

        $this->service->verify($backup, $request->input('password'));

        return back()->with('success', 'Backup verified. It can be restored.');
    }

    public function restore(Request $request, string $backup): RedirectResponse {

        $request->validate(['password' => ['nullable', 'string']]);

        $this->service->restore($this->service->path($backup), $request->input('password'));

        return back()->with('success', 'Your data was restored.');
    }

    public function restoreUpload(Request $request): RedirectResponse {

        $request->validate([
            'backup'   => ['required', 'file'],
            'password' => ['nullable', 'string'],
        ]);

        $file = $request->file('backup');
        abort_unless(strtolower($file->getClientOriginalExtension()) === 'ptas', 422, 'Choose a .ptas backup file.');

        $this->service->restore($file->getRealPath(), $request->input('password'));

        return back()->with('success', 'Your data was restored.');
    }

    public function destroy(string $backup): RedirectResponse {

        $this->service->delete($backup);

        return back()->with('success', 'Backup deleted.');
    }

    public function updateAuto(Request $request): RedirectResponse {

        $data = $request->validate([
            'enabled'   => ['required', 'boolean'],
            'frequency' => ['required', 'in:daily,weekly,close'],
            'keep'      => ['required', 'in:5,10,20'],
        ]);

        $this->service->saveAutoSettings($data);

        return back()->with('success', 'Automatic backup settings saved.');
    }

    public function updateFolder(Request $request): RedirectResponse {

        $this->service->setFolder($request->validate(['folder' => ['required', 'string']])['folder']);

        return back()->with('success', 'Backup folder changed.');
    }
}