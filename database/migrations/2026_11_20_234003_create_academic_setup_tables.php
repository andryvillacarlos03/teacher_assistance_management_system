<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    
    public function up(): void {

        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();     
            $table->string('slug')->unique(); 
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index(['start_date', 'end_date']);
        });

        if (in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            DB::statement(
                'CREATE UNIQUE INDEX academic_years_single_active ON academic_years (is_active) WHERE is_active = 1'
            );
        }

        Schema::create('grading_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('name');                       
            $table->string('slug');                     
            $table->unsignedTinyInteger('sequence');    
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();

            $table->unique(['academic_year_id', 'slug']);
            $table->unique(['academic_year_id', 'sequence']);
            $table->index(['start_date', 'end_date']);
        });

        Schema::create('grade_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();           
            $table->string('slug')->unique();         
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('sort_order');
        });

        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_level_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('name');                     
            $table->string('slug');                    
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['academic_year_id', 'grade_level_id', 'slug'], 'sections_year_level_slug_unique');
            $table->index(['academic_year_id', 'grade_level_id']);
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_level_id')->constrained()->restrictOnDelete();
            $table->string('name');                     
            $table->string('slug');                      
            $table->string('code')->nullable();        
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['grade_level_id', 'slug']);
            $table->unique(['grade_level_id', 'code']);
        });
    }

    public function down(): void {

        Schema::dropIfExists('subjects');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('grade_levels');
        Schema::dropIfExists('grading_periods');

        if (in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            DB::statement('DROP INDEX IF EXISTS academic_years_single_active');
        }
        Schema::dropIfExists('academic_years');
    }
};