# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 CognIA IntelliLearn Platform

Educational AI-powered platform with neumorphic design, deployed on AWS infrastructure.

**Production URL**: https://d2sn3lk5751y3y.cloudfront.net/

## 📋 Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production (includes prebuild asset copy)
npm run lint         # Run ESLint checks
npm start            # Start production server
```

### Deployment
```powershell
./deploy.ps1         # Full deployment to AWS (build + S3 sync + CloudFront invalidation)
```

### AWS Resources
- **S3 Bucket**: `intellilearn-final`
- **CloudFront Distribution**: `E1UF9C891JJD1F`
- **Cognito User Pool**: `us-east-1_ZRhTo5zvG`

## 🏗️ Architecture Overview

### Project Structure
```
/app                  # Next.js App Router pages
  /auth              # Authentication flow
  /dashboard         # Protected dashboard pages
/components          # React components
  /common            # Shared components (FloatingAssistant, Sidebar, etc.)
  /course            # Course-specific components
  /modules           # Feature modules (auth, dashboard)
/lib                 # Core libraries and services
  /services          # AWS service integrations
/lambda              # AWS Lambda functions for voice streaming
/scripts             # Utility scripts for data management
/styles              # Global styles and neumorphic CSS
```

### Key Architectural Patterns

1. **Static Export**: Next.js configured with `output: 'export'` for S3 hosting
2. **Protected Routes**: Using `ProtectedRoute` wrapper with AWS Cognito
3. **Service Layer**: All AWS integrations abstracted in `/lib/services`
4. **Neumorphic Design**: Centralized in `styles/neumorphism.css`

### Authentication Flow
```
Landing → Login → AWS Cognito → Dashboard
                      ↓
                 AuthContext → Protected Routes
```

## 🔧 Key Configurations

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ZRhTo5zvG
NEXT_PUBLIC_COGNITO_CLIENT_ID=37n270qpd9os6e92uadus8cqor
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:88239e31-286e-4125-99f5-691dd32b45fe
AWS_ACCESS_KEY_ID=[required]
AWS_SECRET_ACCESS_KEY=[required]
```

### AWS Service Integrations

1. **Cognito Authentication** (`lib/aws-cognito.ts`)
   - User registration/login
   - Token management
   - Protected route validation

2. **Bedrock AI** (`lib/aws-bedrock.ts`)
   - Claude 3 Haiku integration
   - Streaming responses
   - Educational chat context

3. **S3 Content** (`lib/services/s3ContentService.ts`)
   - Course asset storage
   - Presigned URLs for secure access

4. **DynamoDB** (`lib/services/courseService.ts`)
   - Course metadata
   - User progress tracking
   - Voice session storage

## 🎨 Neumorphic Design System

Core CSS classes in `styles/neumorphism.css`:
- `.neuro-card` - Main card containers
- `.neuro-button-enhanced` - Interactive buttons
- `.neuro-input` - Form inputs
- Consistent shadow system: `var(--shadow-light)` and `var(--shadow-dark)`

## 🐛 Known Issues

### Dashboard Redirect Error
- **Issue**: After login, redirects to `/dashboard/index.txt` instead of `/dashboard/`
- **Impact**: Users cannot access dashboard
- **Workaround**: Manually navigate to `/dashboard/` after login

## 🚀 Deployment Process

1. **Pre-deployment**: Ensure `.env.local` has all required AWS credentials
2. **Build**: `npm run build` (automatically copies assets via prebuild script)
3. **Deploy**: Run `./deploy.ps1` which:
   - Loads environment variables
   - Builds the application
   - Syncs to S3: `aws s3 sync out/ s3://intellilearn-final --delete`
   - Invalidates CloudFront: `aws cloudfront create-invalidation --distribution-id E1UF9C891JJD1F --paths "/*"`

## 📝 Development Tips

1. **Adding New Pages**: Create in `/app` directory following Next.js App Router conventions
2. **AWS Service Calls**: Always use the service layer in `/lib/services`
3. **Protected Pages**: Wrap with `ProtectedRoute` component
4. **Styling**: Use Tailwind classes + neumorphic CSS variables
5. **AI Features**: Integrate through `aws-bedrock.ts` service

## 🔐 Security Notes

- Never commit AWS credentials
- Use environment variables for all sensitive data
- Cognito handles authentication tokens
- S3 content accessed via presigned URLs