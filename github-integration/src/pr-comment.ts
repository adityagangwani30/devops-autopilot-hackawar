/**
 * pr-comment.ts
 *
 * Orchestrator for the PR bot comment feature.
 *
 * 1. Accepts extracted PR data from the webhook handler.
 * 2. Calls the AI comment generator to produce a review comment.
 * 3. Uses the existing commenter module to post the comment to GitHub.
 * 4. Logs success or failure clearly.
 */

import { generatePRComment, PRData } from './ai-comment-generator';
import { createCommenter } from './commenter';
import { octokit } from './github';

/** Data extracted from the webhook payload by webhook.ts */
export interface PRWebhookData extends PRData {
  number: number;
  repoFullName: string;
  headSha: string;
}

/**
 * Handle a new / updated pull request:
 *   generate an AI comment and post it to the PR.
 */
export async function handlePRComment(pr: PRWebhookData): Promise<void> {
  const [owner, repo] = pr.repoFullName.split('/');

  try {
    console.log(
      `[PR Bot] Generating comment for PR #${pr.number} in ${pr.repoFullName}`,
    );

    const commentBody = await generatePRComment({
      title: pr.title,
      body: pr.body,
      author: pr.author,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      htmlUrl: pr.htmlUrl,
    });

    const commenter = createCommenter(octokit);
    await commenter.postRawComment(owner, repo, pr.number, commentBody);

    console.log(
      `[PR Bot] Successfully posted comment to PR #${pr.number}`,
    );
  } catch (error) {
    console.error(
      `[PR Bot] Failed to post comment to PR #${pr.number}:`,
      error,
    );
    // Do NOT re-throw — the server must stay up.
  }
}
