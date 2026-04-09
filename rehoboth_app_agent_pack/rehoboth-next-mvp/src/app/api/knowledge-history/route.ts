import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const prisma = getPrisma();
  const body = (await request.json()) as {
    dealId?: string;
    question?: string;
    answer?: string;
    resourceKey?: string | null;
  };

  const dealId = body.dealId?.trim();
  const question = body.question?.trim();
  const answer = body.answer?.trim();
  const resourceKey = body.resourceKey?.trim() || null;

  if (!dealId || !question || !answer) {
    return NextResponse.json(
      { ok: false, error: "Missing knowledge entry fields." },
      { status: 400 },
    );
  }

  const savedEntry = await prisma.dealKnowledgeEntry.create({
    data: {
      dealId,
      question,
      answer,
      resourceKey,
      createdBy: "Knowledge Base",
    },
  });

  await prisma.dealActivity.create({
    data: {
      dealId,
      title: "Knowledge note saved",
      body: `Saved reusable Q&A note: ${question}`,
      createdBy: "Knowledge Base",
      kind: "KNOWLEDGE",
    },
  });

  revalidatePath("/knowledge-base");
  revalidatePath(`/deals/${dealId}`);

  return NextResponse.json({
    ok: true,
    entry: {
      id: savedEntry.id,
      question: savedEntry.question,
      answer: savedEntry.answer,
      resourceKey: savedEntry.resourceKey,
      createdBy: savedEntry.createdBy,
      createdAt: savedEntry.createdAt.toISOString(),
    },
  });
}
