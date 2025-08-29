# OpenAI Realtime API Playground

A Next.js application for experimenting with OpenAI's Realtime API, featuring voice and text interactions with GPT-4 in real-time.

## Features

- 🎤 **Voice Input**: Record audio and send it directly to the AI
- 💬 **Text Input**: Type messages for text-based interactions
- 🔊 **Voice Output**: Receive audio responses from the AI
- 🌐 **WebSocket Connection**: Real-time bidirectional communication
- 📝 **Event Logging**: Monitor all API events and responses
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- OpenAI API key with access to the Realtime API
- Modern browser with WebSocket and MediaRecorder support

## Setup

1. **Clone the repository**:
   ```bash
   cd ~/repos/openai-realtime-playground
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.local.example` to `.env.local`
   - Add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Connect**: Click the "Connect" button to establish a WebSocket connection
2. **Interact**:
   - **Voice**: Click "Start Recording" to speak, then "Stop Recording" when done
   - **Text**: Type a message and press Enter or click Send
3. **Monitor**: Watch the event log to see real-time API responses

## Architecture

### Components

- **`RealtimeInterface`**: Main UI component for user interactions
- **`useRealtimeAPI`**: Custom React hook managing WebSocket connection and audio processing
- **API Route**: Secure server-side endpoint for generating session tokens

### Key Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **WebSocket**: Real-time communication
- **Web Audio API**: Audio recording and processing

## API Configuration

The application uses the following Realtime API settings:

- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Modalities**: Audio and Text
- **Voice**: Alloy
- **Turn Detection**: Server VAD (Voice Activity Detection)
- **Audio Format**: PCM16 @ 24kHz

## Troubleshooting

### Connection Issues
- Verify your API key is correctly set in `.env.local`
- Check that your API key has access to the Realtime API
- Ensure you're using a supported browser

### Audio Issues
- Grant microphone permissions when prompted
- Check your browser's audio settings
- Verify your microphone is working properly

### WebSocket Issues
- Check browser console for error messages
- Ensure you're not behind a restrictive firewall
- Try refreshing the page if connection fails

## Development

To modify the application:

1. **UI Changes**: Edit `src/app/components/RealtimeInterface.tsx`
2. **API Logic**: Modify `src/app/hooks/useRealtimeAPI.ts`
3. **Session Config**: Update `src/app/api/realtime-session/route.ts`
4. **Styling**: Modify Tailwind classes or `src/app/globals.css`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure the platform supports:
- Node.js 18+
- WebSocket connections
- Environment variables
- Server-side API routes

## Security Notes

- Never expose your API key in client-side code
- The session token approach ensures secure authentication
- Tokens are ephemeral and expire automatically
- All API communication happens over secure WebSocket (WSS)

## Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [Next.js Documentation](https://nextjs.org/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Consult the OpenAI API documentation
4. Open an issue on GitHub

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
