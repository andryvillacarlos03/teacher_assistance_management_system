<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Enrollment;

class StudentRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    public function rules(): array {

        return [
            'student_number'   => ['nullable', 'string', 'max:30',
                                Rule::unique('students', 'student_number')
                                    ->whereNull('deleted_at')
                                    ->ignore($this->route('student'))],
            'first_name'       => ['required', 'string', 'max:100'],
            'middle_name'      => ['nullable', 'string', 'max:100'],
            'last_name'        => ['required', 'string', 'max:100'],
            'suffix'           => ['nullable', 'string', 'max:20'],

            'academic_year_id' => ['required', 'integer', Rule::exists('academic_years', 'id')->whereNull('deleted_at')],
            // Required when adding. When editing, empty means "not enrolled this year".
            'section_id'       => [$this->route('student') ? 'nullable' : 'required', 'integer',
                                Rule::exists('sections', 'id')
                                    ->where('academic_year_id', $this->input('academic_year_id'))
                                    ->whereNull('deleted_at')],
            'status'           => ['required', Rule::in(Enrollment::STATUSES)],
        ];
    }

    public function messages(): array {

        return [
            'student_number.unique' => 'Another student already has this student number.',
            'section_id.required'   => 'Choose a section for this school year.',
            'section_id.exists'     => 'That section does not belong to this school year.',
        ];
    }

}