-- Fix: grant SELECT on all content tables to anon + authenticated roles
GRANT SELECT ON modules TO anon, authenticated;
GRANT SELECT ON charger_categories TO anon, authenticated;
GRANT SELECT ON chargers TO anon, authenticated;
GRANT SELECT ON charger_rules TO anon, authenticated;
GRANT SELECT ON tools TO anon, authenticated;
GRANT SELECT ON vibe_cards TO anon, authenticated;
GRANT SELECT ON quotes TO anon, authenticated;
GRANT SELECT ON revise_repeat TO anon, authenticated;
GRANT SELECT ON learning_channels TO anon, authenticated;
GRANT SELECT ON ai_context TO anon, authenticated;
GRANT SELECT ON manifestation_steps TO anon, authenticated;
