import os


def env(name, default=None):
    return os.environ.get(name, default)


DATABASE_URL = env('DATABASE_URL')

# Auth/JWT
JWT_SECRET = env('JWT_SECRET', 'dev-secret')
JWT_ISSUER = env('JWT_ISSUER', 'tarot-app')
JWT_AUDIENCE = env('JWT_AUDIENCE', 'tarot-app')

# Apple receipt verification
APPLE_VERIFY_URL = env('APPLE_VERIFY_URL', 'https://buy.itunes.apple.com/verifyReceipt')
APPLE_VERIFY_SANDBOX_URL = env('APPLE_VERIFY_SANDBOX_URL', 'https://sandbox.itunes.apple.com/verifyReceipt')
APPLE_SHARED_SECRET = env('APPLE_SHARED_SECRET')

# Google Play verification
GOOGLE_SERVICE_ACCOUNT_JSON = env('GOOGLE_SERVICE_ACCOUNT_JSON')
GOOGLE_PACKAGE_NAME = env('GOOGLE_PACKAGE_NAME')
