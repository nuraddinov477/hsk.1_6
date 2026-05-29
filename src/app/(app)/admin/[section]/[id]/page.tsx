"use client";

import { useParams, notFound } from "next/navigation";
import { ResourceForm } from "../../ResourceForm";
import { findResource } from "../../resources";

export default function ResourceEditPage() {
  const { section, id } = useParams<{ section: string; id: string }>();
  const resource = findResource(section);
  if (!resource) return notFound();
  // The "new" segment is matched by the catch-all [id] when it's literally
  // "new"; defer to the dedicated /new page if so. Next.js prioritises static
  // segments, so this branch only fires if routing somehow lands here.
  if (id === "new") return notFound();
  return <ResourceForm resource={resource} id={id} />;
}
