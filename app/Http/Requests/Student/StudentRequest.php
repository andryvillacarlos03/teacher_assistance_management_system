<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest {

    public function authorize(): bool {

        return true;
    }

    public function rules(): array {

        return [
            'student_number' => ['nullable', 'string', 'max:30',
                                 Rule::unique('students', 'student_number')
                                     ->whereNull('deleted_at')
                                     ->ignore($this->route('student'))],
            'first_name'     => ['required', 'string', 'max:100'],
            'middle_name'    => ['nullable', 'string', 'max:100'],
            'last_name'      => ['required', 'string', 'max:100'],
            'suffix'         => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array {

        return [
            'student_number.unique' => 'Another student already has this student number.',
        ];
    }
}