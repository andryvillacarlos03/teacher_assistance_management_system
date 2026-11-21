<?php

namespace App\Support;

use Illuminate\Support\Str;


final class GradeLevelNames {

    private const WORDS = [
        'one' => 1, 'two' => 2, 'three' => 3, 'four' => 4, 'five' => 5, 'six' => 6,
        'seven' => 7, 'eight' => 8, 'nine' => 9, 'ten' => 10, 'eleven' => 11, 'twelve' => 12,
    ];

    private const ROMAN = [
        'i' => 1, 'ii' => 2, 'iii' => 3, 'iv' => 4, 'v' => 5, 'vi' => 6,
        'vii' => 7, 'viii' => 8, 'ix' => 9, 'x' => 10, 'xi' => 11, 'xii' => 12,
    ];

    public static function allowed(): array {

        $list = config('academic.grade_levels.allow_kindergarten') ? [0 => 'Kindergarten'] : [];

        for ($n = 1; $n <= (int) config('academic.grade_levels.max_grade'); $n++) {
            $list[$n] = "Grade {$n}";
        }

        return $list;
    }

    public static function orderOf(?string $name): ?int {

        $key = array_search($name, self::allowed(), true);

        return $key === false ? null : $key;
    }


    public static function canonical(string $value): ?string {

        $text = (string) Str::of($value)->lower()->replaceMatches('/[._-]+/', ' ')->squish();

        if (config('academic.grade_levels.allow_kindergarten')
            && preg_match('/^(k|kinder|kindergarten|kinder garten)$/', $text)) {
            return 'Kindergarten';
        }

        $number = null;

        if (preg_match('/^(?:grade|gr|g|year|yr)?\s*(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:grade)?$/', $text, $m)) {
            $number = (int) $m[1];
        } elseif (preg_match('/^(?:grade|gr|g)\s*(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,2})$/', $text, $m)) {
            $number = self::ROMAN[$m[1]] ?? null;
        } elseif (preg_match('/^(?:grade\s*)?(' . implode('|', array_keys(self::WORDS)) . ')$/', $text, $m)) {
            $number = self::WORDS[$m[1]];
        }

        $name = $number !== null ? "Grade {$number}" : null;

        return in_array($name, self::allowed(), true) ? $name : null;
    }
}