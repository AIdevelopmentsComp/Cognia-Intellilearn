import { S3Client } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// AWS Configuration
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
}

// AWS Clients
const s3Client = new S3Client(awsConfig)
const bedrockClient = new BedrockRuntimeClient(awsConfig)

// S3 Vectors Configuration
const VECTORS_BUCKET = 'intellilearn-final'
const EDUCATIONAL_INDEX = 'educational-content'
const EMBEDDINGS_MODEL = 'amazon.titan-embed-text-v2:0'

// Types
export interface EducationalBlock {
  id: string
  topic: string
  grade: string
  type: 'lesson_block' | 'concept' | 'example' | 'exercise'
  language: 'en' | 'es'
  content: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  subject: string
  keywords: string[]
}

export interface VectorMetadata {
  topic: string
  grade: string
  type: string
  language: string
  difficulty?: string
  subject?: string
  keywords?: string[]
  created_at: string
}

export interface SimilarContent {
  id: string
  content: string
  similarity: number
  metadata: VectorMetadata
}

export class S3VectorsService {
  
  /**
   * Generate embedding using Amazon Bedrock Titan
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const command = new InvokeModelCommand({
        modelId: EMBEDDINGS_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: text,
          dimensions: 1024,
          normalize: true
        })
      })

      const response = await bedrockClient.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      return responseBody.embedding

    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  /**
   * Insert educational content vector into S3 Vectors
   */
  static async insertEducationalVector(block: EducationalBlock): Promise<void> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(block.content)
      
      // Prepare metadata
      const metadata: VectorMetadata = {
        topic: block.topic,
        grade: block.grade,
        type: block.type,
        language: block.language,
        difficulty: block.difficulty,
        subject: block.subject,
        keywords: block.keywords,
        created_at: new Date().toISOString()
      }

      // Note: This is a conceptual implementation
      // In practice, you would use the actual S3 Vectors API
      // For now, we'll simulate the storage structure
      
      const vectorData = {
        id: block.id,
        vector: embedding,
        metadata: metadata,
        content: block.content
      }

      console.log(`Vector inserted for educational block: ${block.id}`)
      
