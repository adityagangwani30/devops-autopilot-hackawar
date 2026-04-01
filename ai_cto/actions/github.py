import requests
from ai_cto.config import GITHUB_TOKEN

GITHUB_API = "https://api.github.com"


class FetchRepoData:
    name: str = "fetch_repo_data"
    description: str = "Fetch comprehensive repository data including issues, README, workflows, and metadata"

    def __init__(self, repo: str = None):
        self.repo = repo

    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        if not repo:
            return {"error": "No repo provided"}

        owner, repo_name = repo.split("/")

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"

        result = {
            "repo": repo,
            "metadata": {},
            "readme": None,
            "issues": [],
            "issues_count": 0,
            "open_issues_count": 0,
            "workflows": [],
            "languages": {},
            "error": None,
        }

        # Fetch repo metadata
        try:
            meta_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}", headers=headers, timeout=10
            )
            if meta_resp.status_code == 200:
                data = meta_resp.json()
                result["metadata"] = {
                    "full_name": data.get("full_name"),
                    "description": data.get("description"),
                    "language": data.get("language"),
                    "stargazers_count": data.get("stargazers_count", 0),
                    "forks_count": data.get("forks_count", 0),
                    "open_issues_count": data.get("open_issues_count", 0),
                    "watchers_count": data.get("watchers_count", 0),
                    "default_branch": data.get("default_branch", "main"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                    "pushed_at": data.get("pushed_at"),
                    "topics": data.get("topics", []),
                    "license": data.get("license", {}).get("name")
                    if data.get("license")
                    else None,
                    "url": data.get("html_url"),
                }
                result["open_issues_count"] = data.get("open_issues_count", 0)
            else:
                result["error"] = f"Failed to fetch metadata: {meta_resp.status_code}"
        except Exception as e:
            result["error"] = f"Error fetching metadata: {str(e)}"

        # Fetch README
        for readme_name in ["README.md", "README", "readme.md", "README.MD"]:
            try:
                readme_resp = requests.get(
                    f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/{readme_name}",
                    headers=headers,
                    timeout=10,
                )
                if readme_resp.status_code == 200:
                    import base64

                    content = readme_resp.json()
                    if content.get("encoding") == "base64":
                        result["readme"] = base64.b64decode(content["content"]).decode(
                            "utf-8"
                        )
                        break
            except:
                continue

        # Fetch issues (open)
        try:
            issues_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/issues",
                headers=headers,
                params={"state": "open", "per_page": 30, "sort": "updated"},
                timeout=10,
            )
            if issues_resp.status_code == 200:
                issues = issues_resp.json()
                result["issues"] = [
                    {
                        "number": i.get("number"),
                        "title": i.get("title"),
                        "state": i.get("state"),
                        "labels": [l.get("name") for l in i.get("labels", [])],
                        "comments": i.get("comments", 0),
                        "created_at": i.get("created_at"),
                        "updated_at": i.get("updated_at"),
                        "url": i.get("html_url"),
                    }
                    for i in issues
                    if not i.get("pull_request")  # Filter out PRs
                ][:20]  # Limit to 20 issues
                result["issues_count"] = len(result["issues"])
        except Exception as e:
            pass  # Issues are optional

        # Fetch workflows
        try:
            workflows_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/.github/workflows",
                headers=headers,
                timeout=10,
            )
            if workflows_resp.status_code == 200:
                files = workflows_resp.json()
                if isinstance(files, list):
                    for f in files:
                        if f.get("name", "").endswith((".yml", ".yaml")):
                            content_resp = requests.get(
                                f["download_url"], headers=headers, timeout=10
                            )
                            result["workflows"].append(
                                {
                                    "name": f["name"],
                                    "path": f["path"],
                                    "size": f.get("size", 0),
                                }
                            )
        except:
            pass  # Workflows are optional

        # Fetch languages
        try:
            lang_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/languages",
                headers=headers,
                timeout=10,
            )
            if lang_resp.status_code == 200:
                result["languages"] = lang_resp.json()
        except:
            pass

        print(f"DEBUG: Fetched repo data for {owner}/{repo_name}")
        return result


class FetchWorkflows:
    name: str = "fetch_workflows"
    description: str = "Fetch CI/CD workflow YAML files from .github/workflows/"

    def __init__(self, repo: str = None):
        self.repo = repo

    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        if not repo:
            return {"error": "No repo provided", "workflows": []}

        owner, repo_name = repo.split("/")

        headers = {"Accept": "application/vnd.github.v3+json"}

        url = f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/.github/workflows"
        resp = requests.get(url, headers=headers)

        print(
            f"DEBUG: Fetching workflows from {owner}/{repo_name}, status: {resp.status_code}"
        )

        if resp.status_code == 404:
            return {
                "error": f"Repository {owner}/{repo_name} not found or no workflows directory",
                "workflows": [],
                "repo": repo,
            }
        elif resp.status_code != 200:
            return {
                "error": f"GitHub API error: {resp.status_code} - {resp.text[:200]}",
                "workflows": [],
                "repo": repo,
            }

        files = resp.json()
        workflows = []

        if isinstance(files, list):
            for f in files:
                if f.get("name", "").endswith((".yml", ".yaml")):
                    content_resp = requests.get(f["download_url"], headers=headers)
                    workflows.append(
                        {
                            "name": f["name"],
                            "path": f["path"],
                            "content": content_resp.text
                            if content_resp.status_code == 200
                            else "",
                        }
                    )

        print(f"DEBUG: Found {len(workflows)} workflow files")
        return {"repo": repo, "workflows": workflows}


class CommentOnPR:
    name: str = "comment_on_pr"
    description: str = "Post a comment on a GitHub pull request"

    def __init__(self, repo: str = None, pr_number: int = None, message: str = None):
        self.repo = repo
        self.pr_number = pr_number
        self.message = message

    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        owner, repo_name = repo.split("/")

        if not GITHUB_TOKEN:
            return {"error": "GITHUB_TOKEN required for commenting", "success": False}

        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
        }
        url = f"{GITHUB_API}/repos/{owner}/{repo_name}/issues/{self.pr_number}/comments"
        data = {"body": self.message}
        resp = requests.post(url, json=data, headers=headers)

        return {"success": resp.status_code == 201, "response": resp.text}
