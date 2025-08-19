# Node.js Backend API Skeleton

A production-ready Node.js backend API skeleton built with TypeScript, Express.js, Prisma, and Redis. Features authentication, validation, rate limiting, and comprehensive testing.

## 🚀 Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Express.js**: Fast, unopinionated web framework
- **Prisma**: Next-generation ORM with type safety
- **MySQL**: Reliable relational database
- **Redis**: In-memory data store for caching and rate limiting
- **JWT Authentication**: Secure token-based authentication
- **Zod Validation**: Schema validation for requests
- **Rate Limiting**: Built-in rate limiting with Redis
- **Error Handling**: Comprehensive error handling middleware
- **Testing**: Jest setup with unit and integration tests
- **Docker**: Production-ready containerization with Nginx
- **PM2**: Process management for production deployment

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Prisma database configuration
│   ├── env.ts        # Environment variables validation
│   └── redis.ts      # Redis connection setup
├── features/         # Feature-based organization
│   ├── auth/         # Authentication feature
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.validation.ts
│   └── health/       # Health check feature
│       └── health.routes.ts
├── middleware/       # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── rateLimiter.middleware.ts
│   └── validation.middleware.ts
├── utils/            # Utility functions
│   ├── jwt.utils.ts
│   ├── password.utils.ts
│   └── redis.utils.ts
├── types/            # TypeScript type definitions
│   └── express.d.ts
├── app.ts           # Express app configuration
└── server.ts        # Server startup and configuration
```

## 🛠 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MySQL
- Redis
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd node-skeleton
npm install
```

### 2. Environment Configuration

Copy the environment example file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://username:password@localhost:3306/database_name
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=5
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## 🐳 Docker Deployment

### Development with Docker

```bash
docker-compose up -d
```

### Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy with Docker:
```bash
docker-compose -f docker-compose.yml up -d
```

The application will be available at:
- API: http://localhost
- Redis Commander: http://localhost:8081

## 🔧 PM2 Deployment (Alternative)

For deployment without Docker:

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor applications
pm2 monit

# View logs
pm2 logs

# Restart applications
pm2 restart all
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:3000`
- Production: `http://localhost` (with Docker)

### Endpoints

#### Health Check
```
GET /api/v1/health
```

#### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/profile (requires authentication)
```

### Example Requests

#### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Redis-based rate limiting
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt password hashing
- **Input Validation**: Zod schema validation
- **Error Handling**: Secure error responses

## 📦 Production Considerations

1. **Environment Variables**: Always use environment variables for sensitive data
2. **Rate Limiting**: Configure appropriate rate limits for your use case
3. **Database**: Use connection pooling and optimize queries
4. **Redis**: Configure persistence and backup
5. **Monitoring**: Add application monitoring and logging
6. **SSL/HTTPS**: Enable SSL in production
7. **Process Management**: Use PM2 or similar for process management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For questions and support, please open an issue in the repository.