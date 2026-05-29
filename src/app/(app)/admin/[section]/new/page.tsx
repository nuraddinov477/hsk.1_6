"use client";

import { useParams, notFound } from "next/navigation";
import { ResourceForm } from "../../ResourceForm";
import { findResource } from "../../resources";

export default function ResourceNewPage() {
  const { section } = useParams<{ section: string }>();
  const resource = findResource(section);
  if (!resource) return notFound();
  return <ResourceForm resource={resource} />;
}
