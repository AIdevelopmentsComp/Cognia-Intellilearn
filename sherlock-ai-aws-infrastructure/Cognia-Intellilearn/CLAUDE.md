# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Codebase Overview

**Intellilearn** is an AI-powered EdTech platform within the Sherlock AI Ecosystem. It's a Next.js 15 application with AWS integration, featuring AI tutoring, course management, and gamification.

### Technology Stack

- **Frontend**: Next.js 15.2.2 (App Router), React 19, TypeScript 5
- **Styling**: TailwindCSS 3.4 with custom neumorphism design system
- **Authentication**: AWS Cognito (User Pools + Identity Pools)
- **AI/ML**: AWS Bedrock (Claude 3 Haiku)
- **Database**: DynamoDB (multiple tables for courses, users, progress)
- **Storage**: S3 Vectors (`cognia-intellilearn` bucket), S3 + CloudFront CDN
- **3D Graphics**: Three.js for animations

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build (creates /out directory for static export)
npm run build

# Run linting
npm run lint

# Start production server (for testing)
npm run start
```

## Deployment Commands

```bash
# Deploy to S3 (after npm run build)
aws s3 sync out/ s3://intellilearn-final/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1UF9C891JJD1F --paths "/*"

# Or use the GitHub Actions workflow which triggers on push to main/master
```

## Environment Configuration

Create a `.env.local` file with the following variables:

```env
# AWS Configuration
AWS_ACCOUNT_ID=362631905074
AWS_ACCESS_KEY_ID=AKIAVI3ULX4ZB3253Q6R
AWS_SECRET_ACCESS_KEY=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
AWS_DEFAULT_REGION=us-east-1

# Application Resources
S3_VECTOR_BUCKET=cognia-intellilearn
DYNAMODB_TABLE=Intellilearn_Data

# Public Variables (accessible in browser)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=us-east-1_ZRhTo5zvG
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=37n270qpd9os6e92uadus8cqor
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=us-east-1:88239e31-286e-4125-99f5-691dd32b45fe
```

## High-Level Architecture

### Application Structure
```
app/                    # Next.js App Router pages
├── auth/              # Login/register pages
├── dashboard/         # Protected dashboard with all features
│   ├── courses/       # Course listing and detail pages
│   ├── analytics/     # Learning analytics
│   ├── assignments/   # Assignment management
│   ├── assistant/     # AI Assistant chat interface
│   ├── certificates/  # Certificate generation
│   ├── content/       # Content management
│   ├── gamification/  # Badges and achievements
│   └── profile/       # User profile management
└── layout.tsx         # Root layout with providers

components/
├── common/            # Shared UI components (header, footer, modals)
├── course/            # Course-specific components
├── landingPage/       # Landing page with 3D city animation
└── modules/           # Feature-specific components

lib/
├── aws-*.ts           # AWS service integrations
├── contexts/          # React contexts (auth, user mode)
└── services/          # Business logic (courses, progress)
```

### AWS Services Architecture

**Authentication Flow**:
1. User signs up/logs in via Cognito User Pool
2. Cognito returns JWT tokens
3. Identity Pool provides temporary AWS credentials
4. Frontend uses credentials to access AWS services directly

**Data Storage**:
- **DynamoDB Tables**:
  - `intellilearn-courses`: Course metadata
  - `intellilearn-modules`: Course modules  
  - `intellilearn-lessons`: Individual lessons
  - `intellilearn-users`: User profiles
  - `intellilearn-progress`: Learning progress tracking

**AI Integration**:
- AWS Bedrock with Claude 3 Haiku model
- Vector embeddings stored in S3 Vectors
- RAG pipeline for course content search

### Key Patterns

**Static Export**: 
- Application is built as static HTML/JS/CSS files
- Deployed to S3 and served via CloudFront
- All API calls are made directly to AWS services from the browser

**Client-Side Authentication**:
- Authentication state managed in React Context
- Protected routes check auth status client-side
- Unauthenticated users redirected to login

**Component Architecture**:
- Page components in `app/` directory handle routing
- Feature components in `components/modules/` contain business logic
- Common components in `components/common/` are reusable UI elements

## Database Setup

```bash
# Create DynamoDB tables
node scripts/setup-dynamo-tables.js

# Seed course data (creates a sample PMP certification course)
node scripts/create-productive-pmp-course.js

# Upload course vectors for semantic search
node scripts/upload-course-vectors.js

# Query utilities
node scripts/query-dynamo.js
node scripts/query-modules-lessons.js
```

## Important Implementation Details

### Neumorphism Design System
The application uses a custom neumorphism (soft UI) design system:
- Defined in `styles/neumorphism.css`
- Components use shadow-based depth effects
- Consistent color scheme with blue/purple gradients

### Course ID System
- Courses use human-readable IDs (e.g., "pmp-certification-prep")
- Legacy numeric IDs are migrated to string format
- Course routing: `/dashboard/courses/[id]`

### AI Assistant Integration
- Located in `components/modules/dashboard/AssistantAI.tsx`
- Uses AWS Bedrock for responses
- Maintains conversation history in component state
- Supports markdown rendering for AI responses

### User Modes
- Student Mode: Default learning experience
- Instructor Mode: Content creation and management
- Context: `lib/contexts/UserModeContext.tsx`

## Production URLs

- **Primary**: https://d2sn3lk5751y3y.cloudfront.net
- **S3 Direct**: http://intellilearn-final.s3-website-us-east-1.amazonaws.com

## Common Development Tasks

### Adding a New Dashboard Feature
1. Create page in `app/dashboard/[feature]/page.tsx`
2. Create component in `components/modules/dashboard/[Feature].tsx`
3. Add navigation link in dashboard sidebar
4. Implement AWS service integration if needed

### Updating Course Content
1. Use scripts in `scripts/` directory to modify DynamoDB
2. Update vector embeddings if content changes significantly
3. Test search functionality after updates

### Modifying AI Assistant
1. Edit `lib/aws-bedrock.ts` for model configuration
2. Update `components/modules/dashboard/AssistantAI.tsx` for UI
3. Adjust prompt engineering in the sendMessage function

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check for TypeScript errors with `npm run lint`
- Verify AWS credentials have necessary permissions

### Authentication Issues
- Verify Cognito User Pool and Client IDs
- Check Identity Pool configuration
- Ensure CORS is configured for S3/CloudFront

### Deployment Issues
- Build locally first to catch errors
- Verify S3 bucket permissions
- Check CloudFront distribution settings
- Monitor GitHub Actions logs for deployment failures