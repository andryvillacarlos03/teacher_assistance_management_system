// Static sample data for the Dashboard page.
// Replace with props from your Laravel controller later (Inertia::render('Dashboard', [...])).

export const todaySchedule = [
    { id: 1, start: '7:30 AM',  end: '8:20 AM',  subject: 'Mathematics',        section: 'Grade 4 – Mabini', room: 'Room 12', state: 'done' },
    { id: 2, start: '8:20 AM',  end: '9:10 AM',  subject: 'Science',            section: 'Grade 4 – Rizal',  room: 'Room 12', state: 'now' },
    { id: 3, start: '9:30 AM',  end: '10:20 AM', subject: 'English',            section: 'Grade 4 – Mabini', room: 'Room 12', state: 'next' },
    { id: 4, start: '10:20 AM', end: '11:10 AM', subject: 'Araling Panlipunan', section: 'Grade 4 – Rizal',  room: 'Room 12', state: 'upcoming' },
    { id: 5, start: '1:00 PM',  end: '1:50 PM',  subject: 'Mathematics',        section: 'Grade 4 – Rizal',  room: 'Room 12', state: 'upcoming' },
];

// status: Pending | In Progress | Completed | Overdue
export const tasks = [
    { id: 1, title: 'Submit weekly lesson plan',            category: 'Paperwork',      due: '2 days overdue', dueTone: 'overdue', priority: 'High',   status: 'Overdue' },
    { id: 2, title: 'Update class record (Quarter 2)',      category: 'Paperwork',      due: '1 day overdue',  dueTone: 'overdue', priority: 'Medium', status: 'Overdue' },
    { id: 3, title: 'Check Quiz 3: Fractions',              category: 'Checking',       due: 'Today',          dueTone: 'soon',    priority: 'High',   status: 'In Progress' },
    { id: 4, title: 'Encode Performance Task scores',       category: 'Grade encoding', due: 'Tomorrow',       dueTone: 'soon',    priority: 'Medium', status: 'Pending' },
    { id: 5, title: 'Prepare Science Quarter 2 exam',       category: 'Examination',    due: 'Fri, Nov 20',    dueTone: 'normal',  priority: 'High',   status: 'In Progress' },
    { id: 6, title: 'Print worksheets for Filipino',        category: 'Lesson prep',    due: 'Mon, Nov 23',    dueTone: 'normal',  priority: 'Low',    status: 'Pending' },
];

export const checkingQueue = [
    { id: 1, title: 'Quiz 3: Fractions',      classLabel: 'Math · Grade 4 – Mabini', checked: 18, total: 32 },
    { id: 2, title: 'Activity: Plant Parts',  classLabel: 'Science · Grade 4 – Rizal', checked: 0,  total: 30 },
    { id: 3, title: 'Seatwork: Pandiwa',      classLabel: 'Filipino · Grade 4 – Mabini', checked: 27, total: 32 },
];

export const upcomingExams = [
    { id: 1, title: 'Science – Quarter 2 Exam',     date: 'Fri, Nov 20', section: 'Grade 4 – Rizal',  prep: 'In Progress' },
    { id: 2, title: 'Mathematics – Quarter 2 Exam', date: 'Tue, Nov 24', section: 'Grade 4 – Mabini', prep: 'Pending' },
];

export const recentLessonPlans = [
    { id: 1, topic: 'Adding Unlike Fractions',  subject: 'Mathematics', date: 'Nov 14', status: 'Completed' },
    { id: 2, topic: 'Parts of a Plant',         subject: 'Science',     date: 'Nov 17', status: 'Draft' },
    { id: 3, topic: 'Paggamit ng Pandiwa',      subject: 'Filipino',    date: 'Nov 18', status: 'Draft' },
];

// Attendance for one section, last school week. present + late + absent = classSize
export const attendanceWeek = {
    sectionLabel: 'Grade 4 – Mabini',
    classSize: 32,
    days: [
        { day: 'Mon', present: 29, late: 2, absent: 1 },
        { day: 'Tue', present: 30, late: 1, absent: 1 },
        { day: 'Wed', present: 28, late: 2, absent: 2 },
        { day: 'Thu', present: 31, late: 0, absent: 1 },
        { day: 'Fri', present: 27, late: 3, absent: 2 },
    ],
};