import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { databaseMetadata } from "../data/db";
import { getHousehold, getSettings } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function SettingsPage() {
  const state = useRepositoryQuery(async () => {
    const [household, settings] = await Promise.all([getHousehold(), getSettings()]);
    return { household, settings };
  });
  return (
    <div className="page-stack">
      <PageHeader eyebrow="The foundations" title="Settings">Household and local data details for this installation.</PageHeader>
      {state.loading ? <LoadingState /> : null}
      {state.error ? <ErrorState /> : null}
      {state.data ? <section className="settings-card"><dl><div><dt>Household</dt><dd>{state.data.household?.name ?? "Not available"}</dd></div><div><dt>Timezone</dt><dd>{state.data.household?.timezone ?? "Not available"}</dd></div><div><dt>Week starts</dt><dd className="capitalize">{state.data.household?.defaultStartOfWeek ?? "Not available"}</dd></div><div><dt>Database schema</dt><dd>Version {databaseMetadata.schemaVersion}</dd></div><div><dt>App data schema</dt><dd><code>{databaseMetadata.appDataSchema}</code></dd></div></dl></section> : null}
      <section className="settings-links" aria-label="Data tools">
        <Link to="/settings/countdowns"><span className="secondary-navigation__icon"><Icon name="clock" /></span><span><strong>Family countdowns</strong><small>Selected dates, days and sleeps</small></span><Icon className="secondary-navigation__chevron" name="chevron" /></Link>
        <Link to="/settings/school-calendar"><span className="secondary-navigation__icon"><Icon name="school" /></span><span><strong>Seb’s school calendar</strong><small>Illustrative terms, holidays and closure days</small></span><Icon className="secondary-navigation__chevron" name="chevron" /></Link>
        <Link to="/settings/import"><span className="secondary-navigation__icon"><Icon name="template" /></span><span><strong>Import data</strong><small>Placeholder for a later tranche</small></span><Icon className="secondary-navigation__chevron" name="chevron" /></Link>
        <Link to="/settings/export"><span className="secondary-navigation__icon"><Icon name="template" /></span><span><strong>Export data</strong><small>Placeholder for a later tranche</small></span><Icon className="secondary-navigation__chevron" name="chevron" /></Link>
      </section>
    </div>
  );
}
