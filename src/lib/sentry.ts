import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn && dsn.length > 0) {
  Sentry.init({
    dsn,
    enableInExpoDevelopment: false,
    debug: false,
    tracesSampleRate: 0.1,
  });
}

export {};
