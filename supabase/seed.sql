-- =============================================================================
-- WMC seed data (local development only)
-- Demo accounts (password for all: Password123!)
--   admin@wmc.app     – admin
--   ahmed@wmc.app, aisha@wmc.app, omar@wmc.app, fatima@wmc.app, yusuf@wmc.app, sara@wmc.app
-- =============================================================================

-- ---- Countries & cities ----------------------------------------------------------------
insert into public.countries (code, name) values
  ('GB','United Kingdom'),('DE','Germany'),('AE','United Arab Emirates'),('CA','Canada'),
  ('US','United States'),('FR','France'),('NL','Netherlands'),('TR','Türkiye'),('AZ','Azerbaijan')
on conflict (code) do nothing;

insert into public.cities (country_id, name, slug, lat, lng, timezone) values
  ((select id from public.countries where code='GB'),'London','london',51.5074,-0.1278,'Europe/London'),
  ((select id from public.countries where code='DE'),'Berlin','berlin',52.5200,13.4050,'Europe/Berlin'),
  ((select id from public.countries where code='AE'),'Dubai','dubai',25.2048,55.2708,'Asia/Dubai'),
  ((select id from public.countries where code='CA'),'Toronto','toronto',43.6532,-79.3832,'America/Toronto'),
  ((select id from public.countries where code='US'),'New York','new-york',40.7128,-74.0060,'America/New_York'),
  ((select id from public.countries where code='FR'),'Paris','paris',48.8566,2.3522,'Europe/Paris'),
  ((select id from public.countries where code='NL'),'Amsterdam','amsterdam',52.3676,4.9041,'Europe/Amsterdam'),
  ((select id from public.countries where code='TR'),'Istanbul','istanbul',41.0082,28.9784,'Europe/Istanbul'),
  ((select id from public.countries where code='AZ'),'Baku','baku',40.4093,49.8671,'Asia/Baku')
on conflict (slug) do nothing;

-- ---- Interests (mirror packages/shared/src/constants.ts) ------------------------------------
insert into public.interests (slug, name, emoji, sort_order) values
  ('football','Football','⚽',1),('fitness','Fitness','🏋️',2),('running','Running','🏃',3),
  ('travel','Travel','✈️',4),('business','Business','💼',5),('technology','Technology','💻',6),
  ('books','Books','📚',7),('gaming','Gaming','🎮',8),('food','Food','🍽️',9),
  ('photography','Photography','📷',10),('volunteering','Volunteering','🤝',11),
  ('quran','Quran / Islamic studies','📖',12),('family','Family','👨‍👩‍👧',13),('coffee','Coffee','☕',14),
  ('hiking','Hiking','🥾',15),('art','Art & Design','🎨',16),('languages','Languages','🗣️',17),
  ('entrepreneurship','Entrepreneurship','🚀',18)
on conflict (slug) do nothing;

-- ---- Demo auth users ------------------------------------------------------------------------
-- NOTE: inserting into auth.users directly is only for local seeds.
create or replace function pg_temp.seed_user(p_id uuid, p_email text, p_first_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token
  ) values (
    p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', p_first_name), now(), now(), '', ''
  ) on conflict (id) do nothing;
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text, jsonb_build_object('sub', p_id::text, 'email', p_email), 'email', now(), now(), now())
  on conflict do nothing;
end $$;

select pg_temp.seed_user('00000000-0000-0000-0000-00000000a001','admin@wmc.app','Admin');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b001','ahmed@wmc.app','Ahmed');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b002','aisha@wmc.app','Aisha');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b003','omar@wmc.app','Omar');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b004','fatima@wmc.app','Fatima');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b005','yusuf@wmc.app','Yusuf');
select pg_temp.seed_user('00000000-0000-0000-0000-00000000b006','sara@wmc.app','Sara');

