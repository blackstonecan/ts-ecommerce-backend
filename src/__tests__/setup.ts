// Setup file for Jest tests
// Sets mock environment variables for testing

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret';
process.env.NODE_ENV = 'test';
