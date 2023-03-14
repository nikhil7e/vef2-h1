export type DepartmentImport = {
  title: string;
  slug: string;
  description?: string;
  csv: string;
};

export type Link = {
  href: string;
};

export type Links = {
  self?: Link;
  next?: Link;
  prev?: Link;
  first?: Link;
  last?: Link;
  courses?: Link;
};

export type Department = {
  /** ID of the department */
  id: number;
  /** Title of the department */
  title: string;
  /** Slug of the department */
  slug: string;
  /** Description of the department */
  description?: string;
  /** List of courses */
  courses?: Array<Course>;
  /** Created date as ISO 8601 string */
  created?: string;
  /** Updated date as ISO 8601 string */
  updated?: string;
  _links?: Links;
};

export const ALLOWED_SEMESTERS = ['Vor', 'Sumar', 'Haust', 'Heilsárs'] as const;
export type Semester = typeof ALLOWED_SEMESTERS[number];

export type Course = {
  id: number;
  /** Course ID. */
  courseId: string;
  /** Title of the course. */
  title: string;
  /** Units for finishing course. */
  units?: number;
  /** Semester the course is taught. */
  semester?: Semester;
  /** Level of the course. */
  level?: string;
  /** URL to the course. */
  url?: string;
};

export type CourseDb = {
  id: number;
  course_id: string;
  department_id: number;
  title: string;
  units: number;
  semester: Semester;
  level?: string;
  url?: string;
};
