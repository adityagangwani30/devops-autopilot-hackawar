import yaml from 'js-yaml';
import { Octokit } from '@octokit/rest';

/**
 * Analyze GitHub Actions workflow files for optimization opportunities
 */
export class WorkflowAnalyzer {
  constructor(private octokit: Octokit) {}

  /**
   * Analyze a workflow file content for potential improvements
   */
  analyzeWorkflow(workflowName: string, content: string): string[] {
    const suggestions: string[] = [];
    let workflowJson: any;

    try {
      workflowJson = yaml.load(content);
    } catch (error) {
      // If YAML parsing fails, skip this workflow
      return [`⚠️ Could not parse workflow "${workflowName}" - invalid YAML`];
    }

    if (!workflowJson || typeof workflowJson !== 'object') {
      return [];
    }

    // Check for jobs
    if (!workflowJson.jobs || typeof workflowJson.jobs !== 'object') {
      return [];
    }

    const jobs = workflowJson.jobs;
    const jobNames = Object.keys(jobs);

    // Rule 1: Check for missing dependency caching
    for (const jobName of jobNames) {
      const job = jobs[jobName];
      if (!job || typeof job !== 'object') continue;

      const steps = job.steps || [];
      if (!Array.isArray(steps)) continue;

      let hasInstallStep = false;
      let hasCacheStep = false;
      let installStepIndex = -1;

      // Check each step for install commands and cache usage
      steps.forEach((step: any, index: number) => {
        if (!step || typeof step !== 'object') return;

        // Look for install commands
        const run = step.run;
        if (typeof run === 'string') {
          const lowerRun = run.toLowerCase();
          if (
            lowerRun.includes('npm install') ||
            lowerRun.includes('yarn install') ||
            lowerRun.includes('pnpm install') ||
            lowerRun.includes('pip install') ||
            lowerRun.includes('bundle install') ||
            lowerRun.includes('composer install')
          ) {
            hasInstallStep = true;
            installStepIndex = index;
          }
        }

        // Look for cache actions
        const uses = step.uses;
        if (typeof uses === 'string' && uses.includes('actions/cache')) {
          hasCacheStep = true;
        }
      });

      // If we found install steps but no cache, suggest adding cache
      if (hasInstallStep && !hasCacheStep) {
        suggestions.push(
          `⚡ Job "${jobName}": Consider adding dependency caching using actions/cache to reduce build time.`
        );
      }

      // Rule 2: Check if all steps are in a single job (no parallelization)
      if (jobNames.length === 1 && steps.length > 3) {
        // Only suggest if there are multiple steps that could be parallelized
        suggestions.push(
          `⚡ Consider splitting jobs into parallel steps to speed up execution.`
        );
        break; // Only need to suggest once per workflow
      }

      // Rule 3: Check for missing matrix strategy
      const strategy = job.strategy;
      if (!strategy || typeof strategy !== 'object') {
        // Check if this looks like a test/build job that could benefit from matrix
        const jobNameLower = jobName.toLowerCase();
        if (
          jobNameLower.includes('test') ||
          jobNameLower.includes('build') ||
          jobNameLower.includes('ci')
        ) {
          suggestions.push(
            `⚡ Job "${jobName}": Consider using matrix strategy for testing multiple versions/configurations.`
          );
        }
      }

      // Rule 4: Check for missing or non-optimized runs-on
      const runsOn = job['runs-on'];
      if (typeof runsOn === 'string' && runsOn === 'ubuntu-latest') {
        // This is actually fine, but we could suggest more specific runners if needed
        // For now, we'll skip this as ubuntu-latest is a good default
      } else if (!runsOn) {
        suggestions.push(
          `⚡ Job "${jobName}": Consider specifying runs-on (e.g., ubuntu-latest) for clarity.`
        );
      }
    }

    // Rule 5: Check for long install steps without cache (more specific)
    for (const jobName of jobNames) {
      const job = jobs[jobName];
      if (!job || typeof job !== 'object') continue;

      const steps = job.steps || [];
      if (!Array.isArray(steps)) continue;

      let installCommands = 0;
      steps.forEach((step: any) => {
        if (!step || typeof step !== 'object') return;
        const run = step.run;
        if (typeof run === 'string') {
          const lowerRun = run.toLowerCase();
          if (
            lowerRun.includes('npm install') ||
            lowerRun.includes('yarn install') ||
            lowerRun.includes('pnpm install') ||
            lowerRun.includes('pip install') ||
            lowerRun.includes('bundle install') ||
            lowerRun.includes('composer install')
          ) {
            installCommands++;
          }
        }
      });

      if (installCommands > 1) {
        suggestions.push(
          `⚡ Workflow "${workflowName}": Multiple install commands detected. Consider consolidating and caching dependencies.`
        );
        break; // Only suggest once per workflow
      }
    }

    return suggestions;
  }
}

export default WorkflowAnalyzer;