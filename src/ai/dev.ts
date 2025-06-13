// This file is used to run Genkit flows locally using `genkit start`.
// Import flows here to ensure they are registered with the Genkit development server.
import '@/ai/flows/send-leave-notification-flow';
// If you create more flows, import them here as well.

console.log('Genkit development server started with registered flows.');
