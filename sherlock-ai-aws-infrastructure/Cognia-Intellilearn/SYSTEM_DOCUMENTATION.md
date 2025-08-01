# CognIA IntelliLearn - System Documentation

**Version:** 2.0.0  
**Last Updated:** January 28, 2025  
**Developer:** Claude AI Assistant (Anthropic)  
**Project Lead:** CognIA Development Team  

## 📋 Current System State Analysis

### 🔍 **Issues Identified from Logs:**

1. **❌ Lambda Endpoint Configuration Error**
   ```
   POST https://your-lambda-endpoint.amazonaws.com/bedrock-stream net::ERR_NAME_NOT_RESOLVED
   ```
   - **Issue:** Hardcoded placeholder URL instead of actual Lambda endpoint
   - **Impact:** Voice streaming functionality completely broken
   - **Priority:** CRITICAL

2. **❌ S3 CORS Policy Violation**
   ```
   Access to fetch at 'https://cognia-intellilearn.s3.us-east-1.amazonaws.com/' 
   has been blocked by CORS policy
   ```
   - **Issue:** Missing CORS configuration for educational context retrieval
   - **Impact:** Educational context cannot be loaded for voice sessions
   - **Priority:** HIGH

3. **❌ Invalid AWS Security Tokens**
   ```
   UnrecognizedClientException: The security token included in the request is invalid
   ```
   - **Issue:** Direct AWS SDK calls from frontend with invalid credentials
   - **Impact:** DynamoDB operations failing
   - **Priority:** HIGH

4. **⚠️ Deprecated Audio API**
   ```
   The ScriptProcessorNode is deprecated. Use AudioWorkletNode instead
   ```
   - **Issue:** Using deprecated Web Audio API
   - **Impact:** Future browser compatibility issues
   - **Priority:** MEDIUM

## 🏗️ **System Architecture Overview**

### **Frontend Architecture (Next.js 15.4.4)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  Components/                                                │
│  ├── auth/           → Authentication components            │
│  ├── common/         → Shared UI components                 │
│  ├── course/         → Course management components         │
│  ├── dashboard/      → Dashboard modules                    │
│  └── landingPage/    → Landing page components              │
├─────────────────────────────────────────────────────────────┤
│  Services/                                                  │
│  ├── voiceStreamingService.ts → Voice AI integration       │
│  ├── voiceSessionService.ts   → Voice session management   │
│  ├── aiContentService.ts      → AI content handling        │
│  ├── vectorizationService.ts  → Vector operations          │
│  └── courseService.ts         → Course data management     │
├─────────────────────────────────────────────────────────────┤
│  Authentication/                                            │
│  ├── AuthContext.tsx          → React context provider     │
│  ├── ProtectedRoute.tsx       → Route protection           │
│  └── auth.ts                  → Authentication utilities   │
└─────────────────────────────────────────────────────────────┘
```

### **Backend Architecture (AWS Lambda + Services)**
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud Backend                        │
├─────────────────────────────────────────────────────────────┤
│  Lambda Functions/                                          │
│  └── bedrock-voice-streaming/                              │
│      ├── index.py           → Main Lambda handler          │
│      ├── requirements.txt   → Python dependencies          │
│      └── deploy-simple.ps1  → Deployment script            │
├─────────────────────────────────────────────────────────────┤
│  AWS Services/                                              │
│  ├── S3 Buckets/                                           │
│  │   ├── intellilearn-final     → Static website hosting   │
│  │   └── cognia-intellilearn    → Course content storage   │
│  ├── DynamoDB Tables/                                      │
│  │   ├── Intellilearn_Data      → Unified course data      │
│  │   ├── ContabilIA_Data        → Accounting app data      │
│  │   └── MatterMind_Data        → Legal app data           │
│  ├── Amazon Bedrock/                                       │
│  │   ├── Claude 3.5 Haiku       → AI text generation       │
│  │   └── Titan Embeddings V2    → Vector embeddings        │
│  └── CloudFront/                                           │
│      └── E1UF9C891JJD1F         → CDN distribution         │
└─────────────────────────────────────────────────────────────┘
```

## 📚 **Course Content Structure**

### **PMP Certification Masterclass (Course ID: 000000000)**
- **Total Modules:** 10
- **Total Lessons:** 50 (5 per module)
- **Duration:** 120 hours
- **Language:** Spanish (needs translation to English)
- **Level:** Professional
- **Status:** ✅ Successfully created in DynamoDB

**Module Structure:**
1. **Fundamentos de Gestión de Proyectos** → Project Management Fundamentals
2. **Inicio del Proyecto y Charter** → Project Initiation and Charter
3. **Planificación del Alcance y Requisitos** → Scope and Requirements Planning
4. **Gestión del Cronograma y Tiempo** → Schedule and Time Management
5. **Gestión de Costos y Presupuesto** → Cost and Budget Management
6. **Gestión de Calidad** → Quality Management
7. **Gestión de Recursos Humanos y Equipos** → Human Resources and Team Management
8. **Gestión de Comunicaciones** → Communications Management
9. **Gestión de Riesgos** → Risk Management
10. **Gestión de Adquisiciones y Cierre** → Procurement and Closure Management

## 🔧 **Technical Stack**

### **Frontend Technologies**
- **Framework:** Next.js 15.4.4 with App Router
- **Runtime:** React 19 with Concurrent Features
- **Language:** TypeScript 5+ (Strict mode)
- **Styling:** Tailwind CSS v4 + Neumorphic design system
- **Animation:** Framer Motion 12+ for UI transitions
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context + Custom hooks
- **Audio Processing:** Web Audio API (needs AudioWorkletNode upgrade)

