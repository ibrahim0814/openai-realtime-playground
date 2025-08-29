'use client';

import { useState } from 'react';
import { useRealtimeAPI } from '../hooks/useRealtimeAPI';

export default function RealtimeInterface() {
  const {
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
  } = useRealtimeAPI();

  const [textInput, setTextInput] = useState('');

  const handleSendText = () => {
    if (textInput.trim()) {
      sendText(textInput);
      setTextInput('');
    }
  };

  const handleConnect = async () => {
    // Initialize audio context on user interaction (required by browsers)
    try {
      const audioContext = new AudioContext();
      await audioContext.resume();
      audioContext.close();
    } catch (err) {
      console.warn('Could not initialize audio context:', err);
    }
    connect();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          OpenAI Realtime API Playground
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={isConnected ? disconnect : handleConnect}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isConnected
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Audio Controls */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Voice Input</h2>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              !isConnected
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRecording ? '🔴 Stop Recording' : '🎤 Start Recording'}
          </button>

          {/* Transcription Display */}
          {transcription && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <div className="text-sm text-blue-300 mb-1">Live Transcription:</div>
              <div className="text-white font-medium">{transcription}</div>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Text Input</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendText}
              disabled={!isConnected || !textInput.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Conversation</h2>
          <div className="h-64 overflow-y-auto space-y-3 bg-gray-900 rounded-lg p-3">
            {conversation.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Start a conversation to see messages here!
              </div>
            ) : (
              <>
                {conversation.map((item, index) => (
                  <div key={item.id || index} className={`p-3 rounded-lg ${
                    item.role === 'user'
                      ? 'bg-blue-900/30 border-l-4 border-blue-500 ml-4'
                      : 'bg-green-900/30 border-l-4 border-green-500 mr-4'
                  }`}>
                    <div className={`text-sm font-semibold ${
                      item.role === 'user' ? 'text-blue-300' : 'text-green-300'
                    }`}>
                      {item.role === 'user' ? '👤 You' : '🤖 Assistant'}
                      <span className="text-xs text-gray-500 ml-2">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white mt-1">{item.content}</div>
                  </div>
                ))}
                
                {/* Show current response being generated */}
                {currentResponse && (
                  <div className="bg-green-900/30 border-l-4 border-green-500 mr-4 p-3 rounded-lg">
                    <div className="text-sm font-semibold text-green-300">
                      🤖 Assistant
                      <span className="text-xs text-gray-500 ml-2">responding...</span>
                    </div>
                    <div className="text-white mt-1">{currentResponse}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Event Log */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Technical Events</h2>
          <div className="h-64 overflow-y-auto space-y-2 bg-gray-900 rounded-lg p-3">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No events yet. Connect and start interacting!
              </div>
            ) : (
              messages.slice(-20).map((msg, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-800 rounded border border-gray-700 text-xs font-mono"
                >
                  <div className="text-blue-400 font-semibold">{msg.type}</div>
                  {msg.type === 'response.text.delta' && msg.delta && (
                    <div className="text-green-400 mt-1">{msg.delta}</div>
                  )}
                  {msg.type === 'conversation.item.created' && msg.item && (
                    <div className="text-yellow-400 mt-1">
                      Role: {msg.item.role}
                    </div>
                  )}
                  {msg.error && (
                    <div className="text-red-400 mt-1">
                      Error: {msg.error.message}
                    </div>
                  )}
                  <div className="text-gray-500 mt-1 text-xs">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Connection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm">Recording</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                transcription.includes('🎤') ? 'bg-blue-500 animate-pulse' : 
                isProcessing ? 'bg-yellow-500 animate-pulse' : 
                'bg-gray-500'
              }`} />
              <span className="text-sm">
                {transcription.includes('🎤') ? 'Listening' : 
                 isProcessing ? 'Processing' : 
                 'Voice Activity'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm">
                {isPlaying ? 'Playing Audio' : 'Audio Output'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3">How to use the Voice Agent:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Make sure you have set your OpenAI API key in the .env.local file</li>
            <li>Click "Connect" to establish a connection to the Realtime API</li>
            <li><strong>Voice Input:</strong> Click "Start Recording" and speak naturally - the assistant will respond with voice</li>
            <li><strong>Text Input:</strong> Type a message and press Enter or click Send</li>
            <li>Watch the &ldquo;Live Transcription&rdquo; area for real-time speech-to-text</li>
            <li>View the conversation history to see the full dialogue</li>
            <li>The assistant will automatically detect when you stop speaking and respond</li>
            <li>Check the technical events log for detailed API interactions</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>💡 Tip:</strong> For best results, speak clearly and allow the assistant to finish responding before speaking again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
