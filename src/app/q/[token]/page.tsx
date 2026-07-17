import { Portal } from "@/components/Portal";
import { getAdminClient } from "@/lib/supabase/admin";
import type { AnswerMap } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadDraft(token: string): Promise<{ answers: AnswerMap; section?: string; clientName?: string }> {
  const supabase = getAdminClient();
  if (!supabase) {
    // No backend configured — start empty (localStorage will still persist).
    return { answers: {} };
  }

  // Look up the invitation (client name) and any existing draft.
  const [{ data: inv }, { data: draft }] = await Promise.all([
    supabase.from("invitations").select("client_name").eq("token", token).maybeSingle(),
    supabase.from("drafts").select("answers,current_section").eq("token", token).maybeSingle(),
  ]);

  return {
    answers: (draft?.answers as AnswerMap) ?? {},
    section: draft?.current_section ?? undefined,
    clientName: inv?.client_name ?? undefined,
  };
}

export default async function QuestionnairePage({ params }: { params: { token: string } }) {
  const { token } = params;
  const { answers, section, clientName } = await loadDraft(token);

  return (
    <Portal
      token={token}
      initialAnswers={answers}
      initialSection={section}
      clientName={clientName}
    />
  );
}
