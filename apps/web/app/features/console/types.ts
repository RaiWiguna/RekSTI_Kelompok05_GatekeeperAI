export type ResourceKey =
  | "users"
  | "students"
  | "lecturers"
  | "rooms"
  | "devices"
  | "courses"
  | "classes"
  | "schedules"
  | "enrollments";

export type ResourceItem = Record<string, unknown>;
export type ResourceStore = Record<ResourceKey, ResourceItem[]>;
export type ResourceForms = Record<ResourceKey, Record<string, string>>;

export type LecturerClassSchedule = {
  schedule_id: string;
  day_of_week: string;
  start_date?: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  source: string;
};

export type LecturerClassCard = {
  class_id: string;
  class_code: string;
  semester: string;
  academic_year: string;
  lecturer: {
    id: string;
    nidn: string;
    full_name: string;
  };
  course: {
    id: string;
    code: string;
    name: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  schedules: LecturerClassSchedule[];
  enrollments_count: number;
  present_count?: number;
  absent_count?: number;
};

export type LecturerTodayClass = LecturerClassCard & {
  date: string;
};

export type LecturerManagedClass = LecturerClassCard;

export type LecturerClassRoster = {
  class_id: string;
  class_code: string;
  semester: string;
  academic_year: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  lecturer: {
    id: string;
    user_id?: string | null;
    full_name: string;
    nidn: string;
  };
  students: Array<{
    enrollment_id: string;
    status: string;
    student: {
      id: string;
      nim: string;
      full_name: string;
      status: string;
    };
  }>;
};

export type Option = {
  label: string;
  value: string;
};

export type ResourceField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "password" | "select";
  options?: Option[];
  getOptions?: (store: ResourceStore) => Option[];
};

export type ResourceColumn = {
  key: string;
  label: string;
  render: (item: ResourceItem) => string;
};

export type ResourceConfig = {
  key: ResourceKey;
  title: string;
  singularLabel: string;
  endpoint: string;
  query?: Record<string, string>;
  refreshTargets?: ResourceKey[];
  buildPayload?: (values: Record<string, string>) => Record<string, string>;
  fields: ResourceField[];
  columns: ResourceColumn[];
  emptyMessage: string;
  deleteActionLabel?: string;
  createTitle?: string;
  updateTitle?: string;
  formHelp?: string;
};
