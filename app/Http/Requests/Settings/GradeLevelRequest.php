<?php

namespace App\Http\Requests\Settings;

use App\Models\GradeLevel;
use App\Support\GradeLevelNames;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GradeLevelRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    protected function prepareForValidation(): void {

        $name = is_string($this->input('name')) ? GradeLevelNames::canonical($this->input('name')) : null;

        $this->merge([
            'name'       => $name ?? $this->input('name'),
            'sort_order' => GradeLevelNames::orderOf($name),
        ]);
    }

    public function rules(): array {

        $level = $this->route('gradeLevel');
        $max   = (int) config('academic.grade_levels.max_grade');

        return [
            'name' => [
                'bail', 'required', 'string',
                Rule::in(GradeLevelNames::allowed()),
                function (string $attribute, mixed $value, \Closure $fail) use ($level) {
                    $exists = GradeLevel::query()
                        ->whereRaw('LOWER(name) = ?', [mb_strtolower($value)])
                        ->when($level, fn ($q) => $q->whereKeyNot($level->getKey()))
                        ->exists();

                    if ($exists) {
                        $fail('This grade level already exists.');
                    }
                },
            ],
            'sort_order' => ['required', 'integer', "between:0,{$max}"],
        ];
    }

    public function after(): array {

        return [function (Validator $validator) {
            if ($validator->errors()->has('name')) {
                return;
            }

            // Renaming would silently relabel every section, subject and record that uses it
            $level = $this->route('gradeLevel');

            if ($level && $level->name !== $this->input('name')) {
                $sections = $level->sections()->withTrashed()->count();
                $subjects = $level->subjects()->withTrashed()->count();

                if ($sections + $subjects > 0) {
                    $validator->errors()->add(
                        'name',
                        "{$level->name} is used by {$sections} section(s) and {$subjects} subject(s), so it cannot be renamed. Add a new grade level instead."
                    );
                }
            }
        }];
    }

    public function messages(): array {
        
        return [
            'name.required'      => 'Enter the grade level.',
            'name.in'            => 'Use ' . implode(', ', GradeLevelNames::allowed()) . '.',
            'sort_order.between' => 'Check the grade level name.',
        ];
    }
}