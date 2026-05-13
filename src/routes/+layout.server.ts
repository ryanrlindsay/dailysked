import type { LayoutServerLoad } from './$types';
import { google } from './lib/google';

export const load: LayoutServerLoad = async (event) => {
	const data = await google.loadData(event);
	return {
		user: null,
		googleAccounts: data ? [data.account] : [],
		calendars: data?.calendars ?? [],
		events: data?.events ?? [],
		taskLists: data?.taskLists ?? [],
		tasks: data?.tasks ?? []
	};
};
