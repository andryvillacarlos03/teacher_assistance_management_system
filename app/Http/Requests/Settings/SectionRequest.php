<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SectionRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    public function rules(): array {

        $year = $this->route('academicYear');

        return [
            'grade_level_id' => ['required', 'integer', Rule::exists('grade_levels', 'id')],
            'name'           => ['required', 'string', 'max:50',
                                 Rule::unique('sections', 'name')
                                     ->where('academic_year_id', $year->id)
                                     ->where('grade_level_id', $this->input('grade_level_id'))
                                     ->whereNull('deleted_at')
                                     ->ignore($this->route('section'))],
        ];
    }

    public function messages(): array {

        return [
            'name.unique' => 'This section already exists for the grade level.',
        ];
    }
}