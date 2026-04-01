import { Octokit } from '@octokit/rest';

// Initialize Octokit with GitHub token from environment
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export { octokit };