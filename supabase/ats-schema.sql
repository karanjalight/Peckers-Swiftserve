-- =========================
-- ENUMS
-- =========================

create type availability_status as enum (
  'immediately',
  'after_2_weeks',
  'after_4_weeks'
);

create type employment_type_enum as enum (
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary'
);

create type job_status_enum as enum (
  'open',
  'closed',
  'paused'
);

create type application_status_enum as enum (
  'applied',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'hired',
  'rejected'
);

create type document_type_enum as enum (
  'good_conduct',
  'form_4_certificate',
  'id_photo',
  'cv',
  'other'
);

-- =========================
-- APPLICANTS
-- =========================

create table applicants (
  id uuid primary key default gen_random_uuid(),

  -- Personal info
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  email varchar(150) unique,
  phone varchar(30) not null,
  id_number varchar(50) unique,

  gender varchar(20),
  date_of_birth date,
  location text,

  -- Availability
  availability availability_status not null,

  -- Device access
  has_smartphone boolean default false,
  has_laptop boolean default false,

  -- Skills and experience
  extra_skills text,
  years_of_experience int,

  -- Status flags
  shortlisted boolean default false,
  verified boolean default false,
  active boolean default true,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================
-- JOBS
-- =========================

create table jobs (
  id uuid primary key default gen_random_uuid(),

  job_code varchar(30) unique not null,
  title varchar(150) not null,
  department varchar(100),
  description text,
  location text,

  employment_type employment_type_enum not null,
  status job_status_enum default 'open',

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================
-- JOB APPLICATIONS
-- =========================

create table job_applications (
  id uuid primary key default gen_random_uuid(),

  applicant_id uuid not null references applicants(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,

  status application_status_enum default 'applied',
  notes text,

  applied_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (applicant_id, job_id)
);

-- =========================
-- APPLICANT DOCUMENTS
-- =========================

create table applicant_documents (
  id uuid primary key default gen_random_uuid(),

  applicant_id uuid references applicants(id) on delete cascade,
  document_type document_type_enum not null,
  file_url text not null,

  uploaded_at timestamp with time zone default now()
);

-- =========================
-- APPLICANT SKILLS
-- =========================

create table applicant_skills (
  id uuid primary key default gen_random_uuid(),

  applicant_id uuid references applicants(id) on delete cascade,

  skill_name varchar(100) not null,
  proficiency varchar(50)
    check (proficiency in ('beginner','intermediate','expert')),

  years int,

  created_at timestamp with time zone default now()
);

-- =========================
-- JOB REQUIREMENTS
-- =========================

create table job_requirements (
  id uuid primary key default gen_random_uuid(),

  job_id uuid references jobs(id) on delete cascade,

  skill_name varchar(100) not null,
  min_years int,
  required boolean default true
);
