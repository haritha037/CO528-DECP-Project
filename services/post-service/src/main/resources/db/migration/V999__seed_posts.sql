-- V999: Seed sample posts, reactions and comments
-- NOTE: Replace the firebase_uid values below with actual UIDs from your Firebase project.
-- UIDs must match users seeded in user-service V999__seed_data.sql.

-- ── Variables (adjust UIDs to match your Firebase project) ───────────────────
-- ADMIN_UID  : the bootstrap admin created in user-service seed
-- STUDENT_UID: a student account you created via /api/users/register
-- ALUMNI_UID : an alumni account you created via /api/users/register

-- ── Post 1: Admin announcement ───────────────────────────────────────────────
INSERT INTO posts (id, user_id, text_content, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   '84dzuz2yppVeneQ6vFB6Gx4TBUU2',
   'Welcome to the Department Engagement & Career Platform (DECP)! 🎉 This is your central hub for connecting with fellow students, alumni, job opportunities and upcoming events. Feel free to explore and reach out.',
   NOW() - INTERVAL '10 days',
   NOW() - INTERVAL '10 days');

-- ── Post 2: Alumni job tip ────────────────────────────────────────────────────
INSERT INTO posts (id, user_id, text_content, created_at, updated_at) VALUES
  ('a2000000-0000-0000-0000-000000000002',
   'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
   'Pro tip for final-year students: start building your portfolio NOW. I landed my first software engineering role by showcasing three well-documented GitHub projects. Quality > quantity. Happy to answer any questions!',
   NOW() - INTERVAL '7 days',
   NOW() - INTERVAL '7 days');

-- ── Post 3: Student question ─────────────────────────────────────────────────
INSERT INTO posts (id, user_id, text_content, created_at, updated_at) VALUES
  ('a3000000-0000-0000-0000-000000000003',
   'I0Eu70iJhISj3lvhdjBayABLl3z1',
   'Has anyone done an internship at a startup vs a big tech company? What were the key differences in terms of learning and day-to-day work? Looking for honest perspectives before applying this semester.',
   NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '3 days');

-- ── Post 4: Alumni research share ────────────────────────────────────────────
INSERT INTO posts (id, user_id, text_content, created_at, updated_at) VALUES
  ('a4000000-0000-0000-0000-000000000004',
   'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
   'Just published a blog post on microservices patterns that I have been using in production. Topics covered: API Gateway, circuit breakers, event-driven communication with RabbitMQ, and distributed tracing. Reach out if you want the link!',
   NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '1 day');

-- ── Reactions on Post 1 ───────────────────────────────────────────────────────
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'I0Eu70iJhISj3lvhdjBayABLl3z1', 'HEART', NOW() - INTERVAL '9 days'),
  ('a1000000-0000-0000-0000-000000000001', 'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',  'HEART', NOW() - INTERVAL '9 days');

-- ── Reactions on Post 2 ───────────────────────────────────────────────────────
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at) VALUES
  ('a2000000-0000-0000-0000-000000000002', 'I0Eu70iJhISj3lvhdjBayABLl3z1', 'HEART', NOW() - INTERVAL '6 days'),
  ('a2000000-0000-0000-0000-000000000002', '84dzuz2yppVeneQ6vFB6Gx4TBUU2',   'HEART', NOW() - INTERVAL '6 days');

-- ── Reactions on Post 4 ───────────────────────────────────────────────────────
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at) VALUES
  ('a4000000-0000-0000-0000-000000000004', 'I0Eu70iJhISj3lvhdjBayABLl3z1', 'HEART', NOW() - INTERVAL '20 hours'),
  ('a4000000-0000-0000-0000-000000000004', '84dzuz2yppVeneQ6vFB6Gx4TBUU2',   'HEART', NOW() - INTERVAL '20 hours');

-- ── Comment on Post 2 (top-level) ─────────────────────────────────────────────
INSERT INTO post_comments (id, post_id, user_id, parent_id, content, created_at, updated_at) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'a2000000-0000-0000-0000-000000000002',
   'I0Eu70iJhISj3lvhdjBayABLl3z1',
   NULL,
   'This is super helpful, thank you! Would you be willing to review my GitHub portfolio and give some feedback?',
   NOW() - INTERVAL '6 days',
   NOW() - INTERVAL '6 days');

-- ── Reply to comment above ─────────────────────────────────────────────────────
INSERT INTO post_comments (id, post_id, user_id, parent_id, content, created_at, updated_at) VALUES
  ('c2000000-0000-0000-0000-000000000002',
   'a2000000-0000-0000-0000-000000000002',
   'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
   'c1000000-0000-0000-0000-000000000001',
   'Sure! Send me a message through the platform and share your GitHub link. Happy to take a look this weekend.',
   NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '5 days');

-- ── Comment on Post 3 ─────────────────────────────────────────────────────────
INSERT INTO post_comments (id, post_id, user_id, parent_id, content, created_at, updated_at) VALUES
  ('c3000000-0000-0000-0000-000000000003',
   'a3000000-0000-0000-0000-000000000003',
   'G7eLBOP6XCQKoJZ95Ucr5uqeMqR2',
   NULL,
   'Great question! At a startup you get end-to-end ownership very quickly — I was deploying to production in week 2. Big tech has better mentorship programs and structured rotations. Both are valuable for different reasons depending on your goals.',
   NOW() - INTERVAL '2 days',
   NOW() - INTERVAL '2 days');
