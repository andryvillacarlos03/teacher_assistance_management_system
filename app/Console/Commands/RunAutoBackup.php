<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

class RunAutoBackup extends Command {

    protected $signature = 'backups:auto';
    protected $description = 'Create an automatic backup if one is due.';

    public function handle(BackupService $backups): int {

        $auto = $backups->autoSettings();
        if (! $auto['enabled'] || $auto['frequency'] === 'close') {
            return self::SUCCESS;
        }

        $last = collect($backups->all())->where('kind', 'auto')->first();
        $days = $auto['frequency'] === 'weekly' ? 7 : 1;

        if ($last && now()->diffInDays($last['at']) < $days) {
            return self::SUCCESS;
        }

        $backups->create(includeFiles: true, kind: 'auto');
        $backups->pruneAuto((int) $auto['keep']);

        return self::SUCCESS;
    }
}