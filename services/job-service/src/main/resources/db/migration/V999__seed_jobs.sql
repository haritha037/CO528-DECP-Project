-- V999: Seed sample job postings
-- Replace Firebase UIDs with actual UIDs from your project.
-- ALUMNI_UID and ADMIN_UID must match users in user-service seed data.

INSERT INTO jobs (id, posted_by, title, company, description, job_type, location, is_remote, salary_range, requirements, application_deadline, application_link, status, created_at, updated_at) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
  'Software Engineering Intern',
  'TechCorp Lanka',
  'We are looking for a motivated Software Engineering intern to join our backend team for a 3-month summer internship. You will work on real production systems, participate in code reviews, and collaborate with senior engineers. Great opportunity to apply your university knowledge in a professional setting.',
  'INTERNSHIP',
  'Colombo, Sri Lanka',
  false,
  'LKR 40,000 – 60,000 / month',
  'Pursuing a degree in Computer Science or related field. Knowledge of Java or Python. Familiarity with REST APIs. Good communication skills.',
  CURRENT_DATE + INTERVAL '30 days',
  'https://techcorplanka.com/careers/se-intern',
  'ACTIVE',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'b2000000-0000-0000-0000-000000000002',
  'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
  'Junior Full-Stack Developer',
  'InnovateSL',
  'Join our growing product team as a Junior Full-Stack Developer. You will build and maintain web applications using React and Spring Boot. We offer mentorship, flexible hours, and a collaborative environment.',
  'FULL_TIME',
  'Kandy, Sri Lanka',
  true,
  'LKR 120,000 – 180,000 / month',
  'Bachelor''s degree in CS or equivalent. 0–2 years of experience with React and Java/Spring Boot. Understanding of SQL databases.',
  CURRENT_DATE + INTERVAL '45 days',
  'https://innovatesl.com/jobs/junior-fullstack',
  'ACTIVE',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  'b3000000-0000-0000-0000-000000000003',
  '84dzuz2yppVeneQ6vFB6Gx4TBUU2',
  'Research Assistant — Machine Learning',
  'University Department of Computer Engineering',
  'The department is seeking a part-time Research Assistant to support ongoing machine learning research projects. Responsibilities include data collection, preprocessing, model training, and result analysis. Opportunity to co-author publications.',
  'PART_TIME',
  'University Campus',
  false,
  'LKR 25,000 / month',
  'Final year or postgraduate student. Strong Python skills. Experience with PyTorch or TensorFlow. Interest in ML research.',
  CURRENT_DATE + INTERVAL '14 days',
  'mailto:research@dept.university.edu',
  'ACTIVE',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  'b4000000-0000-0000-0000-000000000004',
  'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
  'DevOps Engineer (Contract)',
  'CloudSystems Pvt Ltd',
  'We need a contract DevOps engineer for a 6-month cloud migration project. You will be responsible for setting up CI/CD pipelines, managing Kubernetes clusters on GCP, and ensuring zero-downtime deployments.',
  'CONTRACT',
  'Remote',
  true,
  'LKR 300,000 – 400,000 / month',
  '3+ years of DevOps experience. Proficiency with Docker, Kubernetes, and Terraform. GCP or AWS certification preferred.',
  CURRENT_DATE + INTERVAL '7 days',
  'https://cloudsystems.lk/devops-contract',
  'ACTIVE',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);
