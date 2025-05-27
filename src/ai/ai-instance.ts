
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts', // This might not be used if prompts are defined inline
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // You can specify a default model for text generation here if desired
      // defaultModel: 'gemini-1.5-flash-latest', 
    }),
  ],
  // Explicitly set a default model for ai.generate calls if not specified in the call itself
  // This ensures ai.generate has a model if the prompt doesn't specify one.
  // However, for `ai.definePrompt`, the model choice is often more contextual.
  // For the email generation prompt, gemini-1.5-flash should be good.
  // model: 'googleai/gemini-1.5-flash-latest', // Using a specific gemini model
});
