import { Request, Response } from 'express';
import crypto from 'crypto';
import { octokit } from './github';
import WorkflowAnalyzer from './analyzer';
import { createCommenter } from './commenter';
import { handlePRComment, PRWebhookData } from './pr-comment';

/**
 * Verify the webhook signature using the GITHUB_WEBHOOK_SECRET env var
 * and the x-hub-signature-256 header sent by GitHub.
 * Returns true when verification is disabled (no secret configured).
 */
function verifySignature(req: Request): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // Signature verification disabled — allow the request
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) {
    return false;
  }

  const body = JSON.stringify(req.body);
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(body, 'utf-8').digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

/**
 * Create a webhook handler for GitHub events
 */
export function createWebhookHandler() {
  return async (req: Request, res: Response) => {
    try {
      // Verify webhook signature
      if (!verifySignature(req)) {
        console.log('Webhook signature verification failed');
        res.status(401).send('Invalid signature');
        return;
      }

      // GitHub sends the event type in the X-GitHub-Event header
      const eventType = req.headers['x-github-event'] as string;

      // Log received event (no raw payload — may contain secrets)
      console.log(`Received GitHub event: ${eventType}`);

      // We only care about pull_request events
      if (eventType !== 'pull_request') {
        res.status(200).send('Event ignored');
        return;
      }

      const payload = req.body;

      // Check if this is an opened, reopened, or synchronized PR
      const action = payload.action;
      if (
        action !== 'opened' &&
        action !== 'reopened' &&
        action !== 'synchronize'
      ) {
        res.status(200).send('Event ignored');
        return;
      }

      // Extract PR information
      const pullRequest = payload.pull_request;
      if (!pullRequest) {
        res.status(400).send('Invalid payload');
        return;
      }

      const repoOwner = pullRequest.base.repo.owner.login;
      const repoName = pullRequest.base.repo.name;
      const prNumber = pullRequest.number;

      console.log(`Processing PR #${prNumber} in ${repoOwner}/${repoName}`);

      // --- 1. AI-powered PR comment (new flow) ---
      const prData: PRWebhookData = {
        number: prNumber,
        title: pullRequest.title || '',
        body: pullRequest.body || '',
        author: pullRequest.user?.login || 'unknown',
        additions: pullRequest.additions ?? 0,
        deletions: pullRequest.deletions ?? 0,
        changedFiles: pullRequest.changed_files ?? 0,
        repoFullName: payload.repository?.full_name || `${repoOwner}/${repoName}`,
        headSha: pullRequest.head?.sha || '',
        htmlUrl: pullRequest.html_url || '',
      };

      // Fire-and-forget so it does not block the workflow analysis
      handlePRComment(prData).catch((err) =>
        console.error('[PR Bot] Unhandled error:', err),
      );

      // --- 2. Existing workflow analysis flow ---
      const workflowFiles = await getWorkflowFiles(
        repoOwner,
        repoName,
        pullRequest.head.sha,
      );

      if (workflowFiles.length > 0) {
        const analyzer = new WorkflowAnalyzer(octokit);
        const commenter = createCommenter(octokit);
        let allSuggestions: string[] = [];

        for (const workflowFile of workflowFiles) {
          try {
            const suggestions = analyzer.analyzeWorkflow(
              workflowFile.name,
              workflowFile.content,
            );
            allSuggestions = [...allSuggestions, ...suggestions];
          } catch (error) {
            console.error(
              `Error analyzing workflow ${workflowFile.name}:`,
              error,
            );
          }
        }

        if (allSuggestions.length > 0) {
          await commenter.postComment(
            repoOwner,
            repoName,
            prNumber,
            allSuggestions,
          );
          console.log(
            `Posted ${allSuggestions.length} suggestions to PR #${prNumber}`,
          );
        } else {
          console.log('No optimization suggestions found');
        }
      }

      res.status(200).send('Event processed');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal server error');
    }
  };
}

/**
 * Fetch workflow files from the repository
 */
async function getWorkflowFiles(
  owner: string,
  repo: string,
  ref: string,
): Promise<Array<{ name: string; content: string }>> {
  try {
    const response = await octokit.repos.getContent({ owner, repo, path: '.github/workflows', ref });

    if (Array.isArray(response.data)) {
      const workflowFiles: Array<{ name: string; content: string }> = [];

      for (const file of response.data) {
        if (
          file.type === 'file' &&
          (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))
        ) {
          const contentResponse = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref,
          });

          if (typeof contentResponse.data === 'string') {
            workflowFiles.push({ name: file.name, content: contentResponse.data });
          } else if ('content' in contentResponse.data) {
            const content = Buffer.from(
              contentResponse.data.content,
              'base64',
            ).toString('utf-8');
            workflowFiles.push({ name: file.name, content });
          }
        }
      }

      return workflowFiles;
    }

    const fileData = response.data as any;
    if (
      fileData &&
      typeof fileData === 'object' &&
      'type' in fileData &&
      fileData.type === 'file' &&
      'name' in fileData &&
      (fileData.name.endsWith('.yml') || fileData.name.endsWith('.yaml'))
    ) {
      if (typeof fileData === 'string') {
        return [{ name: 'workflow.yml', content: fileData }];
      } else if (fileData && typeof fileData === 'object' && 'content' in fileData) {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return [{ name: fileData.name, content }];
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching workflow files:', error);
    return [];
  }
}