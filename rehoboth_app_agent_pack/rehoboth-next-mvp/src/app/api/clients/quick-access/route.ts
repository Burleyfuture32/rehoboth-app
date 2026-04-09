import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultQuickAccessClientId,
  getQuickAccessClientById,
  getQuickAccessClients,
  toQuickAccessClientPayload,
} from "@/lib/clients";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await getQuickAccessClients();

  return NextResponse.json(
    {
      clients: clients.map(toQuickAccessClientPayload),
      defaultClientId: getDefaultQuickAccessClientId(clients),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const borrowerId = getRequiredString(body.borrowerId);
  const name = getRequiredString(body.name);
  const entityType = getRequiredString(body.entityType);
  const email = getRequiredString(body.email);
  const phone = getRequiredString(body.phone);
  const experience = getOptionalString(body.experience);

  if (!borrowerId || !name || !entityType || !email || !phone) {
    return NextResponse.json(
      {
        ok: false,
        error: "Name, entity type, email, and phone are required.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const borrower = await prisma.borrower.findUnique({
    where: {
      id: borrowerId,
    },
    select: {
      id: true,
      deals: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!borrower) {
    return NextResponse.json(
      {
        ok: false,
        error: "Client not found.",
      },
      { status: 404 },
    );
  }

  await prisma.borrower.update({
    where: {
      id: borrower.id,
    },
    data: {
      name,
      entityType,
      experience: experience || null,
      email,
      phone,
    },
  });

  revalidateClientRailPaths(borrower.deals.map((deal) => deal.id));

  const updatedClient = await getQuickAccessClientById(borrower.id);

  if (!updatedClient) {
    return NextResponse.json(
      {
        ok: false,
        error: "Client saved, but the refreshed client snapshot could not be loaded.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    client: toQuickAccessClientPayload(updatedClient),
  });
}

function revalidateClientRailPaths(dealIds: string[]) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/documents");
  revalidatePath("/capital-sources");
  revalidatePath("/reports");
  revalidatePath("/search");
  revalidatePath("/portal");

  for (const dealId of dealIds) {
    revalidatePath(`/deals/${dealId}`);
    revalidatePath(`/deals/${dealId}/communications`);
    revalidatePath(`/deals/${dealId}/file`);
    revalidatePath(`/deals/${dealId}/summary`);
    revalidatePath(`/deals/${dealId}/status-tracker`);
    revalidatePath(`/portal/${dealId}`);
  }
}

function getRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
