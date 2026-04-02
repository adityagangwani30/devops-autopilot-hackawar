import requests
from ai_cto.config import GITHUB_TOKEN

GITHUB_API = "https://api.github.com"


class FetchRepoData:
    name: str = "fetch_repo_data"
    description: str = "Fetch comprehensive repository data including issues, README, workflows, and metadata"

    def __init__(self, repo: str = None, github_token: str = None):
        self.repo = repo
        self.github_token = github_token

    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        github_token = kwargs.get("github_token") or self.github_token or GITHUB_TOKEN
        if not repo:
            return {"error": "No repo provided"}

        owner, repo_name = repo.split("/")

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        result = {
            "repo": repo,
            "metadata": {},
            "readme": None,
            "issues": [],
            "issues_count": 0,
            "open_issues_count": 0,
            "workflows": [],
            "languages": {},
            "dependencies": {},
            "structure": {
                "default_branch": "main",
                "root_entries": [],
                "top_level_directories": [],
                "important_files": [],
                "sample_paths": [],
                "truncated": False,
            },
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
                result["structure"]["default_branch"] = data.get("default_branch", "main")
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

        important_file_names = {
            "package.json",
            "pnpm-lock.yaml",
            "package-lock.json",
            "yarn.lock",
            "requirements.txt",
            "pyproject.toml",
            "Pipfile",
            "Dockerfile",
            "docker-compose.yml",
            "docker-compose.yaml",
            "go.mod",
            "Cargo.toml",
            "pom.xml",
            "build.gradle",
            "Makefile",
            "terraform.tf",
            "main.tf",
        }

        try:
            contents_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/contents",
                headers=headers,
                timeout=10,
            )
            if contents_resp.status_code == 200:
                root_entries = contents_resp.json()
                if isinstance(root_entries, list):
                    result["structure"]["root_entries"] = [
                        {
                            "name": entry.get("name"),
                            "path": entry.get("path"),
                            "type": entry.get("type"),
                            "size": entry.get("size", 0),
                        }
                        for entry in root_entries[:40]
                    ]

                    result["structure"]["top_level_directories"] = [
                        entry.get("name")
                        for entry in root_entries
                        if entry.get("type") == "dir" and entry.get("name")
                    ][:20]

                    result["structure"]["important_files"] = [
                        entry.get("name")
                        for entry in root_entries
                        if entry.get("type") == "file"
                        and entry.get("name") in important_file_names
                    ][:20]
        except:
            pass

        # Fetch package.json for dependency information
        try:
            pkg_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/package.json",
                headers=headers,
                timeout=10,
            )
            if pkg_resp.status_code == 200:
                import base64
                pkg_content = pkg_resp.json()
                if pkg_content.get("encoding") == "base64":
                    import json
                    pkg_text = base64.b64decode(pkg_content["content"]).decode("utf-8")
                    pkg_json = json.loads(pkg_text)
                    deps = {}
                    for dep_name, dep_version in pkg_json.get("dependencies", {}).items():
                        deps[dep_name] = dep_version
                    for dep_name, dep_version in pkg_json.get("devDependencies", {}).items():
                        deps[dep_name] = dep_version
                    result["dependencies"] = deps
        except:
            pass

        default_branch = result["structure"].get("default_branch") or "main"
        try:
            tree_resp = requests.get(
                f"{GITHUB_API}/repos/{owner}/{repo_name}/git/trees/{default_branch}",
                headers=headers,
                params={"recursive": "1"},
                timeout=15,
            )
            if tree_resp.status_code == 200:
                tree_payload = tree_resp.json()
                tree_entries = tree_payload.get("tree", [])
                sample_paths = []
                for entry in tree_entries:
                    path = entry.get("path")
                    if not path:
                        continue
                    depth = path.count("/")
                    if depth <= 2:
                        sample_paths.append(path)
                    if len(sample_paths) >= 60:
                        break

                result["structure"]["sample_paths"] = sample_paths
                result["structure"]["truncated"] = bool(tree_payload.get("truncated"))
        except:
            pass

        return result


class FetchWorkflows:
    name: str = "fetch_workflows"
    description: str = "Fetch CI/CD workflow YAML files from .github/workflows/"

    def __init__(self, repo: str = None, github_token: str = None):
        self.repo = repo
        self.github_token = github_token

    def run(self, **kwargs) -> dict:
        repo = kwargs.get("repo") or self.repo
        github_token = kwargs.get("github_token") or self.github_token or GITHUB_TOKEN
        if not repo:
            return {"error": "No repo provided", "workflows": []}

        owner, repo_name = repo.split("/")

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        url = f"{GITHUB_API}/repos/{owner}/{repo_name}/contents/.github/workflows"
        resp = requests.get(url, headers=headers, timeout=10)

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
                    content_resp = requests.get(
                        f["download_url"], headers=headers, timeout=10
                    )
                    workflows.append(
                        {
                            "name": f["name"],
                            "path": f["path"],
                            "content": content_resp.text
                            if content_resp.status_code == 200
                            else "",
                        }
                    )
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
