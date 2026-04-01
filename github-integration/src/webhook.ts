import { Request, Response } from 'express';
import { octokit } from './github';
import WorkflowAnalyzer from './analyzer';
import { createCommenter } from './commenter';

/**
 * Create a webhook handler for GitHub events
 */
export function createWebhookHandler() {
  return async (req: Request, res: Response) => {
    try {
      // GitHub sends the event type in the X-GitHub-Event header
      const eventType = req.headers['x-github-event'] as string;
      
      // Log received event (in production, use proper logger)
      console.log(`Received GitHub event: ${eventType}`);
      
      // We only care about pull_request events
      if (eventType !== 'pull_request') {
        res.status(200).send('Event ignored');
        return;
      }
      
      const payload = req.body;
      
      // Check if this is an opened or synchronized PR
      const action = payload.action;
      if (action !== 'opened' && action !== 'synchronize') {
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
      
      console.log(`Analyzing PR #${prNumber} in ${repoOwner}/${repoName}`);
      
      // Get workflow files from the repository
      const workflowFiles = await getWorkflowFiles(repoOwner, repoName, pullRequest.head.sha);
      
      if (workflowFiles.length === 0) {
        console.log('No workflow files found');
        res.status(200).send('No workflow files found');
        return;
      }
      
      // Analyze each workflow file
      const analyzer = new WorkflowAnalyzer(octokit);
      const commenter = createCommenter(octokit);
      let allSuggestions: string[] = [];
      
      for (const workflowFile of workflowFiles) {
        try {
          const suggestions = analyzer.analyzeWorkflow(workflowFile.name, workflowFile.content);
          allSuggestions = [...allSuggestions, ...suggestions];
        } catch (error) {
          console.error(`Error analyzing workflow ${workflowFile.name}:`, error);
          // Continue with other workflows
        }
      }
      
      // If we have suggestions, post them as a comment
      if (allSuggestions.length > 0) {
        await commenter.postComment(repoOwner, repoName, prNumber, allSuggestions);
        console.log(`Posted ${allSuggestions.length} suggestions to PR #${prNumber}`);
      } else {
        console.log('No optimization suggestions found');
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
async function getWorkflowFiles(owner: string, repo: string, ref: string): Promise<Array<{name: string, content: string}>> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: '.github/workflows',
      ref
    });
    
    // If response is an array, we have multiple files
    if (Array.isArray(response.data)) {
      const workflowFiles: Array<{name: string, content: string}> = [];
      
      for (const file of response.data) {
        // Only process files (not directories)
        if (file.type === 'file' && (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))) {
          // Fetch the file content
          const contentResponse = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref
          });
          
          // If content is a string (not an object), decode it
          if (typeof contentResponse.data === 'string') {
            // Content is already a string
            workflowFiles.push({
              name: file.name,
              content: contentResponse.data
            });
          } else if ('content' in contentResponse.data) {
            // Content is base64 encoded
            const content = Buffer.from(contentResponse.data.content, 'base64').toString('utf-8');
            workflowFiles.push({
              name: file.name,
              content
            });
          }
        }
      }
      
      return workflowFiles;
    }
    
    // Single file response
    const fileData = response.data as any;
    if (fileData && typeof fileData === 'object' && 
        'type' in fileData && fileData.type === 'file' && 
        'name' in fileData && 
        (fileData.name.endsWith('.yml') || fileData.name.endsWith('.yaml'))) {
      
      if (typeof fileData === 'string') {
        // This case shouldn't happen based on our condition, but just in case
        return [{
          name: 'workflow.yml', // Default name
          content: fileData
        }];
      } else if (fileData && typeof fileData === 'object' && 'content' in fileData) {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return [{
          name: fileData.name,
          content
        }];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching workflow files:', error);
    return [];
  }
}