      // In a real implementation, this would call the S3 Vectors API
      // await s3vectors.insertVector(VECTORS_BUCKET, EDUCATIONAL_INDEX, vectorData)

    } catch (error) {
      console.error('Error inserting educational vector:', error)
      throw new Error(`Failed to insert vector: ${error}`)
    }
  }

  /**
   * Query similar educational content using semantic search
   */
  static async querySimilarContent(
    query: string,
    grade?: string,
    subject?: string,
    topK: number = 5
  ): Promise<SimilarContent[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Build filter conditions
      const filters: Record<string, any> = {}
      if (grade) filters.grade = grade
      if (subject) filters.subject = subject

      // For now, we'll return mock similar content
      // In practice, this would call the S3 Vectors query API
      const mockSimilarContent: SimilarContent[] = await this.getMockSimilarContent(query, grade, subject, topK)

      console.log(`Found ${mockSimilarContent.length} similar content blocks for query: "${query}"`)
      
      return mockSimilarContent

    } catch (error) {
      console.error('Error querying similar content:', error)
      return []
    }
  }

  /**
   * Get contextual fragments for a specific topic and grade
   */
  static async getEducationalContext(
    topic: string,
    grade: string,
    language: 'en' | 'es' = 'en'
  ): Promise<string[]> {
    try {
      const similarContent = await this.querySimilarContent(topic, grade, undefined, 5)
      
      return similarContent
        .filter(content => content.metadata.language === language)
        .map(content => content.content)
        .slice(0, 3) // Limit to top 3 most relevant

    } catch (error) {
      console.error('Error getting educational context:', error)
      return []
    }
  }

  /**
   * Mock implementation of similar content retrieval
   * In production, this would be replaced by actual S3 Vectors API calls
   */
  private static async getMockSimilarContent(
    query: string,
    grade?: string,
    subject?: string,
    topK: number = 5
  ): Promise<SimilarContent[]> {
    
    // Educational content database (in production, this would be in S3 Vectors)
    const educationalDatabase: EducationalBlock[] = [
      {
        id: 'project-mgmt-basics-001',
        topic: 'project management fundamentals',
        grade: 'intermediate',
        type: 'lesson_block',
        language: 'en',
        content: 'Project management is the practice of planning, organizing, and managing resources to achieve specific goals within defined constraints. Key phases include initiation, planning, execution, monitoring, and closure.',
        difficulty: 'basic',
        subject: 'business',
        keywords: ['project', 'management', 'planning', 'execution', 'monitoring']
      },
      {
        id: 'project-mgmt-tools-002',
        topic: 'project management tools',
        grade: 'intermediate',
        type: 'concept',
        language: 'en',
        content: 'Essential project management tools include Gantt charts for timeline visualization, Kanban boards for workflow management, and risk registers for identifying potential issues. Modern tools like Asana, Trello, and Microsoft Project automate many processes.',
        difficulty: 'intermediate',
        subject: 'business',
        keywords: ['tools', 'gantt', 'kanban', 'software', 'automation']
      },
      {
        id: 'leadership-skills-003',
        topic: 'leadership in projects',
        grade: 'advanced',
        type: 'lesson_block',
        language: 'en',
        content: 'Effective project leadership requires clear communication, decision-making skills, and the ability to motivate team members. Leaders must balance stakeholder expectations while maintaining team morale and project quality.',
        difficulty: 'advanced',
        subject: 'business',
        keywords: ['leadership', 'communication', 'decision-making', 'motivation', 'stakeholders']
      },
      {
        id: 'risk-management-004',
        topic: 'project risk management',
        grade: 'intermediate',
        type: 'concept',
        language: 'en',
        content: 'Risk management involves identifying, analyzing, and responding to project risks. Common strategies include risk avoidance, mitigation, transfer, and acceptance. Regular risk assessments help maintain project stability.',
        difficulty: 'intermediate',
        subject: 'business',
        keywords: ['risk', 'assessment', 'mitigation', 'analysis', 'strategy']
      },
      {
        id: 'agile-methodology-005',
        topic: 'agile project management',
        grade: 'advanced',
        type: 'lesson_block',
        language: 'en',
        content: 'Agile methodology emphasizes iterative development, customer collaboration, and responding to change. Scrum and Kanban are popular agile frameworks that promote flexibility and continuous improvement.',
        difficulty: 'advanced',
        subject: 'business',
        keywords: ['agile', 'scrum', 'kanban', 'iterative', 'collaboration']
      },
      {
        id: 'team-collaboration-006',
        topic: 'team collaboration',
        grade: 'basic',
        type: 'example',
        language: 'en',
        content: 'Successful team collaboration requires clear roles, open communication channels, and shared goals. Regular team meetings, collaborative tools, and conflict resolution skills are essential for project success.',
        difficulty: 'basic',
        subject: 'business',
        keywords: ['collaboration', 'teamwork', 'communication', 'meetings', 'goals']
      }
    ]

    // Simple similarity matching based on keywords and topic overlap
    const scoredContent = educationalDatabase
      .filter(block => {
        if (grade && block.grade !== grade) return false
        if (subject && block.subject !== subject) return false
        return true
      })
      .map(block => {
        // Calculate similarity score based on keyword overlap and topic matching
        const queryLower = query.toLowerCase()
        const topicMatch = block.topic.toLowerCase().includes(queryLower) ? 0.5 : 0
        const keywordMatches = block.keywords.filter(keyword => 
          queryLower.includes(keyword.toLowerCase())
        ).length
        const keywordScore = (keywordMatches / block.keywords.length) * 0.5
        
        const similarity = Math.min(topicMatch + keywordScore, 1.0)

        return {
          id: block.id,
          content: block.content,
          similarity,
          metadata: {
            topic: block.topic,
            grade: block.grade,
            type: block.type,
            language: block.language,
            difficulty: block.difficulty,
            subject: block.subject,
            keywords: block.keywords,
            created_at: new Date().toISOString()
          }
        }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    return scoredContent
  }

  /**
   * Populate initial educational content vectors
   */
  static async populateEducationalVectors(): Promise<void> {
    try {
      console.log('🚀 Starting educational vectors population...')

      const educationalBlocks: EducationalBlock[] = [
        {
          id: 'project-mgmt-basics-001',
          topic: 'project management fundamentals',
          grade: 'intermediate',
          type: 'lesson_block',
          language: 'en',
          content: 'Project management is the practice of planning, organizing, and managing resources to achieve specific goals within defined constraints. The project lifecycle includes five key phases: initiation where project scope and objectives are defined, planning where detailed roadmaps and resource allocation occur, execution where the actual work is performed, monitoring and controlling where progress is tracked and adjustments made, and closure where deliverables are finalized and lessons learned are documented.',
          difficulty: 'basic',
          subject: 'business',
          keywords: ['project', 'management', 'planning', 'execution', 'monitoring', 'lifecycle']
        },
        {
          id: 'project-mgmt-tools-002',
          topic: 'project management tools',
          grade: 'intermediate',
          type: 'concept',
          language: 'en',
          content: 'Modern project management relies on various tools and techniques. Gantt charts provide visual timeline representation showing task dependencies and critical paths. Kanban boards offer workflow visualization with columns representing different stages of work. Risk registers systematically track potential issues and mitigation strategies. Digital tools like Asana, Trello, Microsoft Project, and Jira automate scheduling, resource allocation, and progress tracking.',
          difficulty: 'intermediate',
          subject: 'business',
          keywords: ['tools', 'gantt', 'kanban', 'software', 'automation', 'digital', 'scheduling']
        },
        {
          id: 'leadership-skills-003',
          topic: 'leadership in projects',
          grade: 'advanced',
          type: 'lesson_block',
          language: 'en',
          content: 'Project leadership transcends traditional management by inspiring teams toward common goals. Effective project leaders demonstrate emotional intelligence, adapt communication styles to different stakeholders, make data-driven decisions under pressure, and create psychological safety for innovation. They balance competing priorities while maintaining team motivation, resolve conflicts constructively, and ensure alignment between project objectives and organizational strategy.',
          difficulty: 'advanced',
          subject: 'business',
          keywords: ['leadership', 'communication', 'decision-making', 'motivation', 'stakeholders', 'emotional intelligence']
        },
        {
          id: 'risk-management-004',
          topic: 'project risk management',
          grade: 'intermediate',
          type: 'concept',
          language: 'en',
          content: 'Risk management is a systematic approach to identifying, analyzing, and responding to project uncertainties. The process begins with risk identification through brainstorming, expert interviews, and historical data analysis. Qualitative and quantitative risk analysis assess probability and impact. Response strategies include avoidance (eliminating risk), mitigation (reducing probability or impact), transfer (insurance or outsourcing), and acceptance (contingency planning). Regular risk monitoring ensures early detection and response.',
          difficulty: 'intermediate',
          subject: 'business',
          keywords: ['risk', 'assessment', 'mitigation', 'analysis', 'strategy', 'uncertainty', 'probability']
        },
        {
          id: 'agile-methodology-005',
          topic: 'agile project management',
          grade: 'advanced',
          type: 'lesson_block',
          language: 'en',
          content: 'Agile methodology revolutionizes project management through iterative development, customer collaboration, and adaptive planning. Scrum framework organizes work into sprints with defined roles (Product Owner, Scrum Master, Development Team) and ceremonies (Sprint Planning, Daily Standups, Sprint Review, Retrospective). Kanban emphasizes continuous flow and work-in-progress limits. Both frameworks promote transparency, inspection, and adaptation while delivering value incrementally.',
          difficulty: 'advanced',
          subject: 'business',
          keywords: ['agile', 'scrum', 'kanban', 'iterative', 'collaboration', 'sprints', 'continuous']
        }
      ]

      for (const block of educationalBlocks) {
        await this.insertEducationalVector(block)
        console.log(`✅ Inserted vector for: ${block.topic}`)
      }

      console.log('📚 Educational vectors population completed!')

    } catch (error) {
      console.error('Error populating educational vectors:', error)
      throw error
    }
  }

  /**
   * Build enhanced prompt with contextual information
   */
  static buildPromptWithContext(
    topic: string,
    grade: string,
    contextFragments: string[],
    config: any
  ): string {
    const contextSection = contextFragments.length > 0 
      ? `\n\nRELEVANT EDUCATIONAL CONTEXT:\n${contextFragments.map((fragment, index) => `${index + 1}. ${fragment}`).join('\n\n')}\n\nUse this context to enhance your lesson with specific examples and build upon these concepts.`
      : ''

    return `You are an expert ${config.personality} professor teaching about ${topic}.

Create a ${config.duration}-minute educational lesson for ${grade} level students.${contextSection}

Requirements:
- Speak in a ${config.voiceStyle} teaching style
- Divide the content into ${config.duration} segments of approximately 1 minute each
- Each segment should be clearly marked with [SEGMENT X] headers
- Use ${config.interactionLevel} level of student interaction prompts
- Make it engaging and educational with practical examples
- Build upon the provided context when relevant
- Include real-world applications and case studies

Format your response as:
[SEGMENT 1]
Content for first minute...

[SEGMENT 2]
Content for second minute...

And so on for ${config.duration} segments.

Begin the lesson now:`
  }
} 