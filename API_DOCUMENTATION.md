# Exam Supervisor API Documentation

## Overview

The Exam Supervisor API is a comprehensive examination management system built with NestJS. It provides role-based access control for managing users, questions, exams, and exam attempts.

**Base URL:** `http://localhost:4000` (configurable via PORT environment variable)

**Authentication:** JWT Bearer Token required for protected endpoints

## Authentication

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "CANDIDATE" // optional: CANDIDATE, EXAMINER, ADMIN
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CANDIDATE",
    "createdAt": "2026-01-08T..."
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CANDIDATE"
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

## User Management

### Get User Profile

**Roles:** Any authenticated user

```http
GET /user/me
Authorization: Bearer <token>
```

### Get All Users (Admin Only)

**Roles:** ADMIN

```http
GET /user?page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CANDIDATE",
      "createdAt": "2026-01-08T..."
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### Update User Profile

**Roles:** Any authenticated user

```http
PATCH /user/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

### Update User Role (Admin Only)

**Roles:** ADMIN

```http
PATCH /user/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "EXAMINER"
}
```

## Question Management

### Create Question

**Roles:** ADMIN, EXAMINER

```http
POST /admin/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "What is the capital of France?",
  "options": [
    {
      "content": "London",
      "isCorrect": false
    },
    {
      "content": "Paris",
      "isCorrect": true
    },
    {
      "content": "Berlin",
      "isCorrect": false
    },
    {
      "content": "Madrid",
      "isCorrect": false
    }
  ]
}
```

### Get All Questions

**Roles:** ADMIN, EXAMINER

```http
GET /admin/questions
Authorization: Bearer <token>
```

### Get Question by ID

**Roles:** ADMIN, EXAMINER

```http
GET /admin/questions/:id
Authorization: Bearer <token>
```

### Update Question

**Roles:** ADMIN, EXAMINER

```http
PATCH /admin/questions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated question content",
  "options": [...]
}
```

### Delete Question

**Roles:** ADMIN, EXAMINER

```http
DELETE /admin/questions/:id
Authorization: Bearer <token>
```

## Exam Management

### Create Exam

**Roles:** ADMIN, EXAMINER

```http
POST /admin/exams
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mathematics Final Exam",
  "description": "Final exam for mathematics course",
  "duration": 120,
  "passScore": 70,
  "status": "DRAFT"
}
```

### Get Exams (Role-based filtering)

**Roles:** ADMIN, EXAMINER

- **ADMIN:** Sees all exams
- **EXAMINER:** Sees only exams they created

```http
GET /admin/exams?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Mathematics Final Exam",
      "description": "Final exam for mathematics course",
      "duration": 120,
      "passScore": 70,
      "status": "DRAFT",
      "createdAt": "2026-01-08T...",
      "questions": [...]
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Update Exam

**Roles:** ADMIN, EXAMINER

```http
PATCH /admin/exams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Exam Title",
  "description": "Updated description"
}
```

### Publish Exam

**Roles:** ADMIN, EXAMINER

```http
PATCH /admin/exams/:id/publish
Authorization: Bearer <token>
```

### Unpublish Exam

**Roles:** ADMIN, EXAMINER

```http
PATCH /admin/exams/:id/unpublish
Authorization: Bearer <token>
```

## Exam Questions Management

### Get Exam Questions

**Roles:** ADMIN, EXAMINER

```http
GET /admin/exams/:examId/questions
Authorization: Bearer <token>
```

### Update Exam Questions

**Roles:** ADMIN, EXAMINER

```http
PATCH /admin/exams/:examId/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "questions": [
    {
      "questionId": "uuid",
      "order": 1,
      "score": 5
    }
  ]
}
```

## Exam Attempts (Candidates)

### Start Exam

**Roles:** CANDIDATE

```http
POST /candidate/exams/:examId/start
Authorization: Bearer <candidate_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "attempt_uuid",
    "examId": "exam_uuid",
    "startedAt": "2026-01-08T...",
    "questions": [...]
  }
}
```

### Submit Exam

**Roles:** CANDIDATE

```http
POST /candidate/exams/:examId/submit
Authorization: Bearer <candidate_token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "question_uuid",
      "optionId": "option_uuid"
    }
  ]
}
```

### Get Exam Result

**Roles:** CANDIDATE

```http
GET /candidate/exams/:examId/result
Authorization: Bearer <candidate_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "attempt_uuid",
    "examId": "exam_uuid",
    "score": 85,
    "startedAt": "2026-01-08T...",
    "finishedAt": "2026-01-08T...",
    "answers": [...]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Common HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### User

```typescript
{
  id: string;
  email: string;
  role: 'CANDIDATE' | 'EXAMINER' | 'ADMIN';
  createdAt: Date;
}
```

### Question

```typescript
{
  id: string;
  content: string;
  options: Option[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Option

```typescript
{
  id: string;
  content: string;
  isCorrect: boolean;
}
```

### Exam

```typescript
{
  id: string;
  title: string;
  description?: string;
  duration: number; // minutes
  passScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt?: Date;
  questions: ExamQuestion[];
}
```

### Exam Attempt

```typescript
{
  id: string;
  userId: string;
  examId: string;
  score?: number;
  startedAt: Date;
  finishedAt?: Date;
  answers: AttemptAnswer[];
}
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRATION`: JWT expiration time (default: '1h')
- `PORT`: Server port (default: 4000)
- `PASSWORD_SALT`: Bcrypt salt rounds (default: 10)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities:

- Users (with role-based access)
- Questions (with multiple choice options)
- Exams (containing questions with scores)
- Exam Attempts (candidate submissions)
- Attempt Answers (individual question responses)
