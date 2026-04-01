import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await import("@/lib/db")
    const { organization, member } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    const memberships = await db
      .select({
        organization,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, session.user.id))

    return NextResponse.json({ organizations: memberships })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { githubOrgId, githubOrgName, githubOrgAvatar, githubAccessToken } = body

    if (!githubOrgId || !githubOrgName) {
      return NextResponse.json(
        { error: "GitHub organization ID and name are required" },
        { status: 400 }
      )
    }

    const { db } = await import("@/lib/db")
    const { organization, member } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    const existing = await db
      .select()
      .from(organization)
      .where(eq(organization.githubOrgId, githubOrgId))

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This GitHub organization is already connected" },
        { status: 409 }
      )
    }

    const orgId = crypto.randomUUID()
    const now = new Date()

    await db.insert(organization).values({
      id: orgId,
      name: githubOrgName,
      slug: githubOrgName.toLowerCase().replace(/\s+/g, "-"),
      githubOrgId,
      githubOrgName,
      githubOrgAvatar,
      githubAccessToken,
      connectedAt: now,
      createdAt: now,
      updatedAt: now,
      ownerId: session.user.id,
    })

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: session.user.id,
      role: "owner",
      createdAt: now,
    })

    return NextResponse.json({
      message: "Organization connected successfully",
      organization: {
        id: orgId,
        name: githubOrgName,
        slug: githubOrgName.toLowerCase().replace(/\s+/g, "-"),
        githubOrgId,
        githubOrgAvatar,
        connectedAt: now,
      },
    })
  } catch (error) {
    console.error("Error connecting organization:", error)
    return NextResponse.json(
      { error: "Failed to connect organization" },
      { status: 500 }
    )
  }
}
