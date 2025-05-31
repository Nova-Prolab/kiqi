
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-chapter-summary.ts';
import '@/ai/flows/translate-chapter-flow.ts';
import '@/ai/flows/enhance-text-flow.ts'; // Added new flow