### **Backend Technologies**
- **Serverless:** AWS Lambda (Python 3.10+)
- **Database:** Amazon DynamoDB with GSI indexes
- **Storage:** Amazon S3 with CloudFront CDN
- **AI/ML:** Amazon Bedrock (Claude 3.5 Haiku, Titan Embeddings)
- **Authentication:** Custom JWT-based system
- **API Gateway:** AWS API Gateway HTTP API

### **Development Tools**
- **Package Manager:** npm with package-lock.json
- **Build System:** Next.js Turbopack
- **Deployment:** PowerShell scripts for AWS CLI
- **Environment:** .env.local for local development
- **Version Control:** Git with .gitignore configuration

## 🚨 **Critical Issues Requiring Immediate Attention**

### **1. Lambda Endpoint Configuration**
**File:** `lib/services/voiceStreamingService.ts`
**Line:** ~25
**Current Issue:**
```typescript
private lambdaEndpoint = 'https://your-lambda-endpoint.amazonaws.com/bedrock-stream'
```
**Required Fix:**
```typescript
private lambdaEndpoint = process.env.NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT || 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream'
```

### **2. S3 CORS Configuration**
**Bucket:** `cognia-intellilearn`
**Required CORS Policy:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://d2sn3lk5751y3y.cloudfront.net", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### **3. Environment Variables Update**
**File:** `.env.local`
**Missing Variable:**
```bash
NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT=https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream
```

## 📊 **Database Schema**

### **Intellilearn_Data Table Structure**
```
Primary Key: id (String) + client_id (String)
GSI1: client-date-index (client_id + created_date)
GSI2: client-document-index (client_id + document_type)

Document Types:
- COURSE        → Course metadata
- MODULE        → Course modules
- LESSON        → Individual lessons
- COURSE_STATS  → Course statistics
```

### **Sample Data Structure**
```json
{
  "id": "COURSE#000000000",
  "client_id": "METADATA",
  "courseId": "000000000",
  "title": "PMP Certification Masterclass - Project Management Professional",
  "description": "Complete PMP preparation course based on PMBOK Guide 7th Edition",
  "instructor": "CognIA Project Management Institute",
  "totalModules": 10,
  "totalLessons": 50,
  "created_date": "2025-01-28T19:26:56.949Z",
  "document_type": "COURSE",
  "status": "active"
}
```

## 🔐 **Security Implementation**

### **Authentication Flow**
1. **Local Storage:** User credentials stored in browser localStorage
2. **JWT Tokens:** Custom token-based authentication
3. **Route Protection:** ProtectedRoute component wrapper
4. **AWS Integration:** Lambda-based secure API calls

### **AWS Security**
- **IAM Roles:** CogniaBedrockLambdaRole with minimal permissions
- **API Gateway:** CORS-enabled HTTP API
- **S3 Buckets:** Public read access for static content
- **DynamoDB:** Server-side encryption enabled

## 🎯 **Performance Metrics**

### **Build Performance**
- **Build Time:** ~57 seconds (Next.js 15.4.4)
- **Bundle Size:** 
  - First Load JS: 100-180 kB per route
  - Largest Route: `/dashboard/analytics` (276 kB)
  - Static Pages: 21 pages generated

### **Runtime Performance**
- **Voice Processing:** ScriptProcessorNode (deprecated)
- **API Response:** Lambda cold start ~1-2 seconds
- **Database Queries:** DynamoDB single-digit millisecond latency

## 🔄 **Development Workflow**

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to AWS
./deploy-alternative.ps1
```

### **Deployment Process**
1. **Build:** Next.js static export to `/out` directory
2. **Upload:** S3 sync with `--delete` flag
3. **CDN:** CloudFront cache invalidation
4. **Lambda:** Separate deployment via PowerShell scripts

## 📝 **Code Quality Standards**

### **TypeScript Configuration**
- **Strict Mode:** Enabled for type safety
- **ESLint:** Next.js core web vitals configuration
- **File Naming:** camelCase for components, kebab-case for pages

### **Component Architecture**
- **Separation of Concerns:** Components, services, utilities
- **Custom Hooks:** Shared logic extraction
- **Context Providers:** Global state management
- **Error Boundaries:** Graceful error handling

## 🚀 **Deployment Status**

### **Production Environment**
- **URL:** https://d2sn3lk5751y3y.cloudfront.net
- **Status:** ✅ Deployed successfully
- **Last Deploy:** January 28, 2025
- **Build Version:** Next.js 15.4.4

### **AWS Resources**
- **S3 Bucket:** intellilearn-final (static hosting)
- **CloudFront:** E1UF9C891JJD1F (CDN)
- **Lambda:** cognia-bedrock-voice-streaming (AI processing)
- **DynamoDB:** Intellilearn_Data (course data)

## 📋 **Next Steps & Recommendations**

### **Immediate Fixes (Priority 1)**
1. ✅ Fix Lambda endpoint URL in voiceStreamingService.ts
2. ✅ Configure S3 CORS policy for educational context
3. ✅ Update environment variables
4. ✅ Remove direct AWS SDK calls from frontend

### **Performance Improvements (Priority 2)**
1. 🔄 Upgrade to AudioWorkletNode for voice processing
2. 🔄 Implement service worker for offline functionality
3. 🔄 Add bundle splitting for better loading performance
4. 🔄 Optimize images and assets

### **Feature Enhancements (Priority 3)**
1. 📝 Translate all Spanish content to English
2. 📝 Add comprehensive error logging
3. 📝 Implement user progress tracking
4. 📝 Add real-time collaboration features

---

**This documentation serves as the single source of truth for the CognIA IntelliLearn system architecture, current issues, and development roadmap.** 