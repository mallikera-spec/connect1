-- SQL Script to manually reset ANY user's password
-- This script should be run in the Supabase SQL Editor

-- 1. Ensure pgcrypto is available for hashing
-- This extension provides the crypt() and gen_salt() functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update the password for the target user
-- REPLACE 'target@email.com' with the user's email
-- REPLACE 'new_password_here' with the desired password
UPDATE auth.users
SET 
  encrypted_password = crypt('new_password_here', gen_salt('bf')),
  updated_at = now(),
  recovery_token = '',
  last_sign_in_at = null
WHERE email = 'target@email.com';

-- 3. Verify the update (optional)
-- SELECT id, email FROM auth.users WHERE email = 'target@email.com';
