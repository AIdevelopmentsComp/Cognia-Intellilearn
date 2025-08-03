# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 CognIA IntelliLearn Platform

Educational AI-powered platform with neumorphic design, deployed on AWS infrastructure.

**Production URL**: https://telmoai.mx

## 📋 Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production (includes prebuild asset copy)
npm run lint         # Run ESLint checks
npm start            # Start production server
```

### Deployment
```bash
./deploy.sh          # Full deployment to AWS (Linux/Mac)
./deploy.ps1         # Full deployment to AWS (Windows PowerShell)
```

### AWS Resources (Account: 304936889025)
- **S3 Bucket**: `intellilearn-prod-app`
- **S3 Vector Storage**: `intellilearn-vector-storage`
- **S3 Content**: `cognia-content-prod`
- **Cognito User Pool**: `us-east-1_BxbAO9DtG`
- **Cognito Client ID**: `4dhimdt09osbal1l5fc75mo6j2`
- **Cognito Identity Pool**: `us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe`
- **DynamoDB**: `IntelliLearn_Data_Prod` + course tables
- **CloudFront Distribution**: To be created

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
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BxbAO9DtG
NEXT_PUBLIC_COGNITO_CLIENT_ID=4dhimdt09osbal1l5fc75mo6j2
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe
# AWS credentials are now in .env.aws for security
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

2.1. **Nova Sonic Voice AI** (`lib/services/novaConversationalService.ts`)
   - Amazon Nova Sonic bidirectional voice conversations
   - Real-time speech-to-speech interaction
   - Advanced voice synthesis and recognition
   - Educational context integration

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

## 🚀 Latest Updates

### ✅ Nova Sonic Voice AI Integration (NEW - Aug 2025)
- **Migration**: Upgraded from Amazon Polly to Nova Sonic for voice interactions
- **Features**: Bidirectional voice conversations, real-time speech-to-speech
- **Components**: New NovaConversationalService, updated VoiceSessionViewer/Modal
- **Benefits**: More natural conversations with advanced AI voice capabilities
- **Configuration**: Matthew voice, temperature 0.7, 1024 max tokens
- **Status**: Implemented and ready for testing

## 🐛 Fixed Issues

### ✅ Login Authentication (FIXED)
- **Issue**: "Incorrect username or password" due to wrong User Pool ID
- **Solution**: Updated to correct User Pool ID: `us-east-1_BxbAO9DtG`
- **Test User**: `demo@intellilearn.com` / `Demo2025!`

### ✅ Nova Sonic Cognito Identity Pool (FIXED)
- **Issue**: `InvalidIdentityPoolConfigurationException: Invalid identity pool configuration. Check assigned IAM roles for this pool.`
- **Root Cause**: Missing IAM roles for Cognito Identity Pool authentication
- **Solution**: Created proper IAM roles with Bedrock, DynamoDB, and S3 permissions
  - **Authenticated Role**: `CognitaIntelliLearnAuthenticatedRole` with full Bedrock access
  - **Unauthenticated Role**: `CognitaIntelliLearnUnauthenticatedRole` with basic permissions
- **New Identity Pool**: `us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe`
- **Status**: ✅ Nova Sonic now has proper AWS credentials for voice conversations

### ✅ Cognito Token Expiration Handling (FIXED)
- **Issue**: `Invalid login token. Token expired` causing Nova Sonic to fail
- **Root Cause**: Application didn't handle JWT token expiration (1-hour default)
- **Solution**: Implemented comprehensive token expiration management
  - **Automatic Detection**: JWT payload decoding to check expiration
  - **Secure Cleanup**: Clear all auth data when tokens expire
  - **Forced Re-authentication**: Automatic redirect to login when needed
  - **No Hardcoded Credentials**: 100% secure using only Cognito Identity Pool
- **Status**: ✅ Token expiration handled automatically, Nova Sonic works securely

## 🚀 Deployment Process

1. **Pre-deployment**: Ensure `.env.aws` has AWS credentials (separate from `.env.local`)
2. **Build**: `npm run build` (automatically copies assets via prebuild script)
3. **Deploy**: Run `./deploy.sh` (Linux/Mac) or `./deploy.ps1` (Windows) which:
   - Loads environment variables from `.env.aws`
   - Builds the application
   - Syncs to S3: `aws s3 sync out/ s3://intellilearn-prod-app --acl public-read --delete`
   - Invalidates CloudFront: `aws cloudfront create-invalidation --distribution-id EAGB3KBNKHJYZ --paths "/*"`

## 📝 Development Tips

1. **Adding New Pages**: Create in `/app` directory following Next.js App Router conventions
2. **AWS Service Calls**: Always use the service layer in `/lib/services`
3. **Protected Pages**: Wrap with `ProtectedRoute` component
4. **Styling**: Use Tailwind classes + neumorphic CSS variables
5. **AI Features**: Integrate through `aws-bedrock.ts` service

## 🔐 Security Notes

- Never commit AWS credentials
- AWS credentials stored in `.env.aws` (not `.env.local`)
- Use environment variables for all sensitive data
- Cognito handles authentication tokens
- S3 content accessed via presigned URLs
- All credentials removed from codebase