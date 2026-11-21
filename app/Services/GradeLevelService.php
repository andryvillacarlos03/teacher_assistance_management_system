<?php

namespace App\Services;

use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Collection;

class GradeLevelService {

    public function all(?string $search = null): Collection {

        return GradeLevel::query()->search($search)->ordered()->get();
    }

    public function create(array $data): GradeLevel {

        return GradeLevel::create($data)->refresh();
    }

    public function update(GradeLevel $level, array $data): GradeLevel {

        $level->update($data);

        return $level->refresh();
    }

    public function delete(GradeLevel $level): void {
        $level->delete();
    }
}