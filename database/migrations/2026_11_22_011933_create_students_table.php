<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void {

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_number', 30)->nullable();   // LRN or school ID, if the teacher has it
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();            // Jr., III
            $table->softDeletes();
            $table->timestamps();

            $table->index(['last_name', 'first_name']);
        });

        // Unique only among students that are not archived, so an archived
        // student's number can be reused. SQLite allows many NULLs already.
        DB::statement(
            'CREATE UNIQUE INDEX students_student_number_unique
             ON students (student_number)
             WHERE deleted_at IS NULL AND student_number IS NOT NULL'
        );
    }

    public function down(): void {

        Schema::dropIfExists('students');
    }
};