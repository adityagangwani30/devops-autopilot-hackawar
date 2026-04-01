import { Octokit } from '@octokit/rest';

/**
 * Handles posting comments to GitHub pull requests
 */
export function createCommenter(octokit: Octokit) {
  return {
    /**
     * Post a comment with optimization suggestions to a pull request
     */
    async postComment(
      owner: string,
      repo: string,
      pullNumber: number,
      suggestions: string[]
    ): Promise<void> {
      // Filter out any empty or invalid suggestions
      const validSuggestions = suggestions.filter(
        suggestion => suggestion && suggestion.trim().length > 0
      );
      
      if (validSuggestions.length === 0) {
        return;
      }
      
      // Create the comment body
      const commentBody = `
## ⚡ CI/CD Optimization Suggestions

${validSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

*These suggestions are generated automatically by the CI/CD optimization bot.*
      `.trim();
      
      try {
        // Check if we've already commented recently to avoid duplicates
        const existingComment = await this.findRecentBotComment(
          owner,
          repo,
          pullNumber
        );
        
        if (existingComment) {
          // Update existing comment instead of creating a new one
          await octokit.issues.updateComment({
            owner,
            repo,
            comment_id: existingComment.id,
            body: commentBody
          });
        } else {
          // Create a new comment
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number: pullNumber,
            body: commentBody
          });
        }
      } catch (error) {
        console.error('Error posting comment to PR:', error);
        throw error;
      }
    },
    
    /**
     * Post a raw markdown comment to a pull request.
     * Used by the PR bot feature (ai-comment-generator).
     */
    async postRawComment(
      owner: string,
      repo: string,
      pullNumber: number,
      body: string
    ): Promise<void> {
      try {
        const existingComment = await this.findBotComment(
          owner,
          repo,
          pullNumber,
          'AI-Powered PR Review',
        );

        if (existingComment) {
          await octokit.issues.updateComment({
            owner,
            repo,
            comment_id: existingComment.id,
            body,
          });
        } else {
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number: pullNumber,
            body,
          });
        }
      } catch (error) {
        console.error('Error posting raw comment to PR:', error);
        throw error;
      }
    },

    /**
     * Find a recent comment made by this bot on the PR
     * This helps avoid duplicate comments
     */
    async findRecentBotComment(
      owner: string,
      repo: string,
      pullNumber: number
    ): Promise<{id: number} | null> {
      return this.findBotComment(owner, repo, pullNumber, 'CI/CD optimization bot');
    },

    /**
     * Generic helper: find a bot comment that contains the given signature.
     */
    async findBotComment(
      owner: string,
      repo: string,
      pullNumber: number,
      signature: string
    ): Promise<{id: number} | null> {
      try {
        const response = await octokit.issues.listComments({
          owner,
          repo,
          issue_number: pullNumber
        });

        for (const comment of response.data) {
          if (
            comment.body &&
            comment.body.includes(signature) &&
            new Date(comment.updated_at).getTime() > Date.now() - 3600000
          ) {
            return { id: comment.id };
          }
        }

        return null;
      } catch (error) {
        console.error('Error checking for existing bot comments:', error);
        return null;
      }
    }
  };
}