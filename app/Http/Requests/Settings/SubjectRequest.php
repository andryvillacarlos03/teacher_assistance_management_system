<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    protected function prepareForValidation(): void {

        if (filled($this->code)) {
            $this->merge(['code' => strtoupper(trim($this->code))]);
        }
    }

    public function rules(): array {

        $unique = fn (string $column) => Rule::unique('subjects', $column)
            ->where('grade_level_id', $this->input('grade_level_id'))
            ->whereNull('deleted_at')
            ->ignore($this->route('subject'));

        return [
            'grade_level_id' => ['required', 'integer', Rule::exists('grade_levels', 'id')],
            'name'           => ['required', 'string', 'max:100', $unique('name')],
            'code'           => ['nullable', 'string', 'max:20', $unique('code')],
        ];
    }

    public function messages(): array {

        return [
            'name.unique' => 'This subject already exists for the grade level.',
            'code.unique' => 'This code is already used by another subject in the grade level.',
        ];
    }
}