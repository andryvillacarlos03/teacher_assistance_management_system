// Static sample data for the Tasks page.
// Due dates are relative to today so the sample always shows overdue / due-soon items.
// status (stored): 'pending' | 'in_progress' | 'completed'   ("Overdue" is calculated, not stored)
// category: 'lesson_prep' | 'checking' | 'examination' | 'paperwork' | 'grade_encoding'
// priority: 'high' | 'medium' | 'low'

const iso = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
const due = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return iso(d);
};
const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

export const initialTasks = [
    {
        id: 1, title: 'Submit weekly lesson plan', category: 'paperwork', priority: 'high',
        due: due(-2), status: 'pending', subject: '', section: '', checked: 0, total: 0,
        description: 'Weekly plan for the school head, covering Nov 16–20.',
        updates: [{ id: 1, status: 'pending', notes: 'Task created.', at: ago(6) }],
    },
    {
        id: 2, title: 'Update class record (Quarter 2)', category: 'paperwork', priority: 'medium',
        due: due(-1), status: 'pending', subject: '', section: '', checked: 0, total: 0,
        description: '',
        updates: [{ id: 2, status: 'pending', notes: 'Task created.', at: ago(5) }],
    },
    {
        id: 3, title: 'Check Quiz 3: Fractions', category: 'checking', priority: 'high',
        due: due(0), status: 'in_progress', subject: 'math', section: 'Grade 4 – Mabini', checked: 18, total: 32,
        description: 'Five items, 1 point each. Record scores in the class record after checking.',
        updates: [
            { id: 3, status: 'pending', notes: 'Task created.', at: ago(2) },
            { id: 4, status: 'in_progress', notes: 'Started checking. 18 of 32 done. Remaining papers are in the blue folder.', at: ago(0, 3) },
        ],
    },
    {
        id: 4, title: 'Check Activity: Plant Parts', category: 'checking', priority: 'medium',
        due: due(1), status: 'pending', subject: 'science', section: 'Grade 4 – Rizal', checked: 0, total: 30,
        description: '',
        updates: [{ id: 5, status: 'pending', notes: 'Task created.', at: ago(1) }],
    },
    {
        id: 5, title: 'Check Seatwork: Pandiwa', category: 'checking', priority: 'low',
        due: due(2), status: 'in_progress', subject: 'filipino', section: 'Grade 4 – Mabini', checked: 27, total: 32,
        description: '',
        updates: [
            { id: 6, status: 'pending', notes: 'Task created.', at: ago(3) },
            { id: 7, status: 'in_progress', notes: '27 of 32 checked.', at: ago(1, 2) },
        ],
    },
    {
        id: 6, title: 'Encode Performance Task scores', category: 'grade_encoding', priority: 'medium',
        due: due(1), status: 'pending', subject: 'math', section: 'Grade 4 – Rizal', checked: 0, total: 0,
        description: 'Encode Performance Task 2 scores into the quarterly record.',
        updates: [{ id: 8, status: 'pending', notes: 'Task created.', at: ago(2) }],
    },
    {
        id: 7, title: 'Prepare Science Quarter 2 exam', category: 'examination', priority: 'high',
        due: due(5), status: 'in_progress', subject: 'science', section: 'Grade 4 – Rizal', checked: 0, total: 0,
        description: '40 items. Include a table of specifications and the answer key.',
        updates: [
            { id: 9,  status: 'pending',     notes: 'Task created.', at: ago(8) },
            { id: 10, status: 'in_progress', notes: 'Drafted items 1–25. Need to finish the Part 2 problems.', at: ago(2) },
        ],
    },
    {
        id: 8, title: 'Prepare Mathematics Quarter 2 exam', category: 'examination', priority: 'high',
        due: due(9), status: 'pending', subject: 'math', section: 'Grade 4 – Mabini', checked: 0, total: 0,
        description: '',
        updates: [{ id: 11, status: 'pending', notes: 'Task created.', at: ago(4) }],
    },
    {
        id: 9, title: 'Review lesson plans for next week', category: 'lesson_prep', priority: 'medium',
        due: due(3), status: 'pending', subject: '', section: '', checked: 0, total: 0,
        description: '',
        updates: [{ id: 12, status: 'pending', notes: 'Task created.', at: ago(2) }],
    },
    {
        id: 10, title: 'Print worksheets for Filipino', category: 'lesson_prep', priority: 'low',
        due: due(8), status: 'pending', subject: 'filipino', section: 'Grade 4 – Mabini', checked: 0, total: 0,
        description: '',
        updates: [{ id: 13, status: 'pending', notes: 'Task created.', at: ago(2) }],
    },
    {
        id: 11, title: 'Post Quarter 1 summary of grades', category: 'grade_encoding', priority: 'medium',
        due: due(-7), status: 'completed', subject: '', section: '', checked: 0, total: 0,
        description: '',
        updates: [
            { id: 14, status: 'pending',   notes: 'Task created.', at: ago(14) },
            { id: 15, status: 'completed', notes: 'Posted and signed by the school head.', at: ago(7) },
        ],
    },
    {
        id: 12, title: 'Submit October attendance report', category: 'paperwork', priority: 'low',
        due: due(-10), status: 'completed', subject: '', section: '', checked: 0, total: 0,
        description: '',
        updates: [
            { id: 16, status: 'pending',   notes: 'Task created.', at: ago(16) },
            { id: 17, status: 'completed', notes: 'Marked as completed.', at: ago(10) },
        ],
    },
];