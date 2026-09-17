/**
 * Preview mode: set EXPO_PUBLIC_PREVIEW_MOCK=1 in .env.local to run the app
 * against sample in-memory club data (no Supabase needed). Perfect for seeing
 * the real interface before the backend is configured. Never set this to 1 in
 * a production build.
 */
export const isPreviewMock = process.env.EXPO_PUBLIC_PREVIEW_MOCK === '1';