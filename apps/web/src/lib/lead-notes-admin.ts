import { AdminLeadNoteSchema, type AdminLeadNote } from "@sales-pipeline/shared";

import { requireSuperUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type LeadNotesAdminFilter = "active" | "deleted" | "all";

export async function getLeadNotesForAdmin(
  filter: LeadNotesAdminFilter = "all",
): Promise<AdminLeadNote[]> {
  await requireSuperUser();
  const supabase = await createClient();

  let query = supabase
    .from("lead_notes")
    .select(
      `
      id,
      lead_id,
      author_id,
      body,
      created_at,
      updated_at,
      deleted_at,
      deleted_by,
      lead:leads ( company, name )
    `,
    )
    .order("created_at", { ascending: false });

  if (filter === "active") {
    query = query.is("deleted_at", null);
  } else if (filter === "deleted") {
    query = query.not("deleted_at", "is", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const notes = data ?? [];
  const authorIds = [
    ...new Set(
      notes
        .map((note) => note.author_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  let authorsById = new Map<string, { full_name: string | null; email: string | null }>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds);
    authorsById = new Map(
      (authors ?? []).map((author) => [
        author.id,
        { full_name: author.full_name, email: author.email },
      ]),
    );
  }

  return notes.map((note) =>
    AdminLeadNoteSchema.parse({
      ...note,
      lead: Array.isArray(note.lead) ? note.lead[0] : note.lead,
      author:
        typeof note.author_id === "string" ? (authorsById.get(note.author_id) ?? null) : null,
    }),
  );
}
