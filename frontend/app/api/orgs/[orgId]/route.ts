import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = await params
    const { db } = await import("@/lib/db")
    const { organization, member } = await import("@/lib/db/schema")
    const { eq, and } = await import("drizzle-orm")

    const org = await db
      .select()
      .from(organization)
      .where(
        and(
          eq(organization.id, orgId),
          eq(organization.ownerId, session.user.id)
        )
      )
      .limit(1)

    if (org.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const members = await db
      .select({
        userId: member.userId,
        role: member.role,
        userName: session.user.name,
        userEmail: session.user.email,
      })
      .from(member)
      .where(eq(member.organizationId, orgId))

    return NextResponse.json({
      organization: org[0],
      members,
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId } = await params
    const { db } = await import("@/lib/db")
    const { organization } = await import("@/lib/db/schema")
    const { eq, and } = await import("drizzle-orm")

    const org = await db
      .select()
      .from(organization)
      .where(
        and(
          eq(organization.id, orgId),
          eq(organization.ownerId, session.user.id)
        )
      )
      .limit(1)

    if (org.length === 0) {
      return NextResponse.json(
        { error: "Organization not found or you don't have permission" },
        { status: 404 }
      )
    }

    await db
      .delete(organization)
      .where(eq(organization.id, orgId))

    return NextResponse.json({ message: "Organization disconnected successfully" })
  } catch (error) {
    console.error("Error disconnecting organization:", error)
    return NextResponse.json(
      { error: "Failed to disconnect organization" },
      { status: 500 }
    )
  }
}
