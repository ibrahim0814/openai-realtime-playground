import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  // For Realtime API, we return the API key directly since WebSocket authentication
  // is done via the Authorization header in the WebSocket connection
  return NextResponse.json({
    apiKey: apiKey,
    model: 'gpt-4o-realtime-preview-2024-12-17',
    config: {
      modalities: ['audio', 'text'],
      instructions: 'You are a helpful voice assistant. Respond naturally and conversationally. Always provide both audio and text responses so users can see transcripts of what you say.',
      voice: 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      temperature: 0.8,
      max_response_output_tokens: 250,
    }
  });
}
