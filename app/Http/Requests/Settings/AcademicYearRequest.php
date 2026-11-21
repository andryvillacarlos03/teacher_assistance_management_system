<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AcademicYearRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    protected function prepareForValidation(): void {

        if (is_string($this->input('name'))) {
            $this->merge([
                'name' => preg_replace('/\s*[-–—]\s*/u', '-', trim($this->input('name'))),
            ]);
        }
    }

    public function rules(): array {

        $year = $this->route('academicYear');

        return [
            'name' => [
                'bail',
                'required',
                'string',
                'regex:/^\d{4}-\d{4}$/',
                function (string $attribute, mixed $value, \Closure $fail) {
                    [$first, $second] = array_map('intval', explode('-', $value));

                    if ($second !== $first + 1) {
                        $fail('The second year must come right after the first, for example 2025-2026.');
                    }
                },

                Rule::unique('academic_years', 'name')->ignore($year),
            ],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date'   => ['required', 'date_format:Y-m-d', 'after:start_date'],
        ];
    }

    public function withValidator(Validator $validator): void {

        $validator->after(function (Validator $validator) {
            if ($validator->errors()->hasAny(['name', 'start_date', 'end_date'])) {
                return;
            }

            [$first, $second] = array_map('intval', explode('-', $this->input('name')));

            if ((int) substr($this->input('start_date'), 0, 4) !== $first) {
                $validator->errors()->add('start_date', "The start date should be in {$first}.");
            }
            if ((int) substr($this->input('end_date'), 0, 4) !== $second) {
                $validator->errors()->add('end_date', "The end date should be in {$second}.");
            }
        });
    }

    public function messages(): array {
        
        return [
            'name.regex'      => 'Use two years with a dash between them, like 2025-2026.',
            'name.unique'     => 'This school year already exists.',
            'end_date.after'  => 'The end date must be after the start date.',
        ];
    }
}