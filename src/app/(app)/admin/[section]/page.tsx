"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { ResourceTable } from "../ResourceTable";
import { findResource } from "../resources";

// Generic list page for any content resource. The [section] slug maps 1:1 to
// the Resource registry; unknown slugs fall through to notFound.
export default function ResourceListPage() {
  const { section } = useParams<{ section: string }>();
  const resource = findResource(section);
  if (!resource) return notFound();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{resource.label}</h1>
      </header>
      <ResourceTable resource={resource} />
    </div>
  );
}
