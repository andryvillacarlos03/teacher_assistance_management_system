<?php

return [

    'school_year' => [
        'min_days'            => 150,   // shortest school year (about 5 months)
        'max_days'            => 400,   // longest school year (about 13 months)
        'earliest_start_year' => 2000,  // reject typos like 1925
        'max_years_ahead'     => 5,     // reject years too far in the future
    ],

    'grading_periods' => [
        // sequence => name. The only periods that can be created.
        'quarters' => [
            1 => '1st Quarter',
            2 => '2nd Quarter',
            3 => '3rd Quarter',
            4 => '4th Quarter',
        ],
        'min_days'            => 35,    // shortest quarter
        'max_days'            => 120,   // longest quarter
        'max_gap_days'        => 31,    // longest break between two quarters
        'edge_tolerance_days' => 31,    // how far Q1 may start after the year starts / last quarter end before it ends
        'require_weekdays'    => true,  // start and end dates cannot be Saturday or Sunday
        'lock_past_years'     => true,  // an ended, non-active school year is read-only
    ],

    'grade_levels' => [
        'allow_kindergarten' => true,
        'max_grade'          => 6,      // elementary. Raise to 10 or 12 for junior or senior high
    ],

];