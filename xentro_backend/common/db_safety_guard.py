"""
XENTRO Database Environment Safety Guard & Isolation Engine (Django / Python)
Prevents automated tests, scripts, or migrations from targeting or corrupting
the persistent primary database (`xentro_db`).
"""
import os
import re

PROTECTED_PRODUCTION_DATABASES = frozenset([
    "xentro_db",
    "xentro_production",
    "xentro_prod",
    "production",
])

APPROVED_TEST_DATABASE_PREFIXES = (
    "xentro_test",
    "test_",
    "mock_",
    "isolated_test",
)


class DatabaseIsolationError(Exception):
    """Raised when an operation violates database environment isolation rules."""
    def __init__(self, message: str):
        super().__init__(f"[DATABASE_ISOLATION_VIOLATION] {message}")


def redact_mongo_uri(uri: str) -> str:
    """Safely redacts credentials from MongoDB connection URIs."""
    if not uri or not isinstance(uri, str):
        return "[EMPTY_URI]"
    return re.sub(r"//[^:]+:[^@]+@", "//[REDACTED_USER]:[REDACTED_SECRET]@", uri)


def resolve_app_environment() -> str:
    """Resolves the canonical runtime environment."""
    env = (
        os.getenv("APP_ENV")
        or os.getenv("DJANGO_ENV")
        or os.getenv("ENVIRONMENT")
        or "development"
    ).lower().strip()

    if "test" in env:
        return "test"
    if "prod" in env:
        return "production"
    if "stag" in env:
        return "staging"
    return "development"


def resolve_and_validate_database_config(enforce_test_isolation: bool = False):
    """
    Validates and resolves database configuration.
    In `test` environments:
    - Refuses execution if targeting protected primary databases (`xentro_db`).
    - Refuses execution if test database configuration is missing or ambiguous.
    - Requires explicit test target (`TEST_MONGODB_URI` / `TEST_MONGODB_DB_NAME` or approved prefix).
    """
    environment = resolve_app_environment()
    is_test = environment == "test" or enforce_test_isolation

    if is_test:
        test_uri = os.getenv("TEST_MONGODB_URI") or os.getenv("MONGODB_URI") or ""
        test_db_name = (
            os.getenv("TEST_MONGODB_DB_NAME")
            or (os.getenv("MONGODB_DB_NAME") if os.getenv("MONGODB_DB_NAME") != "xentro_db" else None)
            or "xentro_test"
        ).strip()

        lower_db = test_db_name.lower()
        if lower_db in PROTECTED_PRODUCTION_DATABASES:
            raise DatabaseIsolationError(
                f"Automated test execution cannot target protected production database '{test_db_name}'. "
                f"Tests must use an approved isolated database (e.g. 'xentro_test'). "
                f"Target URI: {redact_mongo_uri(test_uri)}"
            )

        if not any(lower_db.startswith(prefix) for prefix in APPROVED_TEST_DATABASE_PREFIXES):
            raise DatabaseIsolationError(
                f"Target database '{test_db_name}' is not an approved test database. "
                f"Test database name must start with one of: {', '.join(APPROVED_TEST_DATABASE_PREFIXES)}"
            )

        return {
            "uri": test_uri,
            "db_name": test_db_name,
            "environment": "test",
            "is_test_isolated": True,
        }

    # Non-test environment
    canonical_mongo_uri = (
        "mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db"
    )
    uri = (os.getenv("MONGODB_URI") or canonical_mongo_uri).strip()
    db_name = (os.getenv("MONGODB_DB_NAME") or "xentro_db").strip()

    return {
        "uri": uri,
        "db_name": db_name,
        "environment": environment,
        "is_test_isolated": False,
    }


def assert_safe_for_test_mutation(target_db_name: str, context: str = "Test Operation") -> None:
    """Safety guard asserting that mutations are NEVER executed against non-test databases."""
    normalized = (target_db_name or "").lower().strip()

    if not normalized:
        raise DatabaseIsolationError(f"{context} rejected: Target database name is undefined or empty.")

    if normalized in PROTECTED_PRODUCTION_DATABASES:
        raise DatabaseIsolationError(
            f"{context} BLOCKED: Destructive or testing operations are strictly forbidden on protected database '{normalized}'."
        )

    if not any(normalized.startswith(prefix) for prefix in APPROVED_TEST_DATABASE_PREFIXES):
        raise DatabaseIsolationError(
            f"{context} BLOCKED: Target database '{normalized}' is not an approved test namespace."
        )
