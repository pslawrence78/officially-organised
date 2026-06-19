import { TemplateCard } from "../components/cards/TemplateCard";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PageHeader } from "../components/layout/PageHeader";
import { getTemplates } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function TemplatesPage() {
  const state = useRepositoryQuery(getTemplates);
  return <div className="page-stack"><PageHeader eyebrow="Useful starting points" title="Templates">The family’s familiar commitments, ready with sensible defaults.</PageHeader>{state.loading ? <LoadingState label="Loading starter templates…" /> : null}{state.error ? <ErrorState /> : null}{state.data ? <section className="template-grid" aria-label="Starter templates">{state.data.map((template) => <TemplateCard key={template.id} template={template} />)}</section> : null}</div>;
}