-- ---- Profiles ----------------------------------------------------------------------------------
update public.profiles set role='admin', first_name='Admin', onboarding_completed=true,
  city_id=(select id from public.cities where slug='london'), languages='{en}', looking_for='{community}'
  where id='00000000-0000-0000-0000-00000000a001';

update public.profiles set first_name='Ahmed', age=27, gender='male', bio='Marketing guy, new in Berlin. Always up for football or a good coffee.',
  languages='{en,de,tr}', looking_for='{friends,activities,networking}', profession='Marketing',
  city_id=(select id from public.cities where slug='berlin'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b001';
update public.profiles set first_name='Aisha', age=26, gender='female', bio='Designer. Books, photography and long walks.',
  languages='{en,ar}', looking_for='{friends,community}', profession='Designer',
  city_id=(select id from public.cities where slug='berlin'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b002';
update public.profiles set first_name='Omar', age=31, gender='male', bio='Founder. Building things and running on weekends.',
  languages='{en,ar,fr}', looking_for='{networking,activities}', profession='Founder',
  city_id=(select id from public.cities where slug='berlin'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b003';
update public.profiles set first_name='Fatima', age=24, gender='female', bio='Student. Looking for a Quran circle and study buddies.',
  languages='{en,ur}', looking_for='{study,community,friends}', profession='Student',
  city_id=(select id from public.cities where slug='berlin'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b004';
update public.profiles set first_name='Yusuf', age=29, gender='male', bio='Software engineer. Gaming, tech and football.',
  languages='{en,tr}', looking_for='{friends,activities}', profession='Engineer',
  city_id=(select id from public.cities where slug='berlin'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b005';
update public.profiles set first_name='Sara', age=24, gender='female', bio='Just moved to London for my masters.',
  languages='{en,fr}', looking_for='{friends,community}', profession='Student',
  city_id=(select id from public.cities where slug='london'), onboarding_completed=true
  where id='00000000-0000-0000-0000-00000000b006';

insert into public.user_interests (user_id, interest_id)
select u.id, i.id from (values
  ('00000000-0000-0000-0000-00000000b001'::uuid, array['football','business','travel','coffee']),
  ('00000000-0000-0000-0000-00000000b002'::uuid, array['books','photography','art','coffee']),
  ('00000000-0000-0000-0000-00000000b003'::uuid, array['business','running','entrepreneurship','fitness']),
  ('00000000-0000-0000-0000-00000000b004'::uuid, array['quran','books','volunteering','languages']),
  ('00000000-0000-0000-0000-00000000b005'::uuid, array['technology','gaming','football','travel']),
  ('00000000-0000-0000-0000-00000000b006'::uuid, array['books','travel','coffee','volunteering'])
) as u(id, slugs)
join public.interests i on i.slug = any(u.slugs)
on conflict do nothing;

-- ---- Communities ------------------------------------------------------------------------------------
insert into public.communities (id, name, slug, description, city_id, category, owner_id, status, is_featured) values
  ('10000000-0000-0000-0000-000000000001','Berlin Muslims','berlin-muslims','A community for Muslims in Berlin to connect, share opportunities and build a stronger community.',
    (select id from public.cities where slug='berlin'),'general','00000000-0000-0000-0000-00000000a001','approved',true),
  ('10000000-0000-0000-0000-000000000002','Muslim Football Berlin','muslim-football-berlin','Weekly football for all levels. Bring your boots.',
    (select id from public.cities where slug='berlin'),'sports','00000000-0000-0000-0000-00000000b001','approved',false),
  ('10000000-0000-0000-0000-000000000003','Muslim Runners Berlin','muslim-runners-berlin','Weekly running group for Muslims in Berlin.',
    (select id from public.cities where slug='berlin'),'fitness','00000000-0000-0000-0000-00000000b003','approved',false),
  ('10000000-0000-0000-0000-000000000004','Muslim Entrepreneurs Berlin','muslim-entrepreneurs-berlin','Networking, business and opportunities.',
    (select id from public.cities where slug='berlin'),'business','00000000-0000-0000-0000-00000000b003','approved',false),
  ('10000000-0000-0000-0000-000000000005','Muslim Students Berlin','muslim-students-berlin','Study, support and grow together.',
    (select id from public.cities where slug='berlin'),'students','00000000-0000-0000-0000-00000000b004','approved',false),
  ('10000000-0000-0000-0000-000000000006','Muslim Sisters Berlin','muslim-sisters-berlin','A safe space for sisters to connect, learn and support each other.',
    (select id from public.cities where slug='berlin'),'women','00000000-0000-0000-0000-00000000b002','approved',false),
  ('10000000-0000-0000-0000-000000000007','Quran Study Circle Berlin','quran-study-berlin','Weekly Quran study and reflection.',
    (select id from public.cities where slug='berlin'),'islamic_studies','00000000-0000-0000-0000-00000000b004','approved',false),
  ('10000000-0000-0000-0000-000000000008','Muslim Gamers Berlin','muslim-gamers-berlin','LAN nights, FIFA tournaments and more.',
    (select id from public.cities where slug='berlin'),'gaming','00000000-0000-0000-0000-00000000b005','pending',false),
  ('10000000-0000-0000-0000-000000000009','London Muslims','london-muslims','The home for Muslims in London.',
    (select id from public.cities where slug='london'),'general','00000000-0000-0000-0000-00000000a001','approved',true),
  ('10000000-0000-0000-0000-000000000010','Muslim Students London','muslim-students-london','For students across London universities.',
    (select id from public.cities where slug='london'),'students','00000000-0000-0000-0000-00000000b006','approved',false)
on conflict (id) do nothing;

update public.communities set parent_id='10000000-0000-0000-0000-000000000001'
  where id in ('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004',
               '10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000007');

insert into public.community_members (community_id, user_id) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b001'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b002'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b003'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b004'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b005'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b005'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b003'),
  ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-00000000b002'),
  ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-00000000b002'),
  ('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-00000000b006')
on conflict do nothing;

-- ---- Events ----------------------------------------------------------------------------------------------
insert into public.events (id, community_id, creator_id, title, description, category, starts_at, ends_at, location_name, location_address, city_id, max_participants) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b001',
   'Muslim Football Meetup ⚽','Friendly 7-a-side. All levels welcome. Bring water and good energy.','sports',
   date_trunc('day', now()) + interval '2 days 18 hours', date_trunc('day', now()) + interval '2 days 20 hours',
   'Tempelhofer Feld','Tempelhofer Damm, 12101 Berlin',(select id from public.cities where slug='berlin'), 24),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-00000000b004',
   'Quran Study Circle 📖','Weekly reflection on Surah Al-Kahf. Beginners welcome.','islamic_studies',
   date_trunc('day', now()) + interval '3 days 16 hours', null,
   'Neukölln Community Center','Karl-Marx-Straße 100, 12043 Berlin',(select id from public.cities where slug='berlin'), 20),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000a001',
   'Community Iftar 🍽️','Let''s come together for a blessed iftar, meet new people and strengthen our community. Everyone is welcome!','food',
   date_trunc('day', now()) + interval '10 days 19 hours 30 minutes', date_trunc('day', now()) + interval '10 days 21 hours 30 minutes',
   'Al-Noor Mosque','Berlin',(select id from public.cities where slug='berlin'), 120),
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-00000000b003',
   'Coffee & Networking ☕','Founders, freelancers and professionals. Bring a business card or just yourself.','business',
   date_trunc('day', now()) + interval '5 days 10 hours', null,
   'The Barn Café','Schönhauser Allee 8, 10119 Berlin',(select id from public.cities where slug='berlin'), 15),
  ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b003',
   'Saturday Run 🏃','5k easy pace around Tiergarten, then breakfast.','fitness',
   date_trunc('day', now()) + interval '4 days 8 hours', null,
   'Tiergarten (Brandenburg Gate)','Pariser Platz, 10117 Berlin',(select id from public.cities where slug='berlin'), null),
  ('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-00000000b006',
   'Freshers Meet & Greet','New in London? Come meet other Muslim students.','students',
   date_trunc('day', now()) + interval '6 days 17 hours', null,
   'SOAS Main Building','10 Thornhaugh St, London WC1H 0XG',(select id from public.cities where slug='london'), 60)
