import { useCallback, useEffect, useRef, useState } from 'react';

interface RealtimeSession {
  apiKey: string;
  model: string;
  config: any;
}

interface RealtimeMessage {
  type: string;
  event_id?: string;
  [key: string]: any;
}

interface ConversationItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useRealtimeAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Create session and connect to WebSocket
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Get session token from API
      const response = await fetch('/api/realtime-session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const session: RealtimeSession = await response.json();
      
      // Connect to WebSocket using the proper authentication
      const url = `wss://api.openai.com/v1/realtime?model=${session.model}`;
      const ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${session.apiKey}`,
        'openai-beta.realtime-v1'
      ]);
      
      ws.onopen = () => {
        console.log('Connected to Realtime API');
        setIsConnected(true);
        
        // Send session update to configure audio output
        ws.send(JSON.stringify({
          type: 'session.update',
          session: session.config
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received:', message);
        setMessages(prev => [...prev, message]);

        // Handle different event types
        switch (message.type) {
          case 'session.created':
            console.log('Session created:', message.session);
            break;

          case 'session.updated':
            console.log('Session updated:', message.session);
            break;

          case 'input_audio_buffer.speech_started':
            console.log('Speech started');
            setTranscription('🎤 Listening...');
            setIsProcessing(false);
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('Speech stopped');
            setTranscription('⏳ Processing...');
            setIsProcessing(true);
            break;

          case 'input_audio_buffer.committed':
            console.log('Audio buffer committed');
            // Trigger response generation after committing audio
            ws.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text']
              }
            }));
            break;

          case 'conversation.item.created':
            console.log('Conversation item created:', message.item);
            if (message.item) {
              const content = message.item.content?.[0]?.text || 
                            message.item.content?.[0]?.input_text || 
                            message.item.content?.[0]?.transcript ||
                            (message.item.role === 'user' ? 'Voice message' : '');
              
              // Only add user messages immediately, assistant messages will be built from deltas
              if (message.item.role === 'user' && content) {
                setConversation(prev => [...prev, {
                  id: message.item.id,
                  role: message.item.role,
                  content: content,
                  timestamp: new Date()
                }]);
              }
            }
            break;

          case 'response.created':
            console.log('Response created');
            setTranscription('🤖 Generating response...');
            setCurrentResponse('');
            break;

          case 'response.audio.delta':
            if (message.delta) {
              playAudioDelta(message.delta);
            }
            break;

          case 'response.audio_transcript.delta':
            if (message.delta) {
              setCurrentResponse(prev => prev + message.delta);
            }
            break;

          case 'response.text.delta':
            if (message.delta) {
              setCurrentResponse(prev => prev + message.delta);
            }
            break;

          case 'response.output_item.added':
            console.log('Response output item added:', message.item);
            break;

          case 'response.content_part.added':
            console.log('Response content part added:', message.part);
            break;

          case 'response.audio_transcript.done':
            console.log('Audio transcript completed:', message.transcript);
            if (message.transcript && !currentResponse.includes(message.transcript)) {
              setCurrentResponse(prev => prev + message.transcript);
            }
            break;

          case 'response.done':
            console.log('Response completed');
            setTranscription('');
            setIsProcessing(false);
            
            // Add the complete response to conversation if we have text
            if (currentResponse.trim()) {
              setConversation(prev => [...prev, {
                id: message.response?.id || Date.now().toString(),
                role: 'assistant',
                content: currentResponse.trim(),
                timestamp: new Date()
              }]);
            } else {
              // If no text transcript, add a placeholder for audio-only response
              setConversation(prev => [...prev, {
                id: message.response?.id || Date.now().toString(),
                role: 'assistant',
                content: '🔊 Audio response (no transcript available)',
                timestamp: new Date()
              }]);
            }
            setCurrentResponse('');
            break;

          case 'error':
            console.error('API Error:', message.error);
            setError(`API Error: ${message.error.message}`);
            break;

          default:
            console.log('Unhandled event type:', message.type);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };
      
      ws.onclose = () => {
        console.log('Disconnected from Realtime API');
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsConnected(false);
    setIsRecording(false);
  }, [isRecording]);

  // Start recording audio with optimized streaming
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;

      // Create AudioContext for processing
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Use AudioWorklet for better performance (fallback to ScriptProcessor if not supported)
      if (audioContextRef.current.audioWorklet) {
        try {
          await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
          const processor = new AudioWorkletNode(audioContextRef.current, 'audio-processor');

          processor.port.onmessage = (event) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              // Send audio data to the API
              wsRef.current.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: event.data.audio
              }));
            }
          };

          source.connect(processor);
          processor.connect(audioContextRef.current.destination);
        } catch (workletError) {
          console.warn('AudioWorklet not available, falling back to ScriptProcessor');
          setupScriptProcessor(source);
        }
      } else {
        setupScriptProcessor(source);
      }

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  }, []);

  // Setup ScriptProcessor as fallback
  const setupScriptProcessor = useCallback((source: MediaStreamAudioSourceNode) => {
    const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to PCM16
        const pcm16 = convertToPCM16(inputData);

        // Send audio data to the API
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)))
        }));
      }
    };

    source.connect(processor);
    processor.connect(audioContextRef.current!.destination);
  }, []);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Commit the audio buffer
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
    
    setIsRecording(false);
  }, []);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: text
          }]
        }
      }));
      
      // Trigger response generation with audio
      wsRef.current.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text']
        }
      }));
    }
  }, []);

  // Convert Float32Array to PCM16
  function convertToPCM16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return int16Array;
  }

  // Initialize playback audio context
  const initializePlaybackAudioContext = useCallback(async () => {
    if (!playbackAudioContextRef.current) {
      playbackAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Resume context if it's suspended (required by browser policies)
      if (playbackAudioContextRef.current.state === 'suspended') {
        await playbackAudioContextRef.current.resume();
      }
    }
    return playbackAudioContextRef.current;
  }, []);

  // Play audio delta with proper PCM16 decoding
  const playAudioDelta = useCallback(async (base64Audio: string) => {
    try {
      const audioContext = await initializePlaybackAudioContext();

      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 bytes to Float32 samples
      const pcm16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(pcm16Array.length);

      for (let i = 0; i < pcm16Array.length; i++) {
        // Convert from 16-bit signed integer to float32 (-1.0 to 1.0)
        float32Array[i] = pcm16Array[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Queue the audio buffer for playback
      audioQueueRef.current.push(audioBuffer);

      // Start playing if not already playing
      if (!isPlayingRef.current && audioQueueRef.current.length > 0) {
        playNextAudioBuffer();
      }
    } catch (err) {
      console.error('Error playing audio delta:', err);
    }
  }, [initializePlaybackAudioContext]);

  // Play the next audio buffer in the queue
  const playNextAudioBuffer = useCallback(async () => {
    if (!playbackAudioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const audioBuffer = audioQueueRef.current.shift();
    if (!audioBuffer) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    const source = playbackAudioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackAudioContextRef.current.destination);

    source.onended = () => {
      // Play next buffer when current one ends
      setTimeout(() => playNextAudioBuffer(), 10); // Small delay to prevent audio gaps
    };

    source.start();
    console.log('Playing audio chunk, duration:', audioBuffer.duration);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    messages,
    conversation,
    error,
    transcription,
    currentResponse,
    isPlaying,
    isProcessing,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendText,
  };
}
