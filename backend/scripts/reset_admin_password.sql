-- SQL Script to manually reset the admin password
-- This script should be run in the Supabase SQL Editor

-- 1. Ensure pgcrypto is available for hashing
-- This extension provides the crypt() and gen_salt() functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the password for the admin user
-- REPLACE 'your_new_password_here' with the actual password you want to set
-- email: admin@argosmob.com
UPDATE auth.users
SET 
  encrypted_password = crypt('your_new_password_here', gen_salt('bf')),
  updated_at = now(),
  recovery_token = '',
  last_sign_in_at = null
WHERE email = 'admin@argosmob.com';

-- 3. Verify the update
-- SELECT id, email, encrypted_password FROM auth.users WHERE email = 'admin@argosmob.com';
