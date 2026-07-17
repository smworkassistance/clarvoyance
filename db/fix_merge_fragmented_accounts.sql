-- ═══════════════════════════════════════════════════════════════════
-- One-time data repair — NOT a schema change, no app version bump needed.
-- Run once in the Supabase SQL Editor.
--
-- Context: the same real user ended up split across 4 disconnected
-- Supabase accounts (root cause fixed in app v159), so their vision
-- images (user_goals.vis_images) and Revise & Repeat images
-- (user_revise.rr_images) got scattered — some devices had 18 images,
-- others 6, etc. This merges the images from all 4 accounts (deduped
-- by URL) and writes the SAME complete set back into all 4 rows, so
-- whichever account a given device happens to be signed into, it now
-- sees everything. It does NOT touch goal text, NN, chat, or any other
-- field — those can't be merged the same way and are left untouched.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Merge user_revise.rr_images across the 4 accounts
WITH target_ids AS (
  SELECT unnest(ARRAY[
    '648e108c-5349-4f0e-a8af-d96246fab3c6',
    'abb87d15-6751-483c-88ae-8b89f05c452c',
    'e17e5639-0d50-4ce6-8021-8161bb9c0a30',
    'e58abd1b-58a5-4b09-b0ac-0b260a67ddf0'
  ]::uuid[]) AS user_id
),
all_rr_images AS (
  SELECT DISTINCT ON (img->>'src') img
  FROM user_revise ur
  JOIN target_ids t ON t.user_id = ur.user_id
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ur.rr_images, '[]'::jsonb)) AS img
  WHERE img->>'src' IS NOT NULL AND img->>'src' <> ''
  ORDER BY img->>'src'
),
merged_rr AS (
  SELECT COALESCE(jsonb_agg(img), '[]'::jsonb) AS merged_images FROM all_rr_images
)
UPDATE user_revise
SET rr_images = (SELECT merged_images FROM merged_rr), updated_at = now()
WHERE user_id IN (SELECT user_id FROM target_ids);

-- 2. Merge user_goals.vis_images across the same 4 accounts
WITH target_ids AS (
  SELECT unnest(ARRAY[
    '648e108c-5349-4f0e-a8af-d96246fab3c6',
    'abb87d15-6751-483c-88ae-8b89f05c452c',
    'e17e5639-0d50-4ce6-8021-8161bb9c0a30',
    'e58abd1b-58a5-4b09-b0ac-0b260a67ddf0'
  ]::uuid[]) AS user_id
),
all_vis_images AS (
  SELECT DISTINCT ON (img->>'src') img
  FROM user_goals ug
  JOIN target_ids t ON t.user_id = ug.user_id
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ug.vis_images, '[]'::jsonb)) AS img
  WHERE img->>'src' IS NOT NULL AND img->>'src' <> ''
  ORDER BY img->>'src'
),
merged_vis AS (
  SELECT COALESCE(jsonb_agg(img), '[]'::jsonb) AS merged_images FROM all_vis_images
)
UPDATE user_goals
SET vis_images = (SELECT merged_images FROM merged_vis), updated_at = now()
WHERE user_id IN (SELECT user_id FROM target_ids);

-- 3. Verify — both queries should now show identical vis_images / rr_images
--    across all 4 rows (only the goal text / other fields will still differ)
SELECT user_id, vis_images FROM user_goals WHERE user_id IN (
  '648e108c-5349-4f0e-a8af-d96246fab3c6',
  'abb87d15-6751-483c-88ae-8b89f05c452c',
  'e17e5639-0d50-4ce6-8021-8161bb9c0a30',
  'e58abd1b-58a5-4b09-b0ac-0b260a67ddf0'
);

SELECT user_id, rr_images FROM user_revise WHERE user_id IN (
  '648e108c-5349-4f0e-a8af-d96246fab3c6',
  'abb87d15-6751-483c-88ae-8b89f05c452c',
  'e17e5639-0d50-4ce6-8021-8161bb9c0a30',
  'e58abd1b-58a5-4b09-b0ac-0b260a67ddf0'
);