on conflict (id) do nothing;

insert into public.event_participants (event_id, user_id) values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b005'),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b003'),
  ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b002'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b001'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b002'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b004'),
  ('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-00000000b001')
on conflict do nothing;

-- ---- "Join me" activities ------------------------------------------------------------------------------------
insert into public.activities (id, creator_id, city_id, text, category, happens_at, location_name, max_participants) values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b005',(select id from public.cities where slug='berlin'),
   'Anyone wants to play football tonight? ⚽','sports', date_trunc('day', now()) + interval '19 hours','Görlitzer Park', 10),
  ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b002',(select id from public.cities where slug='berlin'),
   'Coffee after Friday prayer? ☕','social', null,'Sehitlik Mosque area', 6),
  ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b003',(select id from public.cities where slug='berlin'),
   'Looking for people to have dinner tonight 🍽️','food', date_trunc('day', now()) + interval '20 hours','Kreuzberg', 5)
on conflict (id) do nothing;

insert into public.activity_participants (activity_id, user_id) values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b001'),
  ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b001')
on conflict do nothing;

-- ---- Connections & a chat ----------------------------------------------------------------------------------------
insert into public.connections (id, requester_id, addressee_id) values
  ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000b005'),
  ('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000b003','00000000-0000-0000-0000-00000000b001'),
  ('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000b002','00000000-0000-0000-0000-00000000b004')
