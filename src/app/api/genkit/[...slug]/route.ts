import { genkitNextHandler } from '@genkit-ai/next';

// Ensure this API route runs on the Node.js runtime
export const runtime = 'nodejs';

// Import your flows here to ensure they are registered with the Genkit AI instance
// when requests are handled by the Next.js server.
import '@/ai/flows/send-leave-notification-flow';
// If you create more flows, import them here as well.

export const { GET, POST } = genkitNextHandler();
