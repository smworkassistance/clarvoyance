-- ============================================================
-- Clarvoyance v120 — Supabase Schema
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- ============================================================

-- ── modules ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id text PRIMARY KEY,
  name text,
  description text,
  "order" integer,
  active boolean DEFAULT true
);
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON modules FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON modules FOR SELECT TO authenticated USING (true);

INSERT INTO modules (id,name,description,"order",active) VALUES ('tools','Tools','T1-T5 tools for resolving conflicted mind',1,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('chargers','Mind Chargers','Charge your mind into a desired state',2,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('vibe_feed','Vibe Feed','Random cards to shift focus',3,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('quests','Quests','Mood-based guided missions',4,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('revise_repeat','Revise & Repeat','Philosophy, quotes, images',5,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('learning_channels','Learning Channels','Curated links for deeper learning',6,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('non_negotiables','Non-Negotiables','Daily must-do commitments',7,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id,name,description,"order",active) VALUES ('goals','Goals','Current desires to manifest',8,true) ON CONFLICT (id) DO NOTHING;



-- ── charger_categories ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS charger_categories (
  id text PRIMARY KEY,
  name text,
  tagline text,
  icon text,
  "order" integer,
  active boolean DEFAULT true,
  ai_why_this text,
  ai_best_for text,
  ai_how_to_use text
);
ALTER TABLE charger_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON charger_categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON charger_categories FOR SELECT TO authenticated USING (true);

INSERT INTO charger_categories (id,name,tagline,icon,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk ','Monk mode ','Pure being, zero ego','🧘',1,true,'Monk mode  — A state that inspires us to live like a sage: calm, relaxed, happy, simple, and सहज (natural). It nurtures peace, forgiveness, compassion, humility, self-control, contentment, and gentle character. It teaches us to live lightly, without ego, with simplicity, softness, and inner harmony.','Stressful situations, emotional imbalance, overthinking, anger, ego clashes, relationship conflicts, mental pressure, fast-paced lifestyles, and moments when you want inner peace, simplicity, patience, and emotional stability. It helps create a calm, humble, balanced, and joyful way of living.',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_categories (id,name,tagline,icon,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('personality','Personality Development','Design your mind, behavior, and identity consciously','🧠',1,true,'This container helps users consciously develop and strengthen personality traits, mental abilities, emotional qualities, habits, behaviors, communication styles, mindset patterns, and inner states. It can help improve confidence, discipline, memory, focus, punctuality, emotional control, social skills, positivity, courage, calmness, leadership, consistency, and overall character development through awareness, repetition, emotional immersion, reflection, and practical exercises.','Anyone wanting self-improvement, identity transformation, mental strengthening, emotional growth, habit building, better behavior, stronger discipline, sharper memory, improved communication, or conscious personality shaping.','Select a personality trait, habit, mindset, or inner quality you want to develop. Reflect on where it is missing in your life, emotionally connect with that state, repeatedly think and act from it, and practice it consistently through exercises, awareness, repetition, and real-life application until it starts becoming natural.') ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_categories (id,name,tagline,icon,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('confidence','Confidence','Own your power fully','⚡',2,true,'It builds boldness, strong self-belief, powerful thinking, and the attitude of “anything is possible.” It encourages big dreams, big talks, fearless expression, unstoppable energy, and the feeling of being limitless and undefeatable, regardless of situations or opinions of others.','Fear, self-doubt, rejection, competition, leadership, business, public dealing, and situations where you need boldness, confidence, and unstoppable energy.',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_categories (id,name,tagline,icon,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('non_negative','Non-Negative','Zero complaints, zero blame','✨',3,true,'Elaborate on the idea that you don''t want to participate in complaint, blame, stress, worry, fear, frustration, guilt, hopelessness, jealousy, panic, exhaustion, mental chaos, or hurried “habad-dabad” living at any cost. These states drain energy, clarity, peace, and joy. I choose to live consciously, peacefully, positively, and powerfully — not reactively, negatively, or emotionally disturbed.',NULL,NULL) ON CONFLICT (id) DO NOTHING;



-- ── chargers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chargers (
  id text PRIMARY KEY,
  category_id text,
  name text,
  description text,
  icon text,
  type text,
  mood text,
  persist text,
  placeholder text,
  fullscreen text,
  xp integer,
  quest_low text,
  quest_mid text,
  quest_high text,
  "order" text,
  active boolean DEFAULT true,
  ai_why_this text,
  ai_best_for text,
  ai_how_to_use text
);
ALTER TABLE chargers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON chargers FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON chargers FOR SELECT TO authenticated USING (true);

INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_2','Monk ','Forgiveness/Kṣhamā\','Charge into Forgiveness ','🕊️','textarea','all','No','The more you reflect on Forgiveness, the more forgiveness, calmness, softness, and inner peace naturally begin to settle inside you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_3','Monk ','Rectitude/Arjav','Charge into Rectitude','🍃','textarea','all','No',' The more you choose simplicity in thoughts, behavior, speech, and lifestyle, the more peaceful, light, natural, and relaxed you begin to feel from within.
','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_4','Monk ','Compassion ','Charge into compassion','💗','textarea','all','No','Notice where harshness, judgment, anger, or lack of understanding have entered your behavior. The more you develop Daya Bhav — compassion, kindness, and sensitivity toward yourself and others — the softer, calmer, more loving, and emotionally peaceful your inner world becomes.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_5','Monk ','Sama-dama','Charge into Sama-Dama','🎯','textarea','all','No','Observe where your mind becomes restless, reactive, impulsive, or uncontrolled. Sama-Dama  develops inner balance, self-control, discipline, and mastery over thoughts, emotions, desires, and actions. The more you practice it, the more stable, powerful, peaceful, and in control of yourself you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_6','Monk ','Sheel ','Charge into sheel','🌸','textarea','all','No','Notice where roughness, dishonesty, disrespect, or lack of character appear in your behavior. Sheel Bhav develops gentleness, good conduct, humility, respectfulness, and purity in actions and speech. The more you cultivate it, the more graceful, trustworthy, peaceful, and respected you naturally become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_7','Monk ','Contentment','Charge into Contentment','☺️','textarea','all','No','Notice where constant craving, comparison, dissatisfaction, or the feeling of “not enough” disturbs your peace. Contentment develops gratitude, and the ability to feel fulfilled in the present moment. The more you cultivate it, the more peaceful, relaxed, happy, and emotionally free you become.
','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_8','Monk ','Peaceful','Charge into Peace.','🌙','textarea','all','No','Notice where stress, overthinking, emotional reactions, noise, or inner restlessness disturb your mind. Peace develops calmness, silence, patience, and inner stability. The more you cultivate it, the more relaxed, clear-minded, peaceful, and emotionally balanced you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_9','Monk ','Ananda','Charge into Happines.','🌞','textarea','all','No','Notice where sadness, heaviness, negativity, or dependence on external things for happiness has entered your life. Ananda Bhav develops inner joy, lightness, positivity, and the ability to feel happy from within without any reason. The more you cultivate it, the more alive, peaceful, playful, and naturally joyful you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_10','Monk ','Naturalness ','Charge into Naturalness','🪶','textarea','all','No','Notice where force, struggle, overeffort, pretence, or unnatural behavior has entered your life. Naturalness develops naturalness, ease, flow, authenticity, and relaxed living. The more you cultivate it, the more effortless, comfortable, peaceful, and true to yourself you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_11','Monk ','Fluidity','Charge into Fluidity','💦','textarea','all','No','Notice where rigidity, emotional blockage, stubbornness, or heaviness has entered your mind and behavior. Fluidity develops openness, softness, adaptability, and emotional flow. The more you cultivate it, the more light, flexible, relaxed, and emotionally free you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_12','Monk ','Tenderness','Charge into Tenderness','☁️','textarea','all','No','Notice where hardness, pressure, aggression, tension, or forcefulness has entered your nature. Tenderness develops softness, ease, gentleness, relaxation, and a smooth way of living. The more you cultivate it, the more comfortable, peaceful, emotionally light, and easygoing you become.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_13','Monk ','Egolessness/Humility','Charge into Egolessness','🙇','textarea','all','No','Notice where ego, superiority, stubbornness, or the need to always prove yourself creates heaviness in your life. Egolessness develops humility, openness, respect, and the strength to stay grounded. The more you cultivate it, the more peaceful, lovable, flexible, and internally free you become.
','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_2','non_negative','Complaint','I won’t choose constant complaining and dissatisfaction.','🗯️','textarea','all','No','Notice where you constantly complain about people, situations, work, or life instead of peacefully accepting and improving things.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_3','non_negative','Blame','I won’t choose blaming others for my inner state.','☝️','textarea','all','No','Observe where you avoid responsibility and mentally hold others responsible for your pain, anger, or problems.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_4','non_negative','Stress  ','I won’t choose pressure and mental tightness.','🧨','textarea','all','No','Notice where unnecessary pressure, urgency, and mental load have entered your life and disturbed your peace.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_5','non_negative','Worry','I won’t choose worry and fearful thinking.','😵','textarea','all','No','Observe which thoughts about the future repeatedly disturb your peace and create unnecessary fear within you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_6','non_negative','Exhaustion','I won’t choose constant mental and emotional exhaustion.','🥱','textarea','all','No','Notice where overthinking, emotional burden, or imbalance is silently exhausting your energy.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_7','non_negative','Fear','I won’t choose fear controlling my life.','👀','textarea','all','No','Observe where fear, insecurity, hesitation, or nervousness stop you from living freely and naturally.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_8','non_negative','Frustration/Inhibition ','I won’t choose suppressed frustration and irritation.','😖','textarea','all','No','Notice where stuck emotions, unexpressed feelings, or inner suppression are creating heaviness inside you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_9','non_negative','Remorse/Guilt','I won’t choose guilt and self-condemnation.','😔','textarea','all','No','Observe which past actions, mistakes, or memories still create heaviness and self-blame within you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_10','non_negative','Despair/ Hopelessness','I won’t choose negativity and hopeless thinking.','⛈️','textarea','all','No','Notice where you have started expecting bad outcomes, negativity, or disappointment from life.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_11','non_negative','Discouragement','I won’t choose hopelessness and helplessness.','🥀','textarea','all','No','Observe where repeated failures or emotional pain have made you lose inner hope and enthusiasm.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_12','non_negative','Jealousy','I won’t choose comparison and jealousy.','🧪','textarea','all','No','Notice where comparison with others creates insecurity, irritation, or emotional disturbance inside you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_13','non_negative','Panic','I won’t choose anxiety and inner panic.','💨','textarea','all','No','Observe which situations make your mind restless, uneasy, fearful, or emotionally unstable.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_14','non_negative','Restlessness','I won’t choose rushed and chaotic living.','⏳','textarea','all','No','Notice where unnecessary hurry, pressure, and fast-paced living are disconnecting you from peace and awareness.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_15','non_negative','Agitation','I won’t choose constant inner noise and disturbance.','🥁','textarea','all','No','Observe where mental noise, emotional turbulence, and inner restlessness keep disturbing your clarity and calmness.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_16','non_negative','Anger','I won’t choose anger and emotional reactions.','🌋','textarea','all','No','Notice where irritation, emotional reactions, and aggression repeatedly disturb your peace and relationships.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_17','non_negative','Ego','I won’t choose ego and superiority.','🦚','textarea','all','No','Observe where the need to prove yourself, dominate, or always be right creates conflict and inner tension.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_18','non_negative','Overthinking','I won’t choose unnecessary mental clutter.','🕸️','textarea','all','No','Notice where repetitive thoughts, analysis, and mental loops are stealing your peace and presence.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_19','non_negative','Emotional Reactivity','I won’t choose emotional impulsiveness.','⚡','textarea','all','No','Observe where small situations instantly disturb your emotions, reactions, behavior, or peace of mind.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_20','non_negative','Mental Heaviness','I won’t choose carrying emotional burden.','🪨','textarea','all','No','Notice what unresolved emotions, memories, attachments, or negativity are creating heaviness within you.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_2','confidence','Boldness','I choose to act boldly instead of shrinking myself.','🐅','textarea','all','No','Notice where fear, hesitation, or overthinking stop you from taking strong action in life.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_3','confidence','Strong Self-Belief','I choose to trust myself and my abilities.','🛡️','textarea','all','No','Observe where self-doubt, insecurity, or dependence on others weakens your confidence.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_4','confidence','Powerful Thinking','I choose empowering and limitless thinking.','♟️','textarea','all','No','Notice where small thinking, negativity, or limitation-based thoughts reduce your potential.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_5','confidence','“Anything is Possible” Attitude','I choose possibility over limitation.','🚀','textarea','all','No','Observe where you have mentally accepted something as impossible before even trying fully.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_6','confidence','Big Dreams','I choose to think and dream beyond limitations.','🌌','textarea','all','No','Notice where fear of failure or society’s opinions have made your vision smaller.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_7','confidence','Big Talks','I choose confident and powerful expression.','🎙️','textarea','all','No','Observe where you suppress your voice or avoid expressing yourself boldly.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_8','confidence','Fearless Expression','I choose fearless communication and authenticity.','🦅','textarea','all','No','Notice where fear of judgment or rejection stops you from speaking openly and naturally.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_9','confidence','Unstoppable Energy','I choose movement, action, and momentum.','🔥','textarea','all','No','Observe where laziness, fear, emotional heaviness, or excuses stop your progress.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_10','confidence','Feeling Limitless','I choose to live beyond mental boundaries.','♾️','textarea','all','No','Notice where you unnecessarily define yourself as weak, incapable, or limited.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_11','confidence','Undefeatable Mindset','I choose resilience regardless of situations or opinions.','🏔️','textarea','all','No','Observe where criticism, rejection, failures, or external situations easily break your confidence.','yes',15,NULL,NULL,NULL,NULL,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('conf_1','confidence','I Am Confident','Charge into total confidence','⚡','textarea','all','No','Start writing as that fully confident version of you...','yes',15,'Write one confident thing','Tell a story where you owned the room','Write your most powerful confident version',1,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('Monk_1','Monk ','Pure Presence','Charge into complete inner peace','🧘','textarea','all','No','Write from the place of pure being...','yes',15,'Describe one moment of peace','Write about being free of ego','Describe your highest self',1,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('nn_1','non_negative','Zero Complaints','Charge into a no-complaint state','✨','textarea','all','No','Write as someone who sees only solutions...','yes',15,'Write one thing you stopped complaining about','Choose solution over blame','Write your zero-complaint day',1,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_1','personality','Powerful Memory','Strengthen memory, recall ability, mental sharpness, and information retention.','🧠','textarea','all','No','Recall details, visualize clearly, and train your brain to remember powerfully.','yes',15,'Memorize 5 things consciously','Recall yesterday in detail','Practice deep memory visualization',1,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_2','personality','I Am Confident','Charge into total confidence, boldness, and self-belief.','⚡','textarea','all','No','Start writing as that fully confident version of yourself.','yes',15,'Write one confident thing about yourself','Tell a story where you owned the moment','Write your most powerful confident identity',2,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_3','personality','Fearless Courage','Develop courage to face fear, discomfort, rejection, and uncertainty.','🦁','textarea','high','No','What would you do right now if fear disappeared completely?','yes',18,'Face one small fear today','Write your biggest avoided action','Visualize yourself acting fearlessly',3,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_4','personality','Financial Awareness','Build money consciousness, smart financial thinking, and wealth awareness.','💰','textarea','mid','No','Observe your financial habits, decisions, spending, and thinking patterns.','yes',20,'Track one unnecessary expense','Write your financial goals clearly','Create your wealthy mindset identity',4,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_5','personality','Punctuality & Time Management','Develop discipline, respect for time, consistency, and organized execution.','⏰','checklist','mid','No','Observe where time leakage, delay, laziness, or disorganization happens daily.','yes',18,'Complete one task on time','Follow a planned schedule today','Execute your day with full discipline',5,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_6','personality','Stress Tolerance / Sahansheel','Increase emotional capacity, patience, resilience, and pressure-handling ability.','🪨','textarea','high','No','Stay stable, calm, and strong even when situations become difficult.','yes',20,'Handle one irritation calmly','Observe emotional reactions consciously','Remain peaceful during pressure situations',6,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_7','personality','Powerful Communication','Improve expression, clarity, confidence, influence, and speaking ability.','🎙️','textarea','all','No','Speak clearly, naturally, confidently, and without hesitation.','yes',18,'Start one confident conversation','Express one thought clearly','Practice powerful communication consciously',7,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_8','personality','Social Intelligence','Understand people, emotions, social dynamics, and human behavior better.','🤝','textarea','mid','No','Observe how people think, react, communicate, and emotionally behave.','yes',20,'Observe one social interaction deeply','Understand someone without judging','Improve one social skill consciously',8,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_9','personality','Calmness Under Pressure','Stay mentally clear, emotionally stable, and relaxed during pressure or chaos.','🌙','textarea','high','No','Slow your mind and remain calm even during intense situations.','yes',22,'Stay calm during one stressful moment','Observe pressure without panic','Maintain total calmness under challenge',9,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO chargers (id,category_id,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,ai_why_this,ai_best_for,ai_how_to_use) VALUES ('pd_10','personality','Reactions pre-decided','Decide and charge your reactions in advance.','🫧','textarea','all','no','Deciding and practicing reactions in advance, makes them natural in difficult situations, we mostly do this training unconsciously, lets do this consciously.','yes',NULL,NULL,NULL,NULL,10,true,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;



-- ── charger_rules ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charger_rules (
  id integer PRIMARY KEY,
  rule text,
  "order" integer,
  active boolean DEFAULT true
);
ALTER TABLE charger_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON charger_rules FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON charger_rules FOR SELECT TO authenticated USING (true);

INSERT INTO charger_rules (id,rule,"order",active) VALUES (1,'Big Talk— go big, no limits',1,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_rules (id,rule,"order",active) VALUES (2,'Real or fake story — feeling matters not truth',2,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_rules (id,rule,"order",active) VALUES (3,'Be childish and kiddish — bypass your critical mind',3,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_rules (id,rule,"order",active) VALUES (4,'Speak while you write — vary your tone',4,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_rules (id,rule,"order",active) VALUES (5,'Use movements and gestures — body anchors the state',5,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO charger_rules (id,rule,"order",active) VALUES (6,'Assume you are already there — write from inside the state',6,true) ON CONFLICT (id) DO NOTHING;



-- ── tools ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
  id text PRIMARY KEY,
  code text,
  name text,
  description text,
  icon text,
  type text,
  mood text,
  persist text,
  placeholder text,
  fullscreen text,
  xp integer,
  quest_low text,
  quest_mid text,
  quest_high text,
  "order" integer,
  active boolean DEFAULT true,
  category text,
  timer text
);
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON tools FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON tools FOR SELECT TO authenticated USING (true);

INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t1','T1','All Is Well','Train the mind to see goodness, abundance, and positivity everywhere.','✨','textarea','low','No','“The world is good, people are good, everything is perfect as it is.”','yes',10,'Write 10 good things around you','See goodness in difficult situations','Live 1 hour without negativity',1,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t2','T2','Q&A Self Discussion','Talk with yourself deeply to gain clarity and self-understanding.','💭','textarea','mid','No','Ask yourself honest questions and answer deeply.','yes',15,'Ask 3 honest questions','Resolve one confusion','Deep self-analysis session',2,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t3','T3','Melting','Melt emotional heaviness, ego, anger, and inner resistance.','🫠','textarea','high','No','Let all hardness inside you melt softly.','yes',15,'Relax body consciously','Melt one emotional block','Fully soften inner resistance',3,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t4','T4','Manifestational Furnace','Intensely charge the mind with desired reality and identity.','🔥','textarea','high','No','Burn old limitations and install new reality.','yes',20,'Visualize desired state','Feel it emotionally','Full identity immersion',4,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t6','T6','Celebration Dance','Play music and dance with total freedom and madness.
Jump, move, laugh, spin — fully enjoy the moment.
Be committed to making your present-moment bliss bigger than your "dukkha".
Dance so intensely that joy overpowers your pain, heaviness, and sadness.
Hold nothing back.
Leave not even a drop of suppressed emotion inside.
Keep dancing until you feel lighter, freer, and filled with "ananda".','💃','textarea','low','No',NULL,'yes',12,'Dance for 1 minute','Celebrate without reason','Total joyful release',6,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t7','T7','Emphatic Affirmations','Choose an affirmation like:
"Everything is working out for me."

Now speak it by deeply elongating every word:

“Eveeeryyythiiing… iiisss… wooorkiiinggg… ouuuttt… fooorrr… meeee…”

Stretch the words slowly until your breath naturally finishes.
Relax. Breathe gently. Then repeat.

Don’t force or strain yourself.
Be soft, aware, and gentle with your voice and breath — not harsh.

Continue until the affirmation starts feeling emotionally real inside you.','📣','textarea','high','No',NULL,'yes',20,'Repeat 10 times','Feel every word deeply','Full emotional embodiment',7,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t8','T8','Appreciation Chain','Verbally appreciate things out loud — not silently in your mind.

Start with the objects around you:
your chair, walls, fan, phone, clothes, table, light, water — anything you can see.

Notice and appreciate their qualities, usefulness, presence, beauty, design, or the role they play in your life.

Keep the appreciation chain going continuously, one thing after another, until you feel genuinely emotionally uplifted and lighter from within.','🌸','textarea','low','No',NULL,'yes',12,'Write 5 appreciations','Appreciate difficult things','15-minute appreciation flow',8,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t9','T9','Childish / Kiddish','Become like a carefree 4-year-old child again.

Run, jump, dance, laugh, make silly movements and playful sounds without caring how you look.

Forget your present worries for a while and simply play like you did in childhood — free, innocent, shameless, and alive.

Continue until you feel lighter and joyful from within.','🧸','textarea','low','No',NULL,'yes',10,'Do something silly','Laugh freely','Full playful immersion',9,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t10','T10','Singing (Changing Tones)','Sing freely without worrying about sounding good.

Change tones, exaggerate words, make funny sounds, and sing playfully like a carefree child.

Be expressive, shameless, and fully uninhibited.

Continue until you feel lighter, freer, and more alive.','🎤','textarea','mid','No',NULL,'yes',12,'Sing softly','Experiment with tones','Emotional voice transformation',10,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t11','T11','Shaking','Shake your entire body freely — hands, legs, shoulders, chest, hips, neck, every part of it.

Let the movement loosen physical stress, restlessness, heaviness, and stored tension from the body.

Keep your body relaxed while shaking.
Don’t force, overdo, or hurt yourself.

Continue until your body feels lighter, freer, and more relaxed.','⚡','textarea','high','No','Shake your body and release all tension.','yes',15,'Shake for 30 seconds','Full body shaking','Emotional release session',11,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t12','T12','Tonal Change','Change your voice, tones, and sounds playfully.

Speak like a child, a cartoon, a dramatic character, or in any funny or unusual way that naturally comes to you.

This simple practice helps shift you out of your current mood, mental state, or emotional heaviness.

Keep it light and playful.
Don’t strain, force, or overdo your voice.','🎭','textarea','mid','No','Speak like your most powerful self.','yes',12,'Change speaking tone','Practice empowered speech','Identity tone shift',12,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t13','T13','Mindless Talk','## 🤪 Mindless Talk

Speak funny, exaggerated, overconfident nonsense out loud without worrying whether it makes sense or not.

Say dramatic and ridiculous things about your goals, dreams, ambitions, or life like:

> “I’ll achieve my goals at rocket speed!”
> “My future is so bright people will need sunglasses around me!”

Be expressive, playful, energetic, and completely uninhibited.

This practice helps break mental stiffness, over-seriousness, and emotional heaviness by making your mind loose and playful again.
','🍯','textarea','low','No','Talk gently like warmth and softness.','yes',10,'Speak softly for 5 mins','Melt emotional tension','Deep softness practice',13,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t14','T14','Speak Your Heart','Emotionally open up and release suppressed feelings safely.','😭','textarea','high','No','Cry and express openly without suppression.','yes',18,'Express hidden feelings','Emotional unloading','Deep cathartic release',14,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t15','T15','Curse out','Release suppressed anger and emotional pressure consciously.','🌋','textarea','high','No','Safely vent out emotional intensity.','yes',15,'Express irritation honestly','Release emotional pressure','Complete anger discharge',15,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t16','T16','Immortal / Invincible','Enter a fearless, unstoppable, undefeatable mindset.','🛡️','textarea','high','No','Nothing can break me. I am unstoppable.','yes',25,'Repeat power statements','Walk fearlessly','Full invincible embodiment',16,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t17','T17','Write MDG(Major definite goal) 100 Times','Deep repetition to install a thought into subconscious.','✍️','textarea','mid','No','Repeat and install deeply through writing.','yes',15,'Write 10 times','Write 50 times','Write 100 times consciously',17,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t18','T18','Resolve Issues','Face problems directly and find clear solutions calmly.','🧩','textarea','mid','No','Stop avoiding. Understand and solve clearly.','yes',18,'Identify one issue','Find possible solutions','Full emotional + practical resolution',18,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t19','T19','Guidance from Inner Self','Access inner wisdom, intuition, and clarity.','🪞','textarea','low','No','Ask your deeper self for guidance honestly.','yes',20,'Ask one deep question','Listen silently','Receive inner clarity session',19,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t20','T20','Hand Chart','Use the hand chart apply it on your issues.','✋','textarea','low','No','Use handchart''s wisdom to uplift yourself and your vibe. ','no',8,'Mark emotional state','Observe patterns','Deep awareness tracking',20,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t21','T21','Reverse Appreciation','Appreciate problems, pain, and difficult situations consciously.','🔄','textarea','high','No','Find hidden value in difficulties and pain.','yes',22,'Appreciate one problem','Reframe emotional pain','Transform resistance completely',21,true,'Mental Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t22','T22','Micro movements','Slowly move the parts of your body that feel stressed, tight, or restless.

Make the movements so tiny and subtle that they are barely visible — only you should be able to feel them.

Gently explore small rotations, shifts, twitches, or movements without force.

This practice helps release hidden physical tension and brings calm awareness back into the body.','💧','textarea','all','no','Doing micro movements balances your entire nervous system.','yes',10,NULL,NULL,NULL,22,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO tools (id,code,name,description,icon,type,mood,persist,placeholder,fullscreen,xp,quest_low,quest_mid,quest_high,"order",active,category,timer) VALUES ('t23','T23','Think Out Loud','Verbally discuss your thoughts, issues, questions, and life with yourself — out loud, not silently in your mind.

Say whatever is coming to your mind.
Don’t try to filter, hide, or control your thoughts.

Say even the things you cannot say to anyone else in this world — but say them honestly to yourself.

Ask yourself questions, respond honestly, and let the conversation flow naturally.

This practice helps you process emotions, organize thoughts, and feel mentally lighter and clearer.','🗣️','textarea','all','No',NULL,'yes',22,NULL,NULL,NULL,23,true,'Physical Reset',NULL) ON CONFLICT (id) DO NOTHING;



-- ── vibe_cards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_cards (
  id text PRIMARY KEY,
  type text,
  title text,
  content text,
  placeholder text,
  timer integer,
  xp integer,
  icon text,
  category text,
  active boolean DEFAULT true
);
ALTER TABLE vibe_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON vibe_cards FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON vibe_cards FOR SELECT TO authenticated USING (true);

INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('b1','BREATHING','Box Breath','Breathe in slowly through your nose for 4 counts. Hold for 4. Breathe out through your mouth for 4. Hold empty for 4. Repeat this 4 times.',NULL,64,10,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('b2','BREATHING','Slow Release','Take the slowest breath you have ever taken — breathe in for 8 full seconds. Hold for 1. Then breathe out even slower, for 10 seconds. Do this 3 times.',NULL,60,10,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('b3','BREATHING','Belly Breath','Put one hand on your belly. Breathe in through your nose — let your belly push your hand out. Your chest should barely move. Hold 2 seconds. Breathe out fully. Repeat 5 times.',NULL,55,10,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('b4','BREATHING','Candle Breath','Breathe in through your nose for 4 seconds. Now breathe out through your mouth slowly — like you are gently blowing out a candle across the room. Make the exhale last 6 to 8 seconds. Do this 5 times.',NULL,65,10,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('b5','BREATHING','Full Reset','Empty your lungs first — breathe all the way out, squeeze out every last bit. Now breathe in fully until you can hold no more. Breathe out slowly. 5 complete cycles.',NULL,60,10,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m1','MOVEMENT','Shoulder Roll Release','Roll your shoulders backwards — slowly and fully — 8 times. Then forwards 8 times. Then gently tilt your head to the left, hold 3 seconds, then right. Feel the tension leaving your body.',NULL,40,8,'🙆',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m2','MOVEMENT','Power Shake','Stand up. Start shaking your hands. Then your arms. Then your whole body — shake everything, like you are shaking off all stress and heavy feelings. Keep going for 30 full seconds.',NULL,35,8,'🤸',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m3','MOVEMENT','Sky Reach','Stand tall, feet shoulder-width apart. Breathe in and reach both arms up as high as you can — stretch your whole body upward. Hold 3 seconds at the top. Breathe out as you lower them. Do this 8 times.',NULL,55,8,'🙌',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m4','MOVEMENT','Energy Clap','Clap your hands firmly together 10 times. Then rub your palms fast against each other for 5 seconds — back and forth quickly. Feel the warmth and energy build up. Press your warm palms gently over your closed eyes.',NULL,30,8,'👏',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m5','MOVEMENT','Mindful Walk','Walk slowly to any open space. Take one step every second — feel each foot touch the ground completely. Walk in a circle or straight and back. Stay fully present with each step. 30 seconds total.',NULL,35,8,'🚶',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m6','MOVEMENT','Jump Reset','Jump lightly up and down 20 times. Not high — just enough to leave the ground. Shake your hands at the same time. Let everything in your body loosen up and wake up.',NULL,30,8,'⬆️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m7','MOVEMENT','Hip Circle','Stand feet shoulder-width apart, hands on hips. Move your hips in a big slow circle — like drawing a hula hoop in the air. 5 circles to the left, 5 circles to the right. Keep your upper body relaxed.',NULL,40,8,'🔄',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('m8','MOVEMENT','Spine Twist','Sit straight or stand. Breathe in. As you breathe out, gently twist your body to the right — turn your head to look behind you. Hold 3 seconds. Come back to centre. Repeat left. 4 times each side.',NULL,50,8,'🌀',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a1','AFFIRMATION',NULL,'__NICK__, you are capable of far more than you have shown the world yet.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a2','AFFIRMATION',NULL,'__NICK__, you are not behind. You are on your path — and your path is perfectly on time.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a3','AFFIRMATION',NULL,'Every single day, __NICK__ is becoming stronger, clearer, and more aligned with their purpose.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a4','AFFIRMATION',NULL,'__NICK__, your desires are real and they are valid. You are allowed to want everything you want.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a5','AFFIRMATION',NULL,'Right now, something in the universe is actively working in __NICK__''s favour — even if it is invisible.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a6','AFFIRMATION',NULL,'__NICK__ does not need to be perfect to deserve a beautiful life. You deserve it right now, exactly as you are.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a7','AFFIRMATION',NULL,'__NICK__, you are a rare kind of person — one who chooses to grow. That single choice changes everything.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a8','AFFIRMATION',NULL,'Abundance flows naturally and easily to __NICK__. There is always more than enough.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a9','AFFIRMATION',NULL,'__NICK__, you are loved — by people who matter, and by the life that keeps showing up for you.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a10','AFFIRMATION',NULL,'Every version of __NICK__ that ever tried and failed brought you exactly here. That is not failure. That is the path.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a11','AFFIRMATION',NULL,'__NICK__, your mind is your most powerful asset. You are using it on purpose, right now.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('a12','AFFIRMATION',NULL,'The best chapter of __NICK__''s life is the one being written today.',NULL,15,4,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w1','WRITING',NULL,'Write down 3 things you are genuinely grateful for right now. Make them specific — not "family" but who exactly, and why.','I am grateful for...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w2','WRITING',NULL,'What is one thing you have been pretending not to know? Write it down honestly — no one is reading this but you.','The truth I keep avoiding is...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w3','WRITING',NULL,'Describe tomorrow in full detail — wake up, what you feel, what you do. Make it feel real as you write it.','Tomorrow I wake up and...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w4','WRITING',NULL,'What would you do this week if you had zero fear of anyone''s judgment? Write it all.','Without any fear of judgment, I would...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w5','WRITING',NULL,'Write a short letter to yourself from your future self — the version of you who already has everything you want. What do they want you to know?','Dear present me...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w6','WRITING',NULL,'What has been your single biggest win in the last 7 days? It does not have to be big to the world — just real to you.','My win this week was...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w7','WRITING',NULL,'Name one belief about yourself that has held you back. Now write the opposite — the true version you choose to believe instead.','Old belief: I am...
New truth: I am...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w8','WRITING',NULL,'If money, time, and other people''s opinions did not exist as limits — what would your life actually look like?','My life would look like...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w9','WRITING',NULL,'Who is one person who has made your life genuinely better? Write what they gave you and what you would want them to know.','They gave me...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w10','WRITING',NULL,'What old story about yourself are you finally ready to put down? Write it — then write the new story you choose.','The old story was...
The new story is...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w11','WRITING',NULL,'Name three specific things about your body or health that you are genuinely grateful for right now.','My body gives me...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('w12','WRITING',NULL,'What is one thing you keep postponing that you know you need to do? Write it. Then write one small step you could take today.','I keep postponing...
One step I can take today...',0,7,NULL,NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('br_1','BREATHING','Physiological Sigh','Take 2 quick inhales through your nose — one deep, one small top-up inhale. Then exhale slowly through your mouth until fully empty. Repeat 3 times. Instantly calms stress and resets the nervous system.','Let the long exhale melt pressure out of your body.',40,15,'🌬️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('br_2','BREATHING','Alternate Nostril Breath','Close your right nostril and breathe in slowly through the left. Switch sides and breathe out through the right. Inhale right, exhale left. Continue slowly for 30 seconds. Balances mind and emotions quickly.','Slow down and balance your inner state.',40,18,'☯️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('br_3','BREATHING','Humming Calm','Breathe in deeply through your nose. As you exhale, hum softly like “mmmmmmm.” Feel the vibration in your face and chest. Repeat 5 times. The vibration naturally calms anxiety and overthinking.','Let the vibration relax your nervous system.',40,15,'🎶',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('br_4','BREATHING','Coherent Breath','Breathe in slowly for 5 seconds. Breathe out slowly for 5 seconds. Keep the rhythm smooth and relaxed for 1 minute. This stabilizes emotions and creates mental clarity.','Match your breath into a calm steady rhythm.',40,12,'🌊',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('mv_1','MOVEMENT','Warrior Stance','Stand tall with chest open, feet grounded, shoulders back. Hold a strong confident posture while breathing slowly for 30 seconds. Your body teaches your mind strength and confidence.','Stand like someone nothing can shake.',40,18,'🦁',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('mv_2','MOVEMENT','Chest Expansion','Interlock your fingers behind your back. Open your chest fully and lift slightly upward while breathing deeply. Hold 5 seconds. Repeat 5 times. Releases emotional tightness and improves confidence instantly.','Open your body and release inner tightness.',40,15,'☀️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('mv_3','MOVEMENT','Grounding Press','Press both feet firmly into the floor. Feel the ground supporting your entire body. Breathe slowly and focus only on the pressure under your feet for 30 seconds. Helps stop panic and mental chaos.','Return your awareness into your body and the ground.',40,15,'🌍',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('mv_4','MOVEMENT','Palm Heart Hold','Place one hand on your chest and one on your belly. Breathe slowly and feel the warmth of your own hands. Stay here for 30 seconds. Creates emotional safety and nervous system calmness.','Let your body feel safe and supported.',40,12,'🤍',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('md_1','MIND','5-4-3-2-1 Reset','Look around and name 5 things you see, 4 things you can touch, 3 sounds you hear, 2 things you smell, and 1 thing you taste. Pulls the mind out of panic and into the present moment.','Bring your attention fully into the present.',40,18,'👁️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('md_2','MIND','Observer Mode','Sit still for 30 seconds and simply watch your thoughts without fighting them. Don’t judge, react, or follow them. Just observe. This creates separation between you and mental noise.','You are the observer, not every thought.',40,20,'🪞',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('md_3','MIND','Name The Feeling','Pause and honestly name what you are feeling right now: anger, fear, stress, sadness, pressure, jealousy, exhaustion. Naming emotions reduces their unconscious control over you.','What exactly are you feeling right now?',30,15,'🏷️',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('en_1','ENERGY','Victory Walk','Walk slowly like someone who has already won in life. Head up, chest open, relaxed face, steady breathing. Your movement changes your emotional state instantly.','Walk like your most powerful self.',30,18,'🚶',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('en_2','ENERGY','Lion’s Breath','Breathe in deeply through your nose. Open your mouth wide, stick out your tongue, and exhale forcefully with a loud “haaa.” Repeat 5 times. Releases built-up tension and emotional pressure.','Release all inner pressure outward.',40,15,'🐯',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('em_1','EMOTIONAL','Gratitude Flood','Rapidly think of 10 things you are grateful for — no matter how small. Keep going without stopping. Gratitude quickly shifts emotional state and softens negativity.','Keep finding more things to appreciate.',40,15,'🌸',NULL,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO vibe_cards (id,type,title,content,placeholder,timer,xp,icon,category,active) VALUES ('em_2','EMOTIONAL','Inner Child Comfort','Imagine speaking to yourself like a loving best friend would. Softly reassure, support, and comfort yourself for 30 seconds. Creates emotional healing and safety.','Speak to yourself gently and lovingly.',40,15,'🧸',NULL,true) ON CONFLICT (id) DO NOTHING;



-- ── quotes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id integer PRIMARY KEY,
  quote text,
  author text,
  category text,
  "order" integer,
  active boolean DEFAULT true,
  action text,
  ai_why_this text,
  ai_best_for text,
  ai_how_to_use text
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON quotes FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON quotes FOR SELECT TO authenticated USING (true);

INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (1,'Your emotions are your guidance system.','Abraham Hicks','vibration',1,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (201,'The way you feel is your point of attraction.','Abraham Hicks','vibration',1,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (2,'What you focus on expands in your life.','Abraham Hicks','vibration',2,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (202,'A belief is just a thought you keep thinking.','Abraham Hicks','mindset',2,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (3,'Alignment creates effortless manifestations.','Abraham Hicks','vibration',3,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (203,'You cannot have a happy ending to an unhappy journey.','Abraham Hicks','alignment',3,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (4,'You attract what matches your vibration.','Abraham Hicks','vibration',4,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (5,'Appreciation shifts your entire reality.','Abraham Hicks','vibration',5,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (6,'Feeling good is a powerful form of success.','Abraham Hicks','vibration',6,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (7,'Resistance blocks natural abundance.','Abraham Hicks','vibration',7,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (8,'The universe responds to your energy.','Abraham Hicks','vibration',8,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (9,'Joy is your natural state.','Abraham Hicks','vibration',9,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (10,'Relaxation allows desires to flow easily.','Abraham Hicks','vibration',10,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (11,'Assume the feeling of the wish fulfilled.','Neville Goddard','mindset',11,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (12,'Imagination creates reality.','Neville Goddard','mindset',12,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (13,'Your inner world shapes the outer world.','Neville Goddard','mindset',13,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (14,'Persist in the state you desire.','Neville Goddard','mindset',14,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (15,'Consciousness is the only reality.','Neville Goddard','mindset',15,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (16,'Live mentally from the end result.','Neville Goddard','mindset',16,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (17,'Faith is loyalty to unseen reality.','Neville Goddard','mindset',17,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (18,'Your assumptions harden into facts.','Neville Goddard','mindset',18,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (19,'You become what you repeatedly imagine.','Neville Goddard','mindset',19,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (20,'Change self-concept and life changes.','Neville Goddard','mindset',20,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (21,'Your subconscious accepts repeated beliefs.','Joseph Murphy','subconscious',21,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (22,'Thoughts impress the subconscious mind.','Joseph Murphy','subconscious',22,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (23,'Peaceful thinking creates peaceful living.','Joseph Murphy','subconscious',23,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (24,'Faith dissolves fear and limitation.','Joseph Murphy','subconscious',24,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (25,'Your mind attracts corresponding conditions.','Joseph Murphy','subconscious',25,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (26,'Gratitude multiplies abundance.','Joseph Murphy','subconscious',26,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (27,'Mental pictures influence reality.','Joseph Murphy','subconscious',27,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (28,'Inner harmony creates outer success.','Joseph Murphy','subconscious',28,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (29,'What you believe deeply manifests outwardly.','Joseph Murphy','subconscious',29,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (30,'Confidence activates hidden potential.','Joseph Murphy','subconscious',30,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (31,'Words carry creative power.','Florence Scovel Shinn','faith',31,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (32,'Expectation opens the door to miracles.','Florence Scovel Shinn','faith',32,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (33,'Faith moves unseen forces into action.','Florence Scovel Shinn','faith',33,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (34,'Divine timing works perfectly.','Florence Scovel Shinn','faith',34,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (35,'Fear blocks natural blessings.','Florence Scovel Shinn','faith',35,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (36,'Speak only what you want to grow.','Florence Scovel Shinn','faith',36,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (37,'Life responds to clear intentions.','Florence Scovel Shinn','faith',37,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (38,'Trust transforms struggle into ease.','Florence Scovel Shinn','faith',38,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (39,'Gratitude attracts unexpected opportunities.','Florence Scovel Shinn','faith',39,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (40,'Right thinking produces right results.','Florence Scovel Shinn','faith',40,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (41,'Reality reflects your inner state.','Vadim Zeland','reality',41,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (42,'Importance creates unnecessary resistance.','Vadim Zeland','reality',42,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (43,'Move calmly toward desired reality.','Vadim Zeland','reality',43,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (44,'Balance appears when attachment disappears.','Vadim Zeland','reality',44,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (45,'Choose your reality consciously.','Vadim Zeland','reality',45,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (46,'Energy follows focused attention.','Vadim Zeland','reality',46,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (47,'Inner freedom changes external circumstances.','Vadim Zeland','reality',47,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (48,'The world mirrors your dominant energy.','Vadim Zeland','reality',48,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (49,'Let go of excessive emotional charge.','Vadim Zeland','reality',49,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (50,'Clarity weakens destructive pendulums.','Vadim Zeland','reality',50,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (51,'Follow your highest excitement.','Bashar','alignment',51,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (52,'Excitement is your compass.','Bashar','alignment',52,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (53,'Act without insisting on outcomes.','Bashar','alignment',53,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (54,'Your frequency determines your experience.','Bashar','alignment',54,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (55,'Fear disappears through authentic action.','Bashar','alignment',55,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (56,'Passion aligns you with opportunities.','Bashar','alignment',56,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (57,'Be fully yourself without apology.','Bashar','alignment',57,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (58,'Synchronicity follows aligned living.','Bashar','alignment',58,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (59,'Every moment offers a new choice.','Bashar','alignment',59,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (60,'Excitement connects you to your true path.','Bashar','alignment',60,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (61,'Change your personality to change your reality.','Joe Dispenza','transformation',61,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (62,'Meditation rewires the brain.','Joe Dispenza','transformation',62,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (63,'Elevated emotions create transformation.','Joe Dispenza','transformation',63,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (64,'Thoughts become neurological patterns.','Joe Dispenza','transformation',64,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (65,'Healing begins with inner coherence.','Joe Dispenza','transformation',65,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (66,'A new future requires a new mindset.','Joe Dispenza','transformation',66,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (67,'Your body follows repeated emotions.','Joe Dispenza','transformation',67,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (68,'Awareness breaks unconscious habits.','Joe Dispenza','transformation',68,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (69,'Energy and attention shape experience.','Joe Dispenza','transformation',69,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (70,'Consistent inner work changes external life.','Joe Dispenza','transformation',70,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (71,'Your emotions are your guidance system.','Abraham Hicks','vibration',71,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (72,'What you focus on expands in your life.','Abraham Hicks','vibration',72,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (73,'Alignment creates effortless manifestations.','Abraham Hicks','vibration',73,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (74,'You attract what matches your vibration.','Abraham Hicks','vibration',74,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (75,'Appreciation shifts your entire reality.','Abraham Hicks','vibration',75,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (76,'Feeling good is a powerful form of success.','Abraham Hicks','vibration',76,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (77,'Resistance blocks natural abundance.','Abraham Hicks','vibration',77,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (78,'The universe responds to your energy.','Abraham Hicks','vibration',78,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (79,'Joy is your natural state.','Abraham Hicks','vibration',79,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (80,'Relaxation allows desires to flow easily.','Abraham Hicks','vibration',80,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (81,'Assume the feeling of the wish fulfilled.','Neville Goddard','mindset',81,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (82,'Imagination creates reality.','Neville Goddard','mindset',82,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (83,'Your inner world shapes the outer world.','Neville Goddard','mindset',83,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (84,'Persist in the state you desire.','Neville Goddard','mindset',84,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (85,'Consciousness is the only reality.','Neville Goddard','mindset',85,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (86,'Live mentally from the end result.','Neville Goddard','mindset',86,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (87,'Faith is loyalty to unseen reality.','Neville Goddard','mindset',87,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (88,'Your assumptions harden into facts.','Neville Goddard','mindset',88,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (89,'You become what you repeatedly imagine.','Neville Goddard','mindset',89,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (90,'Change self-concept and life changes.','Neville Goddard','mindset',90,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (91,'Your subconscious accepts repeated beliefs.','Joseph Murphy','subconscious',91,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (92,'Thoughts impress the subconscious mind.','Joseph Murphy','subconscious',92,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (93,'Peaceful thinking creates peaceful living.','Joseph Murphy','subconscious',93,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (94,'Faith dissolves fear and limitation.','Joseph Murphy','subconscious',94,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (95,'Your mind attracts corresponding conditions.','Joseph Murphy','subconscious',95,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (96,'Gratitude multiplies abundance.','Joseph Murphy','subconscious',96,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (97,'Mental pictures influence reality.','Joseph Murphy','subconscious',97,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (98,'Inner harmony creates outer success.','Joseph Murphy','subconscious',98,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (99,'What you believe deeply manifests outwardly.','Joseph Murphy','subconscious',99,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (100,'Confidence activates hidden potential.','Joseph Murphy','subconscious',100,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (101,'Words carry creative power.','Florence Scovel Shinn','faith',101,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (102,'Expectation opens the door to miracles.','Florence Scovel Shinn','faith',102,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (103,'Faith moves unseen forces into action.','Florence Scovel Shinn','faith',103,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (104,'Divine timing works perfectly.','Florence Scovel Shinn','faith',104,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (105,'Fear blocks natural blessings.','Florence Scovel Shinn','faith',105,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (106,'Speak only what you want to grow.','Florence Scovel Shinn','faith',106,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (107,'Life responds to clear intentions.','Florence Scovel Shinn','faith',107,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (108,'Trust transforms struggle into ease.','Florence Scovel Shinn','faith',108,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (109,'Gratitude attracts unexpected opportunities.','Florence Scovel Shinn','faith',109,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (110,'Right thinking produces right results.','Florence Scovel Shinn','faith',110,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (111,'Reality reflects your inner state.','Vadim Zeland','reality',111,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (112,'Importance creates unnecessary resistance.','Vadim Zeland','reality',112,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (113,'Move calmly toward desired reality.','Vadim Zeland','reality',113,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (114,'Balance appears when attachment disappears.','Vadim Zeland','reality',114,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (115,'Choose your reality consciously.','Vadim Zeland','reality',115,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (116,'Energy follows focused attention.','Vadim Zeland','reality',116,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (117,'Inner freedom changes external circumstances.','Vadim Zeland','reality',117,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (118,'The world mirrors your dominant energy.','Vadim Zeland','reality',118,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (119,'Let go of excessive emotional charge.','Vadim Zeland','reality',119,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (120,'Clarity weakens destructive pendulums.','Vadim Zeland','reality',120,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (121,'Follow your highest excitement.','Bashar','alignment',121,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (122,'Excitement is your compass.','Bashar','alignment',122,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (123,'Act without insisting on outcomes.','Bashar','alignment',123,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (124,'Your frequency determines your experience.','Bashar','alignment',124,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (125,'Fear disappears through authentic action.','Bashar','alignment',125,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (126,'Passion aligns you with opportunities.','Bashar','alignment',126,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (127,'Be fully yourself without apology.','Bashar','alignment',127,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (128,'Synchronicity follows aligned living.','Bashar','alignment',128,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (129,'Every moment offers a new choice.','Bashar','alignment',129,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (130,'Excitement connects you to your true path.','Bashar','alignment',130,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (131,'Change your personality to change your reality.','Joe Dispenza','transformation',131,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (132,'Meditation rewires the brain.','Joe Dispenza','transformation',132,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (133,'Elevated emotions create transformation.','Joe Dispenza','transformation',133,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (134,'Thoughts become neurological patterns.','Joe Dispenza','transformation',134,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (135,'Healing begins with inner coherence.','Joe Dispenza','transformation',135,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (136,'A new future requires a new mindset.','Joe Dispenza','transformation',136,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (137,'Your body follows repeated emotions.','Joe Dispenza','transformation',137,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (138,'Awareness breaks unconscious habits.','Joe Dispenza','transformation',138,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (139,'Energy and attention shape experience.','Joe Dispenza','transformation',139,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (140,'Consistent inner work changes external life.','Joe Dispenza','transformation',140,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (141,'Your emotions are your guidance system.','Abraham Hicks','vibration',141,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (142,'What you focus on expands in your life.','Abraham Hicks','vibration',142,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (143,'Alignment creates effortless manifestations.','Abraham Hicks','vibration',143,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (144,'You attract what matches your vibration.','Abraham Hicks','vibration',144,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (145,'Appreciation shifts your entire reality.','Abraham Hicks','vibration',145,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (146,'Feeling good is a powerful form of success.','Abraham Hicks','vibration',146,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (147,'Resistance blocks natural abundance.','Abraham Hicks','vibration',147,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (148,'The universe responds to your energy.','Abraham Hicks','vibration',148,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (149,'Joy is your natural state.','Abraham Hicks','vibration',149,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (150,'Relaxation allows desires to flow easily.','Abraham Hicks','vibration',150,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (151,'Assume the feeling of the wish fulfilled.','Neville Goddard','mindset',151,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (152,'Imagination creates reality.','Neville Goddard','mindset',152,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (153,'Your inner world shapes the outer world.','Neville Goddard','mindset',153,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (154,'Persist in the state you desire.','Neville Goddard','mindset',154,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (155,'Consciousness is the only reality.','Neville Goddard','mindset',155,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (156,'Live mentally from the end result.','Neville Goddard','mindset',156,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (157,'Faith is loyalty to unseen reality.','Neville Goddard','mindset',157,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (158,'Your assumptions harden into facts.','Neville Goddard','mindset',158,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (159,'You become what you repeatedly imagine.','Neville Goddard','mindset',159,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (160,'Change self-concept and life changes.','Neville Goddard','mindset',160,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (161,'Your subconscious accepts repeated beliefs.','Joseph Murphy','subconscious',161,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (162,'Thoughts impress the subconscious mind.','Joseph Murphy','subconscious',162,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (163,'Peaceful thinking creates peaceful living.','Joseph Murphy','subconscious',163,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (164,'Faith dissolves fear and limitation.','Joseph Murphy','subconscious',164,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (165,'Your mind attracts corresponding conditions.','Joseph Murphy','subconscious',165,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (166,'Gratitude multiplies abundance.','Joseph Murphy','subconscious',166,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (167,'Mental pictures influence reality.','Joseph Murphy','subconscious',167,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (168,'Inner harmony creates outer success.','Joseph Murphy','subconscious',168,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (169,'What you believe deeply manifests outwardly.','Joseph Murphy','subconscious',169,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (170,'Confidence activates hidden potential.','Joseph Murphy','subconscious',170,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (171,'Words carry creative power.','Florence Scovel Shinn','faith',171,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (172,'Expectation opens the door to miracles.','Florence Scovel Shinn','faith',172,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (173,'Faith moves unseen forces into action.','Florence Scovel Shinn','faith',173,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (174,'Divine timing works perfectly.','Florence Scovel Shinn','faith',174,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (175,'Fear blocks natural blessings.','Florence Scovel Shinn','faith',175,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (176,'Speak only what you want to grow.','Florence Scovel Shinn','faith',176,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (177,'Life responds to clear intentions.','Florence Scovel Shinn','faith',177,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (178,'Trust transforms struggle into ease.','Florence Scovel Shinn','faith',178,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (179,'Gratitude attracts unexpected opportunities.','Florence Scovel Shinn','faith',179,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (180,'Right thinking produces right results.','Florence Scovel Shinn','faith',180,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (181,'Reality reflects your inner state.','Vadim Zeland','reality',181,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (182,'Importance creates unnecessary resistance.','Vadim Zeland','reality',182,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (183,'Move calmly toward desired reality.','Vadim Zeland','reality',183,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (184,'Balance appears when attachment disappears.','Vadim Zeland','reality',184,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (185,'Choose your reality consciously.','Vadim Zeland','reality',185,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (186,'Energy follows focused attention.','Vadim Zeland','reality',186,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (187,'Inner freedom changes external circumstances.','Vadim Zeland','reality',187,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (188,'The world mirrors your dominant energy.','Vadim Zeland','reality',188,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (189,'Let go of excessive emotional charge.','Vadim Zeland','reality',189,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (190,'Clarity weakens destructive pendulums.','Vadim Zeland','reality',190,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (191,'Follow your highest excitement.','Bashar','alignment',191,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (192,'Excitement is your compass.','Bashar','alignment',192,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (193,'Act without insisting on outcomes.','Bashar','alignment',193,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (194,'Your frequency determines your experience.','Bashar','alignment',194,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (195,'Fear disappears through authentic action.','Bashar','alignment',195,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (196,'Passion aligns you with opportunities.','Bashar','alignment',196,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (197,'Be fully yourself without apology.','Bashar','alignment',197,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (198,'Synchronicity follows aligned living.','Bashar','alignment',198,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (199,'Every moment offers a new choice.','Bashar','alignment',199,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO quotes (id,quote,author,category,"order",active,action,ai_why_this,ai_best_for,ai_how_to_use) VALUES (200,'Excitement connects you to your true path.','Bashar','alignment',200,true,NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;



-- ── revise_repeat ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revise_repeat (
  id integer PRIMARY KEY,
  title text,
  content text,
  image_url text,
  type text,
  "order" integer,
  active boolean DEFAULT true
);
ALTER TABLE revise_repeat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON revise_repeat FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON revise_repeat FOR SELECT TO authenticated USING (true);

INSERT INTO revise_repeat (id,title,content,image_url,type,"order",active) VALUES (1,'Feelings Attract Reality','How you feel is what you broadcast. Reality matches that broadcast.',NULL,'philosophy',1,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO revise_repeat (id,title,content,image_url,type,"order",active) VALUES (2,'The Vortex','Everything you want is already in your vortex. Align through feeling.',NULL,'philosophy',2,true) ON CONFLICT (id) DO NOTHING;



-- ── learning_channels ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_channels (
  id integer PRIMARY KEY,
  name text,
  url text,
  description text,
  category text,
  "order" integer,
  active boolean DEFAULT true
);
ALTER TABLE learning_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON learning_channels FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON learning_channels FOR SELECT TO authenticated USING (true);

INSERT INTO learning_channels (id,name,url,description,category,"order",active) VALUES (1,'Abraham Hicks Official','https://www.youtube.com/@AbrahamHicks','Original LOA teachings','LOA',1,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO learning_channels (id,name,url,description,category,"order",active) VALUES (2,'Neville Goddard','https://www.youtube.com/@NevilleGoddardLectures','Manifestation through imagination','Manifestation',2,true) ON CONFLICT (id) DO NOTHING;



-- ── ai_context ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_context (
  "key" text PRIMARY KEY,
  content text
);
ALTER TABLE ai_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON ai_context FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON ai_context FOR SELECT TO authenticated USING (true);

INSERT INTO ai_context ("key",content) VALUES ('identity','You are CLAR — a compassionate AI life guide designed to help people become their best selves. You are not a therapist. You are warm, wise, non-judgmental, and deeply practical.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('core_belief','Feelings are the most important signal in a person''s life. They indicate the vibration a person is currently in — and they are the point of attraction. If a person feels good, they attract good. If they feel bad, they attract bad. Helping someone take charge of how they feel is the most powerful thing you can do for them.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('mission','CLAR exists to help people shift from feeling stuck in what they don''t want — to moving powerfully toward what they do want. This happens by helping them gain the right perspective on life''s challenges, and by giving them practical tools to take charge of their thoughts and feelings.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('response_approach','1. Always acknowledge how the user is feeling — never dismiss it. 2. Help them see their situation from a better-feeling perspective. 3. Offer a CLAR tool that fits their current need. 4. Always leave them feeling more empowered than when they arrived. Never give generic advice, lecture, or make someone feel judged.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('tool_categories','Mood Shifters: in-the-moment exercises to shift how someone feels right now. Chargers: mindset exercises to move into a desired mental state. Perspective Quotes: short powerful truths that shift how someone sees a situation. Goal Focus Tools: tools to keep users moving toward what they want.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('disclaimer','CLAR is a supportive guide, not a licensed therapist, doctor, or professional advisor. For major life decisions — financial, medical, legal, or relationship — always consult a qualified professional. CLAR helps you feel better and think clearer, but the decisions in your life are always yours to make. Never act on CLAR''s suggestions alone when the stakes are high.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('core_philosophy','Feelings are vibrational indicators. What you feel = what you attract (Law of Attraction). Contrast (unwanted experience) automatically births desire and sends it to the Vortex. The Vortex is vibrational reality where all desires are already fulfilled by Source. User ka kaam sirf allow karna hai — resistance hataana. Resistance = contradictory thought (want it but doubt it). Alignment = feeling good = close to Source = desires flowing in. Path of least resistance = ease over force, flow over struggle.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('emotional_scale','22-level scale. High (1-6): Joy, Love, Appreciation, Enthusiasm, Positive Expectation, Optimism, Hope — aligned, attracting well. Mid (7-12): Contentment, Boredom, Pessimism, Frustration, Overwhelm, Disappointment — transitioning. Low (13-22): Doubt, Worry, Blame, Discouragement, Anger, Revenge, Hatred, Jealousy, Insecurity, Fear, Grief, Despair — resistant, blocking desires. Rule: never try to jump from Fear to Joy. Move one step at a time. Anger is better than Grief. Hope is better than Pessimism.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('contrast_handling','When user shares pain, struggle, failure, or unwanted situation — this is contrast. Contrast is not bad. It is the engine of clarity. First acknowledge the feeling. Then gently ask or reflect: "So what does this tell you about what you DO want?" This pivot question redirects energy from problem to desire. Never dismiss contrast. Never rush past it. It is sacred — it is how desires are born.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('tool_philosophy','Each CLAR tool maps to a specific vibrational need. Manifestation Mode = user wants to get into the Vortex, clarify desire, feel it as real. Self Discussion = user is in contrast, needs to pivot, process thoughts. God-Universe Discussion = user needs to surrender, trust, allow — let go of control. Non-Doing Rest = user is pushing too hard, needs path of least resistance, pure release. Slow-Soft-Swift = user is ready for inspired action — gentle, aligned, effortless steps forward.') ON CONFLICT ("key") DO NOTHING;
INSERT INTO ai_context ("key",content) VALUES ('clar_response_rule','When user shares a feeling — locate them on the emotional scale first (internally). Then respond from that awareness. If they are at Fear/Grief (22-19) — only comfort, no tools yet. If at Frustration/Worry (10-14) — gently introduce perspective shift. If at Hope/Optimism (5-6) — tools and momentum building. If at Enthusiasm/Joy (1-3) — celebrate, amplify, channel into goals. Never suggest a tool that requires higher vibration than user currently has.') ON CONFLICT ("key") DO NOTHING;



-- ── manifestation_steps ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS manifestation_steps (
  id text PRIMARY KEY,
  "order" integer,
  phase integer,
  title text,
  why text,
  prompt text,
  quick boolean DEFAULT true,
  active boolean DEFAULT true
);
ALTER TABLE manifestation_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON manifestation_steps FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON manifestation_steps FOR SELECT TO authenticated USING (true);

INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('major-goal',1,1,'Major Goal','Anchors the entire session. The universe responds to specificity — vague intentions yield vague results.','State your goal in present tense, as if it is already real. Be specific. Be bold. Write it like tomorrow''s headline.',true,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('intentions',2,1,'Intentions','Intention is the direction — the goal is the destination. Setting your intention aligns your energy before the journey begins.','What do you intend to feel, become, and embody as you receive this? Write your intentions clearly.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('project',3,1,'Project','The universe responds to those already in motion. Treating it as an active project collapses the gap between now and then.','What are you already doing as someone who has this? What moves are you making? Write like the project is live right now.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('giving',4,1,'Ask in Form of Giving','Giving generates feeling — receiving has no energy on its own. When you ask through giving, you activate abundance not lack. Receiving only has value when you spend it.','When this is real — what will you give, share, create, or do because of it? Pour it all out. Write from generosity.',true,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('end-feeling',5,2,'End Feeling','The feeling of the wish fulfilled is the magnet. Not the words — the feeling. Emotion is the language of the subconscious.','How does it feel right now to already have this? Write from inside that feeling. Present tense. Full emotion. No holding back.',true,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('blessings',6,2,'Blessings / Feelingwise','Speaking from the future as prophecy programs your identity to match your desired reality. Badi badi baate from your future self pull you forward.','Speak your blessings. Go big. Write what your future self says about how this came to be. Blessings. Prophecy. Bhavishya wani.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('time-length',7,2,'Time Length','The universe needs a container. Time anchors the manifestation into the physical — it signals commitment and readiness, not hope.','How long until this is fully real? Set your timeline. Write it as a fact, not a wish. Own the timeframe.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('deadlines',8,2,'Deadlines / Clarity Dates','Clarity creates urgency. A specific date makes it real in your nervous system — it shifts you from dreaming mode to deciding mode.','Write the exact date this is done. Then write one concrete action you will take today towards it.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('dictate',9,3,'Dictate','Direct declaration collapses the distance. No softness. No asking. No hoping. Commanding from certainty — direct fire, no mercy.','Dictate this into existence. Direct. First person. No mercy. Start with I AM and keep going without stopping.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('pure-abundance',10,3,'Pure Abundance','24 carat gold energy. Scripting from total overflow — not from lack, not from hope. 1000% abundance. Everything already yours.','Write from pure abundance. Total 1000%. Everything is already yours. No limits. No conditions. Pour it all out.',false,true) ON CONFLICT (id) DO NOTHING;
INSERT INTO manifestation_steps (id,"order",phase,title,why,prompt,quick,active) VALUES ('rampage',11,3,'RAMPAGE','Momentum is the method. Each statement builds on the last until it becomes undeniable. You cannot accept that this cannot happen. You are worthy beyond measures.','I cannot accept that this cannot happen. I am worthy beyond measures. Start your rampage — rapid fire, line by line, no stopping, build the wave until you feel it.',true,true) ON CONFLICT (id) DO NOTHING;



-- ============================================================
-- Done. All 11 content tables created and populated.
-- ============================================================
