-- WMC database smoke test. Run against a freshly seeded local database.
-- Statements labelled 'must fail' are expected to raise an error.
\set ON_ERROR_STOP off
\echo '--- counts'
select (select count(*) from profiles) users, (select count(*) from communities) communities, (select count(*) from events) events,
       (select count(*) from activities) activities, (select count(*) from conversations) convs, (select count(*) from messages) msgs,
       (select count(*) from notifications) notifs, (select count(*) from community_members) members;
\echo '--- member_count / participant_count triggers'
select name, member_count from communities order by member_count desc limit 3;
select title, participant_count, max_participants from events order by participant_count desc limit 3;

\echo '--- act as Ahmed (authenticated)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b001',false);
select set_config('request.jwt.claim.role','authenticated',false);
\echo '--- location column must NOT exist on profiles (must fail)'
select location from profiles limit 1;
\echo '--- but the rest is'
select id, first_name, city_id from profiles where id = auth.uid();
\echo '--- discover_people'
select first_name, age, city_name, shared_interests, shared_languages, shared_goals, score, compatibility, distance_label, connection_status, connection_direction from discover_people(10,0);
\echo '--- home_summary / onboarding_summary'
select * from home_summary(); select * from onboarding_summary();
\echo '--- my_conversations'
select type, title, last_message, unread_count from my_conversations();
\echo '--- set my location, then Yusuf location, distance label bucketed'
select update_my_location(52.52, 13.405);
reset role;
select update_my_location(52.53, 13.41) from (select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b005',false)) s;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b001',false);
set role authenticated;
select first_name, distance_label from discover_people(10,0) where first_name='Yusuf';
\echo '--- Ahmed cannot escalate role'
update profiles set role='admin' where id = auth.uid();
select role from profiles where id = auth.uid();
\echo '--- Ahmed connects to Aisha (pending), Aisha accepts -> direct conversation + notification'
insert into connections (requester_id, addressee_id) values (auth.uid(), '00000000-0000-0000-0000-00000000b002') returning id, status;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b002',false);
select status from respond_connection((select id from connections where requester_id='00000000-0000-0000-0000-00000000b001' and addressee_id=auth.uid()), true);
select direct_conversation_with('00000000-0000-0000-0000-00000000b001') is not null as has_direct_conv;
\echo '--- Aisha messages Ahmed'
insert into messages (conversation_id, sender_id, content) values (direct_conversation_with('00000000-0000-0000-0000-00000000b001'), auth.uid(), 'Salam Ahmed!') returning id is not null as sent;
\echo '--- Fatima (not connected to Omar) cannot message Omar even if a conv existed: try sending into Ahmed/Aisha conv -> must fail'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b004',false);
insert into messages (conversation_id, sender_id, content) values ((select id from conversations where type='direct' limit 1), auth.uid(), 'hi');
\echo '--- Fatima cannot read that conversation'
select count(*) from messages where conversation_id = (select id from conversations where type='direct' limit 1);
\echo '--- Fatima blocks Yusuf -> Yusuf disappears from discover; report+block RPC'
select report_target('user','00000000-0000-0000-0000-00000000b005','harassment','test', true) is not null as reported;
select count(*) filter (where first_name='Yusuf') as yusuf_visible from discover_people(50,0);
select count(*) from profiles where id='00000000-0000-0000-0000-00000000b005';
\echo '--- Event capacity: set max 2 on football (already 3) then join must fail'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b002',false);
reset role; update events set max_participants = 3 where id='20000000-0000-0000-0000-000000000001'; set role authenticated;
insert into event_participants (event_id, user_id) values ('20000000-0000-0000-0000-000000000001', auth.uid());
\echo '--- Join activity as Aisha -> participant_count + conversation membership + creator notified'
insert into activity_participants (activity_id, user_id) values ('30000000-0000-0000-0000-000000000001', auth.uid());
select participant_count from activities where id='30000000-0000-0000-0000-000000000001';
select count(*) from conversation_participants cp join activities a on a.conversation_id=cp.conversation_id where a.id='30000000-0000-0000-0000-000000000001' and cp.user_id=auth.uid();
\echo '--- Create community as Aisha must be pending; cannot self-approve'
insert into communities (name, slug, category, owner_id, city_id) values ('Test Club','test-club','social', auth.uid(), 2) returning status;
update communities set status='approved' where slug='test-club';
select status from communities where slug='test-club';
\echo '--- anon cannot see profiles but can see cities'
reset role; select set_config('request.jwt.claim.sub','',false); set role anon;
select count(*) from profiles; select count(*) from cities;
\echo '--- admin stats'
reset role; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000a001',false); set role authenticated;
select total_users, active_users_7d, communities, pending_communities, events, pending_reports, retention_d7 from admin_dashboard_stats();
select count(*) from admin_signups_by_day(7);
select admin_set_user_status('00000000-0000-0000-0000-00000000b005','suspended','spam');
select status from profiles where id='00000000-0000-0000-0000-00000000b005';
select action, target_id from admin_audit_log;
\echo '--- non-admin cannot call admin stats'
reset role; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b001',false); set role authenticated;
select total_users from admin_dashboard_stats();
reset role;

\echo '--- connection → chat → block flow'
set role authenticated;
select set_config('request.jwt.claim.role','authenticated',false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b001',false);
insert into connections (requester_id, addressee_id) values (auth.uid(), '00000000-0000-0000-0000-00000000b002');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b002',false);
select status from respond_connection((select id from connections where requester_id='00000000-0000-0000-0000-00000000b001' and addressee_id=auth.uid()), true);
select direct_conversation_with('00000000-0000-0000-0000-00000000b001') is not null as has_direct_conv;
insert into messages (conversation_id, sender_id, content) values (direct_conversation_with('00000000-0000-0000-0000-00000000b001'), auth.uid(), 'Salam Ahmed!');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b001',false);
select title, last_message, unread_count from my_conversations() where type='direct';
select type, title from notifications where user_id=auth.uid() order by created_at desc limit 3;
select mark_conversation_read(direct_conversation_with('00000000-0000-0000-0000-00000000b002'));
select unread_count from my_conversations() where title='Aisha';
-- Ahmed declines Omar's pending request
select status from respond_connection((select id from connections where requester_id='00000000-0000-0000-0000-00000000b003' and addressee_id=auth.uid()), false);
-- Ahmed blocks Aisha -> connection removed, message blocked
insert into blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000b002');
select count(*) as remaining_conn from connections where addressee_id='00000000-0000-0000-0000-00000000b002' or requester_id='00000000-0000-0000-0000-00000000b002' and (addressee_id=auth.uid() or requester_id=auth.uid());
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000b002',false);
insert into messages (conversation_id, sender_id, content) values (direct_conversation_with('00000000-0000-0000-0000-00000000b001'), auth.uid(), 'still there?');
select count(*) as sees_ahmed from profiles where id='00000000-0000-0000-0000-00000000b001';
select set_push_token('ExponentPushToken[abc]');
select * from profile_private;
reset role;
select user_id, push_token, location is not null as has_loc from profile_private;
