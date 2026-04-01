from pydantic import BaseModel
import os
import requests
from ai_cto.config import GITHUB_TOKEN

GITHUB_API = "https://api.github.com"


class ActionInput(BaseModel):
    repo: str | None = None


class FetchWorkflows(ActionInput):
    name: str = "fetch_workflows"
    description: str = "Fetch CI/CD workflow YAML files from .github/workflows/"
    
    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        if not repo:
            return {"error": "No repo provided", "workflows": []}
        
        owner, repo_name = repo.split("/")
        
        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Use token if available, but don't require it for public repos
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        url = f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/.github/workflows"
        resp = requests.get(url, headers=headers)
        
        print(f"DEBUG: Fetching workflows from {owner}/{repo_name}, status: {resp.status_code}")
        
        if resp.status_code == 401:
            return {"error": "GitHub authentication failed. Check your GITHUB_TOKEN in .env", "workflows": [], "repo": repo}
        elif resp.status_code == 404:
            return {"error": f"Repository {owner}/{repo_name} not found or no workflows directory", "workflows": [], "repo": repo}
        elif resp.status_code != 200:
            return {"error": f"GitHub API error: {resp.status_code} - {resp.text}", "workflows": [], "repo": repo}
        
        files = resp.json()
        workflows = []
        
        if isinstance(files, list):
            for f in files:
                if f.get("name", "").endswith((".yml", ".yaml")):
                    content_resp = requests.get(f["download_url"], headers=headers)
                    workflows.append({
                        "name": f["name"],
                        "path": f["path"],
                        "content": content_resp.text if content_resp.status_code == 200 else ""
                    })
        
        print(f"DEBUG: Found {len(workflows)} workflow files")
        return {"repo": repo, "workflows": workflows}


class CommentOnPRInput(BaseModel):
    repo: str | None = None
    pr_number: int | None = None
    message: str | None = None


class CommentOnPR(CommentOnPRInput):
    name: str = "comment_on_pr"
    description: str = "Post a comment on a GitHub pull request"
    
    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        owner, repo_name = repo.split("/")
        
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"{GITHUB_API}/repos/{owner}/{repo_name}/issues/{self.pr_number}/comments"
        data = {"body": self.message}
        resp = requests.post(url, json=data, headers=headers)
        
        return {"success": resp.status_code == 201, "response": resp.text}
