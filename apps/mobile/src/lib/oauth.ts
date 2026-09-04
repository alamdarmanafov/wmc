import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/** Deep link Supabase redirects back to after the OAuth dance (must be whitelisted in Supabase Auth → URL config). */
export const authRedirectTo = Linking.createURL('auth/callback');

/** Parses `?a=b` and `#a=b` params from a redirect URL. */
export function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [withoutHash, hash = ''] = url.split('#');
  const query = withoutHash.includes('?') ? withoutHash.slice(withoutHash.indexOf('?') + 1) : '';
  for (const chunk of [query, hash]) {
    if (!chunk) continue;
    for (const pair of chunk.split('&')) {
      const [k, v = ''] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  }
  return params;
}

/** Builds a Supabase session from an OAuth redirect URL (implicit or PKCE flow). */
export async function createSessionFromUrl(url: string) {
  const params = getQueryParams(url);
  if (params.error_description) throw new Error(params.error_description);
  if (params.error) throw new Error(params.error);

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Could not start Google sign-in');

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectTo);
  if (result.type !== 'success') return null;
  return createSessionFromUrl(result.url);
}

export const appleSignInAvailable = Platform.OS === 'ios';

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple did not return an identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only sends the name on the very first sign-in — persist it on the profile.
  const givenName = credential.fullName?.givenName;
  if (givenName && data.user) {
    await supabase.from('profiles').update({ first_name: givenName }).eq('id', data.user.id).eq('first_name', '');
  }
  return data.session;
}
