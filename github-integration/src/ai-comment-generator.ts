/**
 * ai-comment-generator.ts
 *
 * Calls the NVIDIA API (OpenAI-compatible endpoint) to generate an
 * AI-powered review comment for a pull request.  Falls back to a static
 * markdown template when the API key is not configured or the request
 * fails, so the bot never crashes the server.
 */

import https from 'https';
import { IncomingMessage } from 'http';

/** Shape of the PR metadata passed into the generator. */
export interface PRData {
  title: string;
  body: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  htmlUrl: string;
}

/**
 * Build the prompt sent to the NVIDIA LLM.
 */
function buildPrompt(pr: PRData): string {
  return [
    'You are a senior software engineer reviewing a GitHub pull request.',
    'Generate a helpful review comment in clean GitHub-flavoured markdown.',
    '',
    `**PR Title:** ${pr.title}`,
    `**Author:** ${pr.author}`,
    `**Description:** ${pr.body || '_No description provided._'}`,
    `**Lines added:** ${pr.additions}  |  **Lines deleted:** ${pr.deletions}`,
    `**Files changed:** ${pr.changedFiles}`,
    '',
    'Your comment must include:',
    '1. A brief summary of what this PR does (2-3 sentences).',
    '2. Any obvious risks or things to double-check.',
    '3. A checklist:  - [ ] Tests added  - [ ] Docs updated  - [ ] No hardcoded secrets',
    '4. A friendly, encouraging closing line.',
    '',
    'Keep the tone constructive and concise. Do NOT wrap the response in a code block.',
  ].join('\n');
}

/**
 * Call the NVIDIA API and return the generated comment text.
 * Uses the built-in `https` module to avoid extra dependencies.
 */
async function callNvidiaApi(prompt: string, apiKey: string): Promise<string> {
  const payload = JSON.stringify({
    model: 'nvidia/nemotron-3-super-120b-a12b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    top_p: 1,
    max_tokens: 2048,
    stream: false,
  });

  return new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res: IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json?.choices?.[0]?.message?.content;
            if (typeof text === 'string' && text.trim().length > 0) {
              resolve(text.trim());
            } else {
              reject(new Error('Empty or invalid AI response'));
            }
          } catch (err) {
            reject(new Error(`Failed to parse NVIDIA API response: ${err}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Build a static fallback comment using just the PR metadata.
 */
function buildStaticComment(pr: PRData): string {
  return [
    '## 🤖 PR Bot Review',
    '',
    `**${pr.title}** by @${pr.author}`,
    '',
    `> +${pr.additions} additions, -${pr.deletions} deletions across ${pr.changedFiles} file(s).`,
    '',
    '### Checklist',
    '- [ ] Tests added',
    '- [ ] Docs updated',
    '- [ ] No hardcoded secrets',
    '',
    '_This is an automated comment. AI analysis was unavailable — please review manually._',
  ].join('\n');
}

/**
 * Generate a PR review comment.  Uses AI when possible, static template
 * otherwise.
 */
export async function generatePRComment(pr: PRData): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.log('NVIDIA_API_KEY not set — using static template');
    return buildStaticComment(pr);
  }

  try {
    const prompt = buildPrompt(pr);
    const aiComment = await callNvidiaApi(prompt, apiKey);
    return `## 🤖 AI-Powered PR Review\n\n${aiComment}`;
  } catch (error) {
    console.error('NVIDIA API call failed, falling back to static template:', error);
    return buildStaticComment(pr);
  }
}
