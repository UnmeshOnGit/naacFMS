export interface MetricField {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'radio' | 'date' | 'number' | 'file' | 'textarea' | 'multiselect' | 'year' | 'decimal';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export const NAAC_CRITERIA = [
  {
    id: 'C1',
    title: 'Curricular Aspects',
    description: 'Curricular Planning and Implementation, Academic Flexibility, Curriculum Enrichment, Feedback System.',
    fields: [
      { id: 'prog_name', label: 'Programme Name', type: 'text', placeholder: 'e.g., B.E. Computer Engineering', required: true },
      { id: 'acad_year', label: 'Academic Year', type: 'dropdown', options: ['2016-17', '2017-18', '2018-19', '2019-20', '2020-21'], required: true },
      { id: 'course_type', label: 'Course Type', type: 'dropdown', options: ['Core', 'Elective', 'Practical', 'Open', 'Audit'], required: true },
      { id: 'new_prog', label: 'New Programme Introduced?', type: 'radio', options: ['Yes', 'No'], required: true },
      { id: 'bos_name', label: 'BoS Member Name', type: 'text' },
      { id: 'bos_date', label: 'Nomination Date', type: 'date' },
      { id: 'project_title', label: 'Field Project Title', type: 'text', placeholder: 'Student project/internship topic' },
      { id: 'intern_org', label: 'Internship Organisation', type: 'text', placeholder: 'Company or institution name' },
      { id: 'cert_file', label: 'Certificate', type: 'file' },
      { id: 'vac_name', label: 'Value Added Course Name', type: 'text', placeholder: 'Course name and hours' },
      { id: 'feedback', label: 'Feedback Collected? (Attach ATR)', type: 'radio', options: ['Yes', 'No'] },
      { id: 'atr_file', label: 'ATR Document', type: 'file' }
    ]
  },
  {
    id: 'C2',
    title: 'Teaching-Learning and Evaluation',
    description: 'Student Enrolment and Profile, Catering to Student Diversity, Teaching-Learning Process, Teacher Profile and Quality, Evaluation Process and Reforms, Student Performance and Learning Outcomes, Student Satisfaction Survey.',
    fields: [
      { id: 'student_name', label: 'Student Full Name', type: 'text', required: true },
      { id: 'roll_no', label: 'Roll Number', type: 'text', required: true },
      { id: 'category', label: 'Category', type: 'dropdown', options: ['General', 'OBC', 'SC', 'ST', 'PH'], required: true },
      { id: 'admission_year', label: 'Year of Admission', type: 'year', required: true },
      { id: 'faculty_name', label: 'Faculty Name', type: 'text', required: true },
      { id: 'designation', label: 'Designation', type: 'dropdown', options: ['Professor', 'Asst. Professor', 'Guest Faculty'], required: true },
      { id: 'qualification', label: 'Highest Qualification', type: 'dropdown', options: ['UG', 'PG', 'M.Phil', 'Ph.D'], required: true },
      { id: 'publications', label: 'Number of Publications', type: 'number' },
      { id: 'ict_tools', label: 'ICT Tools Used', type: 'multiselect', options: ['PPT', 'LMS', 'Videos', 'CDs', 'Software'] },
      { id: 'ia_marks', label: 'Internal Assessment Marks', type: 'number' },
      { id: 'ia_file', label: 'IA Document (PDF)', type: 'file' },
      { id: 'pass_percent', label: 'Pass Percentage (Decimal)', type: 'decimal' },
      { id: 'result_file', label: 'Result Statistics File', type: 'file' },
      { id: 'slow_learners', label: 'Strategies for Slow Learners', type: 'textarea' }
    ]
  },
  {
    id: 'C3',
    title: 'Research, Innovations and Extension',
    description: 'Resource Mobilization for Research, Innovation Ecosystem, Research Publications and Awards, Extension Activities, Collaboration.',
    fields: [
      { id: 'project_title', label: 'Research Project Title', type: 'text' },
      { id: 'pi_name', label: 'Principal Investigator', type: 'text' },
      { id: 'funding_agency', label: 'Funding Agency', type: 'text' },
      { id: 'grant_amount', label: 'Grant Amount (INR)', type: 'number' },
      { id: 'start_date', label: 'Project Start Date', type: 'date' },
      { id: 'end_date', label: 'Project End Date', type: 'date' },
      { id: 'paper_title', label: 'Journal Paper Title', type: 'text' },
      { id: 'journal_name', label: 'Journal Name', type: 'text' },
      { id: 'ugc_listed', label: 'UGC Listed?', type: 'radio', options: ['Yes', 'No'] },
      { id: 'issn', label: 'ISSN Number', type: 'text' },
      { id: 'book_title', label: 'Book / Chapter Title', type: 'text' },
      { id: 'publisher', label: 'Publisher Name', type: 'text' },
      { id: 'pub_year', label: 'Year of Publication', type: 'year' },
      { id: 'phd_scholar', label: 'PhD Scholar Name', type: 'text' },
      { id: 'phd_year', label: 'PhD Awarded Year', type: 'year' },
      { id: 'event_name', label: 'Workshop/Seminar Name', type: 'text' },
      { id: 'event_date', label: 'Event Date', type: 'date' },
      { id: 'event_file', label: 'Brochure / Certificate', type: 'file' },
      { id: 'extension_name', label: 'Extension Activity Name', type: 'text' },
      { id: 'participants_count', label: 'Number of Students Participated', type: 'number' }
    ]
  },
  {
    id: 'C4',
    title: 'Infrastructure and Learning Resources',
    description: 'Physical Facilities, Library as a Learning Resource, IT Infrastructure, Maintenance of Campus Infrastructure.',
    fields: [
      { id: 'facility_type', label: 'Facility Type', type: 'dropdown', options: ['Classroom', 'Lab', 'Computer Lab', 'Research Facility'] },
      { id: 'room_id', label: 'Room Number / Name', type: 'text' },
      { id: 'area_sqft', label: 'Area (sq. ft.)', type: 'number' },
      { id: 'seating', label: 'Seating Capacity', type: 'number' },
      { id: 'systems_count', label: 'Number of Systems (for labs)', type: 'number' },
      { id: 'equip_name', label: 'Equipment Name', type: 'text' },
      { id: 'equip_model', label: 'Equipment Make & Model', type: 'text' },
      { id: 'purchase_year', label: 'Year of Purchase', type: 'year' },
      { id: 'cost', label: 'Cost (INR)', type: 'number' },
      { id: 'photo_file', label: 'Facility Photograph (min 2)', type: 'file' }
    ]
  },
  {
    id: 'C5',
    title: 'Student Support and Progression',
    description: 'Student Support, Student Progression, Student Participation and Activities, Alumni Engagement.',
    fields: [
      { id: 'scholar_name', label: 'Scholarship Name', type: 'text' },
      { id: 'award_body', label: 'Awarding Body', type: 'text' },
      { id: 'beneficiary', label: 'Beneficiary Student Name', type: 'text' },
      { id: 'cat_student', label: 'Category', type: 'dropdown', options: ['SC', 'ST', 'OBC', 'Minority', 'Merit'] },
      { id: 'amount', label: 'Annual Amount (INR)', type: 'number' },
      { id: 'acad_year_s', label: 'Academic Year', type: 'dropdown', options: ['2016-17', '2017-18', '2018-19', '2019-20', '2020-21'] },
      { id: 'placement_co', label: 'Placement Company', type: 'text' },
      { id: 'job_role', label: 'Job Role', type: 'text' },
      { id: 'package_lpa', label: 'Package (LPA)', type: 'decimal' },
      { id: 'higher_edu_inst', label: 'Higher Education Institution', type: 'text' },
      { id: 'prog_pursued', label: 'Programme Pursued', type: 'text', placeholder: 'e.g., MBA, M.Sc' },
      { id: 'comp_exam', label: 'Competitive Exam', type: 'dropdown', options: ['NET', 'SLET', 'GATE', 'UPSC', 'PSC', 'CAT', 'GRE', 'TOFEL', 'GMAT'] },
      { id: 'exam_year', label: 'Exam Year', type: 'year' },
      { id: 'score', label: 'Rank / Score', type: 'text' },
      { id: 'award_name', label: 'Award / Medal Name', type: 'text' },
      { id: 'level', label: 'Level', type: 'dropdown', options: ['State', 'National', 'International'] },
      { id: 'cert_file_s', label: 'Certificate', type: 'file' },
      { id: 'alumni_date', label: 'Alumni Event Date', type: 'date' },
      { id: 'meeting_minutes', label: 'Meeting Minutes (PDF)', type: 'file' }
    ]
  },
  {
    id: 'C6',
    title: 'Governance, Leadership and Management',
    description: 'Institutional Vision and Leadership, Strategy Development and Deployment, Faculty Empowerment Strategies, Financial Management and Resource Mobilization, Internal Quality Assurance System (IQAS).',
    fields: [
      { id: 'fdp_name', label: 'FDP Programme Name', type: 'text' },
      { id: 'org_inst', label: 'Organising Institution', type: 'text' },
      { id: 'duration', label: 'Duration (Days)', type: 'number' },
      { id: 'faculty_attendee', label: 'Faculty Member Name', type: 'text' },
      { id: 'attend_date', label: 'Date of Attendance', type: 'date' },
      { id: 'fdp_cert', label: 'FDP Certificate', type: 'file' },
      { id: 'pbas_score', label: 'PBAS Score', type: 'decimal' },
      { id: 'assess_year', label: 'Assessment Year', type: 'year' },
      { id: 'fund_activity', label: 'Fund Generation Activity', type: 'text' },
      { id: 'fund_amount', label: 'Amount Generated (INR)', type: 'number' },
      { id: 'fund_source', label: 'Source of Funds', type: 'text' },
      { id: 'fund_doc', label: 'Supporting Document', type: 'file' }
    ]
  },
  {
    id: 'C7',
    title: 'Institutional Values and Best Practices',
    description: 'Institutional Values and Social Responsibilities, Best Practices, Institutional Distinctiveness.',
    fields: [
      { id: 'bp_title', label: 'Best Practice Title', type: 'text' },
      { id: 'bp_obj', label: 'Objective', type: 'textarea' },
      { id: 'bp_context', label: 'Context', type: 'textarea' },
      { id: 'bp_desc', label: 'Practice Description', type: 'textarea' },
      { id: 'bp_success', label: 'Evidence of Success', type: 'textarea' },
      { id: 'bp_probs', label: 'Problems Encountered', type: 'textarea' },
      { id: 'bp_res', label: 'Resources Required', type: 'textarea' },
      { id: 'bp_doc', label: 'Evidence Document', type: 'file' },
      { id: 'green_init', label: 'Green Initiative Name', type: 'text' },
      { id: 'gender_equity', label: 'Gender Equity Activity', type: 'text' },
      { id: 'gender_date', label: 'Activity Date', type: 'date' },
      { id: 'disabled_friendly', label: 'Disabled-Friendly Feature', type: 'text' },
      { id: 'support_doc', label: 'Supporting Document', type: 'file' }
    ]
  }
];

export type Role = 'TEACHER' | 'HOD';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  department: string;
}
