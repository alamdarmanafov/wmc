// WMC push webhook — Node equivalent of supabase/functions/send-push for
// self-hosted Supabase (Railway). POST { record: <notifications row> }.
import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_SECRET, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PREF_BY_TYPE = {
  connection_request: 'connections',
  connection_accepted: 'connections',
  event_joined: 'events',
  event_reminder: 'events',
  activity_joined: 'activities',
  new_community: 'communities',
  nearby_people: 'nearby',
  message: 'messages',
};

async function handle(row) {
  const [{ data: priv }, { data: profile }] = await Promise.all([
    supabase.from('profile_private').select('push_token').eq('user_id', row.user_id).maybeSingle(),
    supabase.from('profiles').select('notification_prefs, status').eq('id', row.user_id).maybeSingle(),
  ]);
  const token = priv?.push_token;
  if (!token || !token.startsWith('ExponentPushToken')) return 'no token';
  if (profile?.status !== 'active') return 'inactive user';
  const prefKey = PREF_BY_TYPE[row.type];
  if (prefKey && profile?.notification_prefs?.[prefKey] === false) return 'muted by preference';

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      to: token,
      title: row.title,
      body: row.body ?? undefined,
      data: { ...(row.data ?? {}), type: row.type, notification_id: row.id },
      sound: 'default',
    }),
  });
  const result = await res.json();
  if (result?.data?.details?.error === 'DeviceNotRegistered') {
    await supabase.from('profile_private').update({ push_token: null }).eq('user_id', row.user_id);
  }
  return result;
}

createServer(async (req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end('wmc push webhook ok');
  }
  if (WEBHOOK_SECRET && req.headers.authorization !== `Bearer ${WEBHOOK_SECRET}`) {
    res.writeHead(401);
    return res.end('unauthorized');
  }
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    const payload = JSON.parse(body || '{}');
    if (!payload.record) {
      res.writeHead(400);
      return res.end('no record');
    }
    const result = await handle(payload.record);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('error');
  }
}).listen(Number(PORT), () => console.log(`push webhook listening on ${PORT}`));
