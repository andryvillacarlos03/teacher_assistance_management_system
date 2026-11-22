<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class BackupService {

    private const EXT = 'ptas';

    public function folder(): string {

        return Setting::get('backup.folder')
            ?: ((getenv('USERPROFILE') ?: storage_path('app')) . DIRECTORY_SEPARATOR . 'Documents' . DIRECTORY_SEPARATOR . 'PTAS Backups');
    }

    public function setFolder(string $path): void {

        if (! File::isDirectory($path) && ! @mkdir($path, 0775, true)) {
            throw ValidationException::withMessages(['folder' => 'That folder does not exist and could not be created.']);
        }
        if (! is_writable($path)) {
            throw ValidationException::withMessages(['folder' => 'The app cannot write to that folder.']);
        }

        Setting::set('backup.folder', $path);
    }

    public function autoSettings(): array {

        return [
            'enabled'   => (bool) Setting::get('backup.auto.enabled', true),
            'frequency' => (string) Setting::get('backup.auto.frequency', 'daily'),
            'keep'      => (string) Setting::get('backup.auto.keep', '10'),
        ];
    }

    public function saveAutoSettings(array $data): void {

        Setting::set('backup.auto.enabled', (bool) $data['enabled']);
        Setting::set('backup.auto.frequency', $data['frequency']);
        Setting::set('backup.auto.keep', (string) $data['keep']);
    }


    public function all(): array {

        return collect(glob($this->folder() . DIRECTORY_SEPARATOR . '*.' . self::EXT) ?: [])
            ->map(fn (string $p) => $this->describe($p))
            ->sortByDesc('at')->values()->all();
    }

    public function storageUsage(): array {

        $db    = config('database.connections.sqlite.database');
        $files = 0;

        if (is_dir($dir = $this->filesPath())) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)) as $f) {
                $files += $f->getSize();
            }
        }

        return ['database' => is_file($db) ? filesize($db) : 0, 'files' => $files];
    }

    public function create(bool $includeFiles, ?string $password = null, string $kind = 'manual'): array {

        $folder = $this->ensureFolder();
        $name   = sprintf('ptas-%s-%s.ptas', $kind === 'safety' ? 'safety' : 'backup', now()->format('Ymd-His'));
        $final  = $folder . DIRECTORY_SEPARATOR . $name;
        $part   = $final . '.part';
        $snap   = tempnam(sys_get_temp_dir(), 'ptas');
        @unlink($snap);

        try {
            // A consistent copy of the live database (safe even while the app is open).
            $pdo = DB::connection()->getPdo();
            $pdo->exec('VACUUM INTO ' . $pdo->quote($snap));

            $zip = new ZipArchive();
            if ($zip->open($part, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('The backup file could not be created.');
            }

            $zip->addFile($snap, 'database.sqlite');
            $zip->addFromString('manifest.json', json_encode([
                'app' => 'PTAS', 'created_at' => now()->toIso8601String(), 'includes_files' => $includeFiles,
            ]));

            if ($includeFiles && is_dir($dir = $this->filesPath())) {
                foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)) as $f) {
                    if ($f->isFile()) {
                        $zip->addFile($f->getPathname(), 'files/' . str_replace('\\', '/', substr($f->getPathname(), strlen($dir) + 1)));
                    }
                }
            }

            if ($password) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $zip->setEncryptionIndex($i, ZipArchive::EM_AES_256, $password);
                }
            }

            if (! $zip->close()) {
                throw new \RuntimeException('The backup could not be written. Check free disk space.');
            }

            rename($part, $final);
        } finally {
            @unlink($snap);
            @unlink($part);
        }

        file_put_contents($final . '.json', json_encode([
            'kind' => $kind, 'created_at' => now()->toIso8601String(),
            'includes_files' => $includeFiles, 'encrypted' => (bool) $password, 'verified_at' => null,
        ]));

        return $this->describe($final);
    }

    /* ---------- verify / restore ---------- */

    public function verify(string $id, ?string $password): void {

        $path = $this->path($id);
        $tmp  = $this->extractDatabase($path, $password);
        @unlink($tmp);

        $this->writeMeta($path, ['verified_at' => now()->toIso8601String()]);
    }

    public function restore(string $path, ?string $password): void {

        // 1. Prove the backup is good BEFORE touching current data.
        $newDb = $this->extractDatabase($path, $password);

        // 2. Safety copy of what is there now.
        $this->create(includeFiles: true, kind: 'safety');

        // 3. Swap the database.
        $target = config('database.connections.sqlite.database');
        DB::disconnect();
        foreach (['-wal', '-shm'] as $suffix) {
            @unlink($target . $suffix);
        }
        copy($newDb, $target);
        @unlink($newDb);

        // 4. Swap teaching files, only if the backup contains them.
        $zip = $this->openZip($path, $password);
        $this->replaceFiles($zip);
        $zip->close();

        Setting::flushCache();
    }

    public function delete(string $id): void {

        $path = $this->path($id);
        @unlink($path);
        @unlink($path . '.json');
    }

    /** Keep only the newest N automatic backups. Manual and safety backups are never pruned. */
    public function pruneAuto(int $keep): void {

        collect($this->all())->where('kind', 'auto')->slice($keep)
            ->each(fn (array $b) => $this->delete($b['id']));
    }

    /** Resolve a backup id to a file inside the backup folder (blocks path traversal). */
    public function path(string $id): string {

        abort_unless(preg_match('/^ptas-(backup|safety)-\d{8}-\d{6}\.ptas$/', $id), 404);

        $path = $this->folder() . DIRECTORY_SEPARATOR . $id;
        abort_unless(is_file($path), 404);

        return $path;
    }

    /* ---------- internals ---------- */

    private function openZip(string $path, ?string $password): ZipArchive {

        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::RDONLY) !== true) {
            throw ValidationException::withMessages(['backup' => 'This is not a valid backup file.']);
        }
        if ($password) {
            $zip->setPassword($password);
        }

        return $zip;
    }

    /** Extract database.sqlite to a temp file and check it is a healthy PTAS database. */
    private function extractDatabase(string $path, ?string $password): string {

        $zip    = $this->openZip($path, $password);
        $stream = $zip->getStream('database.sqlite');

        if (! $stream) {
            $zip->close();
            throw ValidationException::withMessages(['password' => 'The password is incorrect, or the backup is damaged.']);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'ptas');
        $out = fopen($tmp, 'wb');
        stream_copy_to_stream($stream, $out);
        fclose($out);
        fclose($stream);
        $zip->close();

        try {
            $pdo = new \PDO('sqlite:' . $tmp);
            $ok  = $pdo->query('PRAGMA integrity_check')->fetchColumn() === 'ok'
                && $pdo->query("SELECT 1 FROM sqlite_master WHERE name = 'academic_years'")->fetchColumn();
        } catch (\Throwable) {
            $ok = false;
        }
        unset($pdo);

        if (! $ok) {
            @unlink($tmp);
            throw ValidationException::withMessages(['backup' => 'This backup is damaged or is not a PTAS backup.']);
        }

        return $tmp;
    }

    private function replaceFiles(ZipArchive $zip): void {

        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            if (str_starts_with($zip->getNameIndex($i), 'files/')) {
                $names[] = $zip->getNameIndex($i);
            }
        }
        if ($names === []) {
            return;
        }

        $tmp = storage_path('app/restore-' . Str::random(8));
        mkdir($tmp, 0775, true);
        $zip->extractTo($tmp, $names);

        $dest = $this->filesPath();
        $old  = $dest . '.old-' . time();
        if (is_dir($dest)) {
            rename($dest, $old);
        }
        rename($tmp . DIRECTORY_SEPARATOR . 'files', $dest);

        File::deleteDirectory($old);
        File::deleteDirectory($tmp);
    }

    private function filesPath(): string {

        return config('ptas.files_path', storage_path('app/private/teaching-resources'));
    }

    private function ensureFolder(): string {

        $folder = $this->folder();
        if (! File::isDirectory($folder) && ! @mkdir($folder, 0775, true)) {
            throw ValidationException::withMessages(['backup' => 'The backup folder could not be created.']);
        }

        return $folder;
    }

    private function writeMeta(string $path, array $changes): void {

        $file = $path . '.json';
        $meta = is_file($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
        file_put_contents($file, json_encode(array_merge($meta, $changes)));
    }

    private function describe(string $path): array {

        $meta = is_file($path . '.json') ? (json_decode(file_get_contents($path . '.json'), true) ?: []) : [];

        return [
            'id'            => basename($path),
            'kind'          => $meta['kind'] ?? 'manual',
            'at'            => $meta['created_at'] ?? date(DATE_ATOM, filemtime($path)),
            'size'          => filesize($path),
            'includesFiles' => $meta['includes_files'] ?? false,
            'encrypted'     => $meta['encrypted'] ?? false,
            'verifiedAt'    => $meta['verified_at'] ?? null,
        ];
    }
}