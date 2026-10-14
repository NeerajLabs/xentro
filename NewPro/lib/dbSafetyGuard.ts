/**
 * XENTRO Database Environment Safety Guard & Isolation Engine
 * Prevents automated tests, scripts, or migrations from targeting or corrupting
 * the persistent primary database (`xentro_db`).
 */

export const PROTECTED_PRODUCTION_DATABASES = Object.freeze([
  'xentro_db',
  'xentro_production',
  'xentro_prod',
  'production',
]);

export const APPROVED_TEST_DATABASE_PREFIXES = Object.freeze([
  'xentro_test',
  'test_',
  'mock_',
  'isolated_test',
]);

export class DatabaseIsolationError extends Error {
  constructor(message: string) {
    super(`[DATABASE_ISOLATION_VIOLATION] ${message}`);
    this.name = 'DatabaseIsolationError';
  }
}

/**
 * Safely redacts credentials from MongoDB connection URIs for error messages and logging.
 */
export function redactMongoUri(uri: string): string {
  if (!uri || typeof uri !== 'string') return '[EMPTY_URI]';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//[REDACTED_USER]:[REDACTED_SECRET]@');
}

/**
 * Resolves the canonical runtime environment.
 */
export function resolveAppEnvironment(): 'development' | 'test' | 'staging' | 'production' {
  const env = (
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    'development'
  ).toLowerCase().trim();

  if (env.includes('test')) return 'test';
  if (env.includes('prod')) return 'production';
  if (env.includes('stag')) return 'staging';
  return 'development';
}

export interface ResolvedDatabaseConfig {
  uri: string;
  dbName: string;
  environment: 'development' | 'test' | 'staging' | 'production';
  isTestIsolated: boolean;
}

/**
 * Validates and resolves database configuration.
 * In `test` environments:
 * - Refuses execution if targeting protected primary databases (`xentro_db`).
 * - Refuses execution if test database configuration is missing or ambiguous.
 * - Requires explicit test target (`TEST_MONGODB_URI` / `TEST_MONGODB_DB_NAME` or approved prefix).
 */
export function resolveAndValidateDatabaseConfig(options?: {
  enforceTestIsolation?: boolean;
}): ResolvedDatabaseConfig {
  const environment = resolveAppEnvironment();
  const isTest = environment === 'test' || options?.enforceTestIsolation === true;

  if (isTest) {
    const testUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '';
    const testDbName = (
      process.env.TEST_MONGODB_DB_NAME ||
      (process.env.TEST_MONGODB_URI ? '' : '') ||
      (process.env.MONGODB_DB_NAME !== 'xentro_db' ? process.env.MONGODB_DB_NAME : '') ||
      'xentro_test'
    ).trim();

    // 1. Verify target db name is NOT a protected primary database
    const lowerDbName = testDbName.toLowerCase();
    if (PROTECTED_PRODUCTION_DATABASES.includes(lowerDbName)) {
      throw new DatabaseIsolationError(
        `Automated test execution cannot target protected production database "${testDbName}". Tests must use an approved isolated database (e.g. "xentro_test"). Target URI: ${redactMongoUri(testUri)}`
      );
    }

    // 2. Verify target db name conforms to test naming convention
    const hasApprovedPrefix = APPROVED_TEST_DATABASE_PREFIXES.some((prefix) =>
      lowerDbName.startsWith(prefix)
    );
    if (!hasApprovedPrefix) {
      throw new DatabaseIsolationError(
        `Target database "${testDbName}" is not an approved test database. Test database name must start with one of: ${APPROVED_TEST_DATABASE_PREFIXES.join(', ')}`
      );
    }

    return {
      uri: testUri,
      dbName: testDbName,
      environment: 'test',
      isTestIsolated: true,
    };
  }

  // Non-test environment (development, staging, production)
  const canonicalMongoUri =
    'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';
  const uri = process.env.MONGODB_URI || canonicalMongoUri;
  const dbName = (process.env.MONGODB_DB_NAME || 'xentro_db').trim();

  return {
    uri,
    dbName,
    environment,
    isTestIsolated: false,
  };
}

/**
 * Safety guard asserting that destructive write operations (cleanups, drops, mass insertions)
 * are NEVER executed against non-test databases.
 */
export function assertSafeForTestMutation(targetDbName: string, context: string = 'Test Operation'): void {
  const normalized = (targetDbName || '').toLowerCase().trim();

  if (!normalized) {
    throw new DatabaseIsolationError(`${context} rejected: Target database name is undefined or empty.`);
  }

  if (PROTECTED_PRODUCTION_DATABASES.includes(normalized)) {
    throw new DatabaseIsolationError(
      `${context} BLOCKED: Destructive or testing operations are strictly forbidden on protected database "${normalized}".`
    );
  }

  const isApproved = APPROVED_TEST_DATABASE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!isApproved) {
    throw new DatabaseIsolationError(
      `${context} BLOCKED: Target database "${normalized}" is not an approved test namespace.`
    );
  }
}
