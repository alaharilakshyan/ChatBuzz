'use server'

import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

interface ChatMessage {
  sender: string
  content: string
}

// Helper to check API Key availability
const hasApiKey = () => !!process.env.GEMINI_API_KEY

/**
 * 💡 Smart Replies generator Server Action
 */
export async function generateSmartRepliesAction(chatHistory: ChatMessage[]) {
  if (!chatHistory || chatHistory.length === 0) {
    return { suggestions: ["Hey! How are you?", "What's up?", "Hello!"] }
  }

  // 1. Fallback if no Gemini key is set in environment yet
  if (!hasApiKey()) {
    console.log('Gemini API key is not configured. Serving local fallback smart replies.')
    const contextText = chatHistory[chatHistory.length - 1]?.content.toLowerCase() || ''
    
    if (contextText.includes('hello') || contextText.includes('hey') || contextText.includes('hi')) {
      return { suggestions: ["Hey there!", "Hi! How's it going?", "Hello! What's new?"] }
    }
    if (contextText.includes('yes') || contextText.includes('sure') || contextText.includes('ok')) {
      return { suggestions: ["Awesome!", "Perfect, thanks!", "Sounds like a plan!"] }
    }
    if (contextText.includes('map') || contextText.includes('where')) {
      return { suggestions: ["Checking the map now!", "I'm sharing my location.", "Let me see where you are."] }
    }
    return { suggestions: ["Sounds good!", "I will check that out.", "Talk to you soon!"] }
  }

  try {
    const historyPrompt = chatHistory
      .slice(-5)
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join('\n')

    const prompt = `
You are an AI chat assistant. Based on the following last 5 messages of a chat history, generate exactly 3 short, natural, context-aware suggested smart replies that the user can click to send instantly.
Keep each reply under 5 words. Do not include quotes or numbers. Output each reply on a new line.

Chat History:
${historyPrompt}

Suggested Replies:
`

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      temperature: 0.7,
    })

    const suggestions = text
      .split('\n')
      .map((line) => line.replace(/^[-\d.\s"']+|["']+$/g, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 3)

    // Ensure we always return exactly 3 replies
    while (suggestions.length < 3) {
      suggestions.push("Sounds good!")
    }

    return { suggestions }
  } catch (err) {
    console.error('Error generating smart replies from Gemini:', err)
    return { suggestions: ["Sounds good!", "I'll check it out.", "Talk to you later."] }
  }
}

/**
 * 🪄 Conversation Summarizer Server Action
 */
export async function summarizeConversationAction(chatHistory: ChatMessage[]) {
  if (!chatHistory || chatHistory.length === 0) {
    return { summary: "No messages to summarize yet. Start talking!" }
  }

  if (!hasApiKey()) {
    console.log('Gemini API key is not configured. Serving local fallback summary.')
    const uniqueSenders = Array.from(new Set(chatHistory.map((m) => m.sender)))
    return {
      summary: `**[Demo Summary]** (Setup GEMINI_API_KEY in .env.local to stream live summaries)

* **Participants:** ${uniqueSenders.join(', ')}
* **Activity:** Exchanged ${chatHistory.length} messages.
* **Latest Topic:** "${chatHistory[chatHistory.length - 1]?.content}"`,
    }
  }

  try {
    const historyPrompt = chatHistory
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join('\n')

    const prompt = `
You are a Principal Technical Writer and Chat Assistant. Summarize the following chat transcript concisely. 
Identify key topics, decisions made, and any pending action items. 
Use clean markdown lists and bold headers. Keep the summary under 150 words.

Transcript:
${historyPrompt}
`

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
      temperature: 0.5,
    })

    return { summary: text.trim() }
  } catch (err: any) {
    console.error('Error summarizing chat conversation:', err)
    return { error: `Failed to generate summary: ${err.message}` }
  }
}
