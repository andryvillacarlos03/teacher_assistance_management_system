<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;

trait NormalizesName {
    
    protected function name(): Attribute {

        return Attribute::make(
            set: fn ($value) => is_string($value)
                ? trim(preg_replace('/\s+/u', ' ', $value))
                : $value,
        );
    }
}