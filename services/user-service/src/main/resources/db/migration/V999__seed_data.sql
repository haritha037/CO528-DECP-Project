-- Seed admin user
-- IMPORTANT: Replace REPLACE_WITH_ACTUAL_FIREBASE_UID with the real Firebase UID
-- from your Firebase Console → Authentication → Users tab.
-- The admin user must be created in Firebase first (via POST /api/users/register or manually).
INSERT INTO users (firebase_uid, email, name, role, department, is_profile_complete)
VALUES (
    '84dzuz2yppVeneQ6vFB6Gx4TBUU2',
    'admin@decp.com',
    'System Admin',
    'ADMIN',
    'Computer Engineering',
    true
) ON CONFLICT (firebase_uid) DO NOTHING;
