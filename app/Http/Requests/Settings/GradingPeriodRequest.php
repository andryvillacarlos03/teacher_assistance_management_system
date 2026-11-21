<?php

namespace App\Http\Requests\Settings;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GradingPeriodRequest extends FormRequest {

    public function authorize(): bool {

        $year   = $this->route('academicYear');
        $period = $this->route('gradingPeriod');

        return ! $period || $period->academic_year_id === $year->id;
    }


    protected function prepareForValidation(): void {

        $name = is_string($this->input('name')) ? $this->canonicalName($this->input('name')) : null;

        $this->merge([
            'name'     => $name ?? $this->input('name'),
            'sequence' => $name ? array_search($name, $this->quarters(), true) : null,
        ]);
    }

    public function rules(): array {

        $year   = $this->route('academicYear');
        $period = $this->route('gradingPeriod');
        $count  = count($this->quarters());

        return [
            'name' => [
                'bail', 'required', 'string',
                Rule::in($this->quarters()),
                Rule::unique('grading_periods', 'name')
                    ->where('academic_year_id', $year->id)
                    ->ignore($period),
            ],
            'sequence'   => ['nullable', 'integer', "between:1,{$count}"],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date'   => ['required', 'date_format:Y-m-d', 'after:start_date'],
        ];
    }

    public function after(): array {

        return [function (Validator $validator) {
            if ($validator->errors()->hasAny(['name', 'sequence', 'start_date', 'end_date'])) {
                return;
            }

            $cfg      = config('academic.grading_periods');
            $errors   = $validator->errors();
            $year     = $this->route('academicYear');
            $period   = $this->route('gradingPeriod');
            $start    = Carbon::parse($this->input('start_date'))->startOfDay();
            $end      = Carbon::parse($this->input('end_date'))->startOfDay();
            $sequence = (int) $this->input('sequence');
            $last     = max(array_keys($cfg['quarters']));

            // 1. Past school years are history
            if ($cfg['lock_past_years'] && ! $year->is_active && $year->end_date->isPast()) {
                $errors->add('name', "S.Y. {$year->name} has ended and is not the active school year, so its grading periods are locked.");
                return;
            }

            // 2. Inside the school year
            if ($start->lt($year->start_date) || $end->gt($year->end_date)) {
                $errors->add(
                    'start_date',
                    "Dates must fall within the school year ({$year->start_date->format('M j, Y')} to {$year->end_date->format('M j, Y')})."
                );
                return;
            }

            // 3. School days only
            if ($cfg['require_weekdays']) {
                if ($start->isWeekend()) {
                    $errors->add('start_date', 'The start date falls on a weekend. Choose a school day.');
                }
                if ($end->isWeekend()) {
                    $errors->add('end_date', 'The end date falls on a weekend. Choose a school day.');
                }
            }

            // 4. A realistic length
            $days = (int) $start->diffInDays($end, true) + 1;
            if ($days < $cfg['min_days'] || $days > $cfg['max_days']) {
                $errors->add('end_date', sprintf(
                    'A grading period must last between %d and %d days. This one is %d days.',
                    $cfg['min_days'], $cfg['max_days'], $days
                ));
            }

            // 5. Overlap, order and gaps compared with the other quarters
            $others = $year->gradingPeriods()
                ->when($period, fn ($q) => $q->whereKeyNot($period->getKey()))
                ->get();

            foreach ($others as $other) {
                if ($start->lte($other->end_date) && $end->gte($other->start_date)) {
                    $errors->add('start_date', "This overlaps with {$other->name} ({$other->date_range}).");
                } elseif ($other->sequence < $sequence && $other->start_date->gt($end)) {
                    $errors->add('start_date', "{$this->label($sequence)} must come after {$other->name}, which starts on {$other->start_date->format('M j, Y')}.");
                } elseif ($other->sequence > $sequence && $other->end_date->lt($start)) {
                    $errors->add('start_date', "{$this->label($sequence)} must come before {$other->name}, which ends on {$other->end_date->format('M j, Y')}.");
                }
            }

            $previous = $others->firstWhere('sequence', $sequence - 1);
            if ($previous && $start->gt($previous->end_date)) {
                $gap = (int) $previous->end_date->diffInDays($start, true) - 1;
                if ($gap > $cfg['max_gap_days']) {
                    $errors->add('start_date', "There is a {$gap}-day gap after {$previous->name}. Breaks between quarters can be at most {$cfg['max_gap_days']} days.");
                }
            }

            $next = $others->firstWhere('sequence', $sequence + 1);
            if ($next && $end->lt($next->start_date)) {
                $gap = (int) $end->diffInDays($next->start_date, true) - 1;
                if ($gap > $cfg['max_gap_days']) {
                    $errors->add('end_date', "There is a {$gap}-day gap before {$next->name}. Breaks between quarters can be at most {$cfg['max_gap_days']} days.");
                }
            }

            // 6. The first quarter starts near the start of the year, the last one ends near the end
            if ($sequence === 1 && (int) $year->start_date->diffInDays($start, true) > $cfg['edge_tolerance_days']) {
                $errors->add('start_date', "{$this->label(1)} should start within {$cfg['edge_tolerance_days']} days of the school year start ({$year->start_date->format('M j, Y')}).");
            }
            if ($sequence === $last && (int) $end->diffInDays($year->end_date, true) > $cfg['edge_tolerance_days']) {
                $errors->add('end_date', "{$this->label($last)} should end within {$cfg['edge_tolerance_days']} days of the school year end ({$year->end_date->format('M j, Y')}).");
            }

            // 7. When editing, existing assessments must still fit inside the new dates
            if ($period) {
                $outside = DB::table('assessments')
                    ->where('grading_period_id', $period->id)
                    ->whereNotNull('assessment_date')
                    ->where(fn ($q) => $q
                        ->whereDate('assessment_date', '<', $start->toDateString())
                        ->orWhereDate('assessment_date', '>', $end->toDateString()))
                    ->count();

                if ($outside > 0) {
                    $errors->add('start_date', "{$outside} assessment" . ($outside === 1 ? '' : 's') . ' in this period would fall outside these dates. Move or delete them first.');
                }
            }
        }];
    }

    public function messages(): array {

        return [
            'name.in'                => 'Use ' . implode(', ', $this->quarters()) . '.',
            'name.unique'            => 'This grading period already exists for the school year.',
            'start_date.date_format' => 'Enter a real date as YYYY-MM-DD.',
            'end_date.date_format'   => 'Enter a real date as YYYY-MM-DD.',
            'end_date.after'         => 'The end date must be after the start date.',
        ];
    }

    private function quarters(): array {

        return config('academic.grading_periods.quarters');
    }

    private function label(int $sequence): string {

        return $this->quarters()[$sequence] ?? 'This period';
    }

    private function canonicalName(string $value): ?string {
        
        $text = (string) Str::of($value)->lower()->squish();

        if (preg_match('/^(?:quarter|qtr|q)\s*(\d)$/', $text, $m)
            || preg_match('/^(\d)\s*(?:st|nd|rd|th)?\s*(?:quarter|qtr|q)$/', $text, $m)) {
            return $this->quarters()[(int) $m[1]] ?? null;
        }

        return null;
    }
}