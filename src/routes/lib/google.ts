import { env } from '$env/dynamic/private';
import { createDailySkedGoogleHandlers } from '$lib/server';

export const google = createDailySkedGoogleHandlers({
	clientId: env.GOOGLE_CLIENT_ID ?? '',
	clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
	redirectUri: env.GOOGLE_REDIRECT_URI ?? ''
});
