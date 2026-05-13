export interface GoogleOAuthSession {
	accountId: string;
	email: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt?: string;
	scopes: string[];
}

export interface GoogleSyncAdapterConfig {
	clientId: string;
	redirectUri: string;
	scopes?: readonly string[];
}
