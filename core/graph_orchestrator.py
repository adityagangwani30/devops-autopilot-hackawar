"""
Graph Orchestrator Module
Coordinates analyzers and stores results in Neo4j graph database
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# Neo4j driver
try:
    from neo4j import GraphDatabase

    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.warning("Neo4j driver not available. Install with: pip install neo4j")

from core.monitoring.log_analyzer import LogAnalyzer, AlertSeverity

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Result from running an analyzer"""

    analyzer_type: str
    target: str
    findings: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    timestamp: datetime


@dataclass
class GraphNode:
    """Node to be stored in Neo4j"""

    id: str
    label: str
    type: str
    properties: Dict[str, Any]


@dataclass
class GraphRelationship:
    """Relationship to be stored in Neo4j"""

    source_id: str
    target_id: str
    type: str
    properties: Dict[str, Any]


class Neo4jClient:
    """Neo4j database client for storing graph data"""

    def __init__(self, uri: str = None, username: str = None, password: str = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None

        if NEO4J_AVAILABLE:
            try:
                self.driver = GraphDatabase.driver(
                    self.uri, auth=(self.username, self.password)
                )
                logger.info(f"Connected to Neo4j at {self.uri}")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def create_node(self, node: GraphNode) -> bool:
        """Create or update a node in the graph"""
        if not self.driver:
            logger.warning("Neo4j not connected")
            return False

        query = f"""
        MERGE (n:{node.type} {{id: $id}})
        SET n += $properties,
            n.label = $label,
            n.updated_at = datetime()
        """
        try:
            with self.driver.session() as session:
                session.run(
                    query, id=node.id, label=node.label, properties=node.properties
                )
            return True
        except Exception as e:
            logger.error(f"Failed to create node: {e}")
            return False

    def create_relationship(self, rel: GraphRelationship) -> bool:
        """Create a relationship between two nodes"""
        if not self.driver:
            logger.warning("Neo4j not connected")
            return False

        query = f"""
        MATCH (source {{id: $source_id}})
        MATCH (target {{id: $target_id}})
        MERGE (source)-[r:{rel.type}]->(target)
        SET r += $properties
        """
        try:
            with self.driver.session() as session:
                session.run(
                    query,
                    source_id=rel.source_id,
                    target_id=rel.target_id,
                    properties=rel.properties,
                )
            return True
        except Exception as e:
            logger.error(f"Failed to create relationship: {e}")
            return False

    def get_graph(self, limit: int = 100) -> Dict[str, Any]:
        """Get all nodes and relationships from the graph"""
        if not self.driver:
            return {"nodes": [], "edges": []}

        query = """
        MATCH (n)-[r]->(m)
        RETURN n, r, m
        LIMIT $limit
        """
        try:
            with self.driver.session() as session:
                result = session.run(query, limit=limit)

                nodes = {}
                edges = []

                for record in result:
                    source = record["n"]
                    rel = record["r"]
                    target = record["m"]

                    # Add source node
                    nodes[source["id"]] = {
                        "id": source["id"],
                        "label": source.get("label", source["id"]),
                        "type": list(source.labels)[0],
                        "data": dict(source),
                    }

                    # Add target node
                    nodes[target["id"]] = {
                        "id": target["id"],
                        "label": target.get("label", target["id"]),
                        "type": list(target.labels)[0],
                        "data": dict(target),
                    }

                    # Add edge
                    edges.append(
                        {
                            "source": source["id"],
                            "target": target["id"],
                            "type": type(rel).__name__,
                            "label": rel.type,
                        }
                    )

                return {
                    "nodes": list(nodes.values()),
                    "edges": edges,
                }
        except Exception as e:
            logger.error(f"Failed to get graph: {e}")
            return {"nodes": [], "edges": []}


class AnalysisOrchestrator:
    """Orchestrates running analyzers and storing results in Neo4j"""

    def __init__(self, neo4j_client: Optional[Neo4jClient] = None):
        self.neo4j = neo4j_client or Neo4jClient()
        self.log_analyzer = LogAnalyzer()
        self.analysis_history: List[AnalysisResult] = []

    def analyze_repository(
        self, repo_name: str, repo_data: Dict[str, Any]
    ) -> AnalysisResult:
        """Run all analyzers on a repository"""
        findings = []

        # Create repository node
        repo_node = GraphNode(
            id=repo_name,
            label=repo_name,
            type="Repository",
            properties={
                "language": repo_data.get("language", "unknown"),
                "url": repo_data.get("url", ""),
                "stars": repo_data.get("stars", 0),
                "last_analyzed": datetime.now().isoformat(),
            },
        )
        self.neo4j.create_node(repo_node)

        # Run workflow analysis
        workflow_findings = self._analyze_workflows(
            repo_name, repo_data.get("workflows", [])
        )
        findings.extend(workflow_findings)

        # Run dependency analysis
        dependency_findings = self._analyze_dependencies(
            repo_name, repo_data.get("dependencies", [])
        )
        findings.extend(dependency_findings)

        # Run risk analysis
        risk_findings = self._analyze_risk(repo_name, repo_data.get("history", {}))
        findings.extend(risk_findings)

        result = AnalysisResult(
            analyzer_type="repository",
            target=repo_name,
            findings=findings,
            metadata={
                "language": repo_data.get("language"),
                "timestamp": datetime.now().isoformat(),
            },
            timestamp=datetime.now(),
        )

        self.analysis_history.append(result)
        return result

    def _analyze_workflows(
        self, repo_name: str, workflows: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze GitHub Actions workflows"""
        findings = []

        for workflow in workflows:
            workflow_name = workflow.get("name", "unknown")
            workflow_id = f"{repo_name}:{workflow_name}"

            # Create workflow node
            workflow_node = GraphNode(
                id=workflow_id,
                label=workflow_name,
                type="Workflow",
                properties={
                    "runs": workflow.get("runs", 0),
                    "success_rate": workflow.get("success_rate", 0),
                    "avg_duration": workflow.get("avg_duration", 0),
                    "last_run": workflow.get("last_run"),
                },
            )
            self.neo4j.create_node(workflow_node)

            # Create relationship to repo
            self.neo4j.create_relationship(
                GraphRelationship(
                    source_id=repo_name,
                    target_id=workflow_id,
                    type="HAS_WORKFLOW",
                    properties={},
                )
            )

            # Analyze workflow content
            content = workflow.get("content", "")
            if content:
                suggestions = self._analyze_workflow_content(content)
                for suggestion in suggestions:
                    finding = {
                        "type": "workflow_suggestion",
                        "workflow": workflow_name,
                        "suggestion": suggestion,
                        "severity": "info",
                    }
                    findings.append(finding)

                    # Create alert node if needed
                    if "consider" in suggestion.lower():
                        alert_id = f"alert:{workflow_id}:{suggestion[:20]}"
                        alert_node = GraphNode(
                            id=alert_id,
                            label=suggestion[:50],
                            type="Alert",
                            properties={
                                "severity": "info",
                                "category": "workflow",
                                "workflow": workflow_name,
                            },
                        )
                        self.neo4j.create_node(alert_node)
                        self.neo4j.create_relationship(
                            GraphRelationship(
                                source_id=workflow_id,
                                target_id=alert_id,
                                type="HAS_ALERT",
                                properties={},
                            )
                        )

        return findings

    def _analyze_workflow_content(self, content: str) -> List[str]:
        """Analyze workflow YAML content for suggestions"""
        suggestions = []

        # Simple pattern checks (simplified version of WorkflowAnalyzer)
        if "npm install" in content and "actions/cache" not in content:
            suggestions.append("Consider adding dependency caching using actions/cache")

        if "pip install" in content and "actions/cache" not in content:
            suggestions.append("Consider caching Python dependencies")

        if "ubuntu-latest" in content:
            suggestions.append(
                "Consider using specific Ubuntu version for reproducibility"
            )

        return suggestions

    def _analyze_dependencies(
        self, repo_name: str, dependencies: List[str]
    ) -> List[Dict[str, Any]]:
        """Analyze repository dependencies"""
        findings = []

        for dep in dependencies:
            dep_id = f"dep:{dep}"

            # Create dependency node
            dep_node = GraphNode(
                id=dep_id,
                label=dep,
                type="Dependency",
                properties={
                    "name": dep,
                    "version": "latest",
                },
            )
            self.neo4j.create_node(dep_node)

            # Create relationship to repo
            self.neo4j.create_relationship(
                GraphRelationship(
                    source_id=repo_name,
                    target_id=dep_id,
                    type="DEPENDS_ON",
                    properties={},
                )
            )

        return findings

    def _analyze_risk(
        self, repo_name: str, history: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Analyze repository risk based on history"""
        findings = []

        failures = history.get("failures", 0)
        success_rate = history.get("success_rate", 100)

        if success_rate < 80:
            finding = {
                "type": "risk",
                "severity": "high",
                "message": f"Low success rate: {success_rate}%",
            }
            findings.append(finding)

            # Create alert node
            alert_id = f"alert:{repo_name}:risk"
            alert_node = GraphNode(
                id=alert_id,
                label=f"Risk Alert: {repo_name}",
                type="Alert",
                properties={
                    "severity": "high",
                    "category": "risk",
                    "success_rate": success_rate,
                },
            )
            self.neo4j.create_node(alert_node)
            self.neo4j.create_relationship(
                GraphRelationship(
                    source_id=repo_name,
                    target_id=alert_id,
                    type="HAS_ALERT",
                    properties={},
                )
            )

        return findings

    def analyze_logs(self, logs: List[str], service: str) -> List[Dict[str, Any]]:
        """Analyze logs and create graph nodes for alerts"""
        alerts = self.log_analyzer.process_logs(logs, service)

        findings = []
        for alert in alerts:
            alert_id = f"alert:{service}:{alert.id}"

            # Create alert node
            alert_node = GraphNode(
                id=alert_id,
                label=f"{service}: {alert.title}",
                type="Alert",
                properties={
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "description": alert.description,
                    "timestamp": alert.timestamp.isoformat(),
                    "matched_patterns": alert.metadata.get("matched_patterns", []),
                },
            )
            self.neo4j.create_node(alert_node)

            # Create relationship to service
            service_id = f"service:{service}"
            service_node = GraphNode(
                id=service_id,
                label=service,
                type="Service",
                properties={"name": service},
            )
            self.neo4j.create_node(service_node)

            self.neo4j.create_relationship(
                GraphRelationship(
                    source_id=service_id,
                    target_id=alert_id,
                    type="GENERATES",
                    properties={},
                )
            )

            findings.append(
                {
                    "id": alert.id,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "description": alert.description,
                }
            )

        return findings

    def create_service_relationships(self, services: List[Dict[str, Any]]) -> None:
        """Create relationships between services based on dependencies"""
        for service in services:
            service_id = service.get("id")
            depends_on = service.get("depends_on", [])

            for dep in depends_on:
                self.neo4j.create_relationship(
                    GraphRelationship(
                        source_id=service_id,
                        target_id=dep,
                        type="DEPENDS_ON",
                        properties={},
                    )
                )

    def get_knowledge_graph(self) -> Dict[str, Any]:
        """Get the current knowledge graph from Neo4j"""
        return self.neo4j.get_graph()

    def run_full_analysis(
        self, repositories: List[Dict[str, Any]]
    ) -> List[AnalysisResult]:
        """Run analysis on all repositories"""
        results = []

        for repo in repositories:
            result = self.analyze_repository(
                repo_name=repo.get("name", "unknown"),
                repo_data=repo,
            )
            results.append(result)

        return results


# CLI interface
def main():
    """Run orchestrator from command line"""
    import argparse

    parser = argparse.ArgumentParser(description="Run analysis orchestrator")
    parser.add_argument(
        "--neo4j-uri", default="bolt://localhost:7687", help="Neo4j URI"
    )
    parser.add_argument("--neo4j-user", default="neo4j", help="Neo4j username")
    parser.add_argument("--neo4j-password", help="Neo4j password")
    parser.add_argument("--repos", nargs="+", help="Repository names to analyze")

    args = parser.parse_args()

    client = Neo4jClient(
        uri=args.neo4j_uri,
        username=args.neo4j_user,
        password=args.neo4j_password,
    )

    orchestrator = AnalysisOrchestrator(neo4j_client=client)

    if args.repos:
        for repo_name in args.repos:
            print(f"Analyzing {repo_name}...")
            result = orchestrator.analyze_repository(repo_name, {"name": repo_name})
            print(f"  Found {len(result.findings)} findings")

    print("\nKnowledge Graph:")
    graph = orchestrator.get_knowledge_graph()
    print(f"  Nodes: {len(graph['nodes'])}")
    print(f"  Edges: {len(graph['edges'])}")

    client.close()


if __name__ == "__main__":
    main()
