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

### Create User (Admin Only)

**Roles:** ADMIN

```http
POST /user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "EXAMINER"
}
```

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
  "status": "DRAFT",
  "assignees": ["student1@example.com", "student2@example.com"]
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
      "assignees": ["student1@example.com"],
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

### Get Assigned Exams

**Roles:** CANDIDATE

```http
GET /candidate/exams?page=1&limit=10
Authorization: Bearer <candidate_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "exam_uuid",
      "title": "Mathematics Final Exam",
      "description": "Final exam for mathematics course",
      "duration": 120,
      "passScore": 70,
      "createdAt": "2026-01-08T..."
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

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
    "questions": [
      {
        "id": "question_uuid",
        "content": "What is the capital of France?",
        "options": [
          {
            "id": "option_uuid",
            "content": "Paris"
          }
        ]
      }
    ]
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
    "answers": [
      {
        "questionId": "question_uuid",
        "optionId": "option_uuid",
        "isCorrect": true
      }
    ]
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

## Frontend Integration Guide

### Authentication Flow

1. **Register/Login**: Call `/auth/login` or `/auth/register` to get access token
2. **Store Token**: Save the `access_token` in localStorage or secure storage
3. **Include Token**: Add `Authorization: Bearer <token>` header to all authenticated requests
4. **Token Refresh**: When token expires, use `/auth/refresh` with refresh_token

### Role-Based UI

```javascript
// Check user role from login response
const userRole = response.data.user.role;

// Show/hide UI elements based on role
if (userRole === 'ADMIN') {
  // Show admin features
} else if (userRole === 'EXAMINER') {
  // Show examiner features
} else if (userRole === 'CANDIDATE') {
  // Show candidate features
}
```

### API Client Setup

```javascript
// axios example
const apiClient = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const newToken = refreshResponse.data.data.access_token;
          localStorage.setItem('access_token', newToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
```

### Pagination Handling

```javascript
// Handle paginated responses
const fetchUsers = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/user?page=${page}&limit=${limit}`);
  const { data, meta } = response.data;

  return {
    users: data,
    pagination: {
      currentPage: meta.page,
      totalPages: meta.totalPages,
      totalItems: meta.total,
      hasNextPage: meta.page < meta.totalPages,
      hasPrevPage: meta.page > 1,
    },
  };
};
```

### Exam Taking Flow

```javascript
// 1. Get assigned exams
const assignedExams = await apiClient.get('/candidate/exams');

// 2. Start exam
const startResponse = await apiClient.post(`/candidate/exams/${examId}/start`);
const { questions, startedAt } = startResponse.data.data;

// 3. Track time and answers
let answers = [];
const handleAnswerSelect = (questionId, optionId) => {
  answers.push({ questionId, optionId });
};

// 4. Submit exam
const submitResponse = await apiClient.post(
  `/candidate/exams/${examId}/submit`,
  {
    answers,
  },
);

// 5. Get result
const resultResponse = await apiClient.get(`/candidate/exams/${examId}/result`);
const { score, answers: resultAnswers } = resultResponse.data.data;
```

### Error Handling

```javascript
// Global error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response) {
      const { statusCode, error: errorMessage } = response.data;

      switch (statusCode) {
        case 400:
          // Validation error
          showValidationErrors(errorMessage);
          break;
        case 401:
          // Unauthorized
          redirectToLogin();
          break;
        case 403:
          // Forbidden
          showPermissionError();
          break;
        case 404:
          // Not found
          showNotFoundError();
          break;
        default:
          // Other errors
          showGenericError(errorMessage);
      }
    } else {
      // Network error
      showNetworkError();
    }
    return Promise.reject(error);
  },
);
```

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
  assignees: string[]; // email addresses
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
