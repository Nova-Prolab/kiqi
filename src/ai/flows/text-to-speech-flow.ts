
'use server';
/**
 * @fileOverview A text-to-speech (TTS) AI agent.
 *
 * - generateAudioNarration - A function that handles converting text to audio.
 * - GenerateNarrationInput - The input type for the generateAudioNarration function.
 * - GenerateNarrationOutput - The return type for the generateAudioNarration function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// Define schemas for clarity and type safety
const GenerateNarrationInputSchema = z.string().describe('The text to be converted to speech.');
export type GenerateNarrationInput = z.infer<typeof GenerateNarrationInputSchema>;

const GenerateNarrationOutputSchema = z.object({
  audioDataUri: z.string().describe('A data URI of the generated audio in WAV format.'),
});
export type GenerateNarrationOutput = z.infer<typeof GenerateNarrationOutputSchema>;

// The main exported function that clients will call
export async function generateAudioNarration(
  input: GenerateNarrationInput
): Promise<GenerateNarrationOutput> {
  return generateAudioNarrationFlow(input);
}

// Genkit flow definition
const generateAudioNarrationFlow = ai.defineFlow(
  {
    name: 'generateAudioNarrationFlow',
    inputSchema: GenerateNarrationInputSchema,
    outputSchema: GenerateNarrationOutputSchema,
  },
  async (text) => {
    // Call the Gemini TTS model
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard, clear voice
          },
        },
      },
      prompt: text,
    });
    
    if (!media) {
      throw new Error('No audio media was returned from the AI service.');
    }

    // The model returns raw PCM data in a base64 encoded data URI.
    // We need to convert it to a proper WAV file to be playable in browsers.
    const pcmAudioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(pcmAudioBuffer);
    
    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

/**
 * Converts raw PCM audio data into a base64 encoded WAV format string.
 * @param pcmData Buffer containing the raw PCM audio data.
 * @param channels Number of audio channels (default: 1 for mono).
 * @param rate Sample rate in Hz (default: 24000, common for TTS).
 * @param sampleWidth Bytes per sample (default: 2 for 16-bit).
 * @returns A promise that resolves with the base64 encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (chunk) => {
      bufs.push(chunk);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