on conflict do nothing;
update public.connections set status='accepted', responded_at=now() where id='40000000-0000-0000-0000-000000000001';
update public.connections set status='accepted', responded_at=now() where id='40000000-0000-0000-0000-000000000003';

do $$
declare v_conv uuid;
begin
  select c.id into v_conv from public.conversations c
    join public.conversation_participants a on a.conversation_id=c.id and a.user_id='00000000-0000-0000-0000-00000000b001'
    join public.conversation_participants b on b.conversation_id=c.id and b.user_id='00000000-0000-0000-0000-00000000b005'
    where c.type='direct' limit 1;
  if v_conv is not null then
    insert into public.messages (conversation_id, sender_id, content) values
      (v_conv,'00000000-0000-0000-0000-00000000b005','Salam Ahmed! Are you coming to football on Saturday? ⚽'),
      (v_conv,'00000000-0000-0000-0000-00000000b001','Wa alaikum salam! Yes, already joined. See you there.');
  end if;
  select conversation_id into v_conv from public.events where id='20000000-0000-0000-0000-000000000001';
  insert into public.messages (conversation_id, sender_id, content) values
    (v_conv,'00000000-0000-0000-0000-00000000b001','Pitch is booked for 18:00. Please be on time 🙏'),
    (v_conv,'00000000-0000-0000-0000-00000000b003','On my way from Mitte, might be 5 min late.');
end $$;

-- ---- A pending report for the admin demo ---------------------------------------------------------------------------
insert into public.reports (reporter_id, target_type, target_id, reason, details) values
  ('00000000-0000-0000-0000-00000000b004','user','00000000-0000-0000-0000-00000000b005','spam','Keeps sending promotional links.');

-- ---- Retention demo rows --------------------------------------------------------------------------------------------
insert into public.user_daily_activity (user_id, day)
select p.id, d::date from public.profiles p, generate_series(current_date - 6, current_date, interval '1 day') d
where p.id <> '00000000-0000-0000-0000-00000000a001'
on conflict do nothing;
