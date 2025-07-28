import { NextRequest, NextResponse } from 'next/server'
import { VoiceSessionService } from '@/lib/services/voiceSessionService'

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'create':
        const { studentId, lessonId, courseId, config } = data
        const session = await VoiceSessionService.createVoiceSession(
          studentId,
          lessonId,
          courseId,
          config
        )
        return NextResponse.json({ success: true, session })

      case 'updateStatus':
        const { sessionId, status, currentSegment } = data
        await VoiceSessionService.updateSessionStatus(sessionId, status, currentSegment)
        return NextResponse.json({ success: true })

      case 'getSession':
        const { sessionId: getSessionId } = data
        const sessionData = await VoiceSessionService.getVoiceSession(getSessionId)
        return NextResponse.json({ success: true, session: sessionData })

      case 'getActiveSession':
        const { studentId: activeStudentId, lessonId: activeLessonId } = data
        const activeSession = await VoiceSessionService.getActiveSession(activeStudentId, activeLessonId)
        return NextResponse.json({ success: true, session: activeSession })

      case 'saveMessage':
        const { sessionId: msgSessionId, studentId: msgStudentId, type, content, audioUrl, metadata } = data
        const message = await VoiceSessionService.saveConversationMessage(
          msgSessionId,
          msgStudentId,
          type,
          content,
          audioUrl,
          metadata
        )
        return NextResponse.json({ success: true, message })

      case 'getHistory':
        const { sessionId: historySessionId } = data
        const history = await VoiceSessionService.getConversationHistory(historySessionId)
        return NextResponse.json({ success: true, history })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Voice session API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 