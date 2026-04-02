const uri = process.env.NEO4J_URI || process.env.NEO4J_URL || "bolt://localhost:7687"
const username = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || "neo4j"
const password = process.env.NEO4J_PASSWORD || process.env.NEO4J_SECRET || ""

let driver: any = null

export function getNeo4jDriver() {
  if (!driver && password) {
    try {
      const neo4j = require("neo4j")
      // Try v1.x API first
      if (neo4j.GraphDatabase && typeof neo4j.GraphDatabase === 'function') {
        driver = new neo4j.GraphDatabase(uri, { username, password })
      } 
      // Fallback to v2.x+ API
      else if (neo4j.driver && typeof neo4j.driver === 'function' && neo4j.auth && typeof neo4j.auth.basic === 'function') {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
      } 
      // Last resort - try the direct driver call
      else {
        driver = neo4j(uri, { username, password })
      }
    } catch (e) {
      console.error("Neo4j driver initialization error:", e)
      driver = null
    }
  }
  return driver
}

export async function closeNeo4jDriver() {
  if (driver) {
    driver = null
  }
}

export interface Neo4jNode {
  id: string
  label: string
  type: string
  properties: Record<string, unknown>
}

export interface Neo4jEdge {
  id: string
  source: string
  target: string
  type: string
  label: string
  properties: Record<string, unknown>
}

export async function executeCypher(
  query: string,
  params: Record<string, unknown> = {}
): Promise<any> {
  const neo4jDriver = getNeo4jDriver()
  if (!neo4jDriver) {
    throw new Error("Neo4j driver not initialized. Check NEO4J_PASSWORD.")
  }

  return new Promise((resolve, reject) => {
    neo4jDriver.cypher({ query, params }, (err: any, result: any) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

export async function createNode(
  nodeId: string,
  labels: string[],
  properties: Record<string, unknown>
): Promise<boolean> {
  const labelStr = labels.map((l) => `:${l}`).join("")
  const query = `
    MERGE (n${labelStr} {id: $id})
    SET n += $properties, n.updated_at = datetime()
    RETURN n
  `
  try {
    const result: any = await executeCypher(query, { id: nodeId, properties })
    return result && result.data && result.data.length > 0
  } catch (error) {
    console.error("Failed to create node:", error)
    return false
  }
}

export async function createEdge(
  sourceId: string,
  targetId: string,
  relType: string,
  properties: Record<string, unknown> = {}
): Promise<boolean> {
  const query = `
    MATCH (source {id: $sourceId})
    MATCH (target {id: $targetId})
    MERGE (source)-[r:${relType}]->(target)
    SET r += $properties
    RETURN r
  `
  try {
    const result: any = await executeCypher(query, { sourceId, targetId, properties })
    return result && result.data && result.data.length > 0
  } catch (error) {
    console.error("Failed to create edge:", error)
    return false
  }
}

export async function deleteNode(nodeId: string): Promise<boolean> {
  const query = `
    MATCH (n {id: $id})
    DETACH DELETE n
  `
  try {
    await executeCypher(query, { id: nodeId })
    return true
  } catch (error) {
    console.error("Failed to delete node:", error)
    return false
  }
}

export async function deleteUserGraph(userId: string): Promise<boolean> {
  const query = `
    MATCH (n {userId: $userId})
    DETACH DELETE n
  `
  try {
    await executeCypher(query, { userId })
    return true
  } catch (error) {
    console.error("Failed to delete user graph:", error)
    return false
  }
}

export async function getGraphForUser(userId: string): Promise<{
  nodes: Neo4jNode[]
  edges: Neo4jEdge[]
}> {
  const query = `
    MATCH (n {userId: $userId})-[r]->(m {userId: $userId})
    RETURN n, r, m
  `
  try {
    const result: any = await executeCypher(query, { userId })

    if (!result || !result.data) {
      return { nodes: [], edges: [] }
    }

    const nodesMap = new Map<string, Neo4jNode>()
    const edges: Neo4jEdge[] = []

    for (const row of result.data) {
      const source = row.n
      const target = row.m
      const rel = row.r

      if (source && source.properties && !nodesMap.has(source.properties.id)) {
        nodesMap.set(source.properties.id, {
          id: source.properties.id,
          label: source.properties.label || source.properties.id,
          type: source.labels ? source.labels[0] : "Node",
          properties: { ...source.properties, userId },
        })
      }

      if (target && target.properties && !nodesMap.has(target.properties.id)) {
        nodesMap.set(target.properties.id, {
          id: target.properties.id,
          label: target.properties.label || target.properties.id,
          type: target.labels ? target.labels[0] : "Node",
          properties: { ...target.properties, userId },
        })
      }

      if (source && target && rel) {
        edges.push({
          id: `${source.properties.id}-${rel.relType}-${target.properties.id}`,
          source: source.properties.id,
          target: target.properties.id,
          type: rel.relType,
          label: rel.relType,
          properties: { ...rel.properties },
        })
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
    }
  } catch (error) {
    console.error("Failed to get graph for user:", error)
    return { nodes: [], edges: [] }
  }
}