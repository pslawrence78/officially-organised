import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PageHeader } from "../components/layout/PageHeader";
import { SchoolPrepActionList } from "../components/prep/SchoolPrepActionCard";
import { SchoolConfigLinks } from "../components/school/SchoolConfigLinks";
import { SchoolDaySummaryCard } from "../components/school/SchoolDaySummaryCard";
import { SchoolSetupGapCard } from "../components/school/SchoolSetupGapCard";
import { SchoolWeatherPanel } from "../components/school/SchoolWeatherPanel";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { getSchoolHubViewModel } from "../services/schoolHubService";

export function SchoolPage() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const state = useRepositoryQuery(() => getSchoolHubViewModel(), [refreshVersion]);
  const data = state.data;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="One school view" title="School Hub">
        Seb&apos;s school readiness, lunch, kit, weather suggestions and setup checks in one place.
      </PageHeader>

      {state.loading ? <LoadingState label="Building the school view..." /> : null}
      {state.error ? <ErrorState /> : null}

      {data ? (
        <>
          <section className="school-hub-top-grid" aria-label="School summaries">
            <SchoolDaySummaryCard emphasis summary={data.today} />
            <SchoolDaySummaryCard emphasis summary={data.tomorrow} />
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Next few days</p>
                <h2>Upcoming school readiness</h2>
              </div>
            </div>
            <div className="school-hub-upcoming-list">
              {data.upcomingDays.map((item) => <SchoolDaySummaryCard key={item.date} summary={item} />)}
            </div>
          </section>

          <section className="school-hub-two-column">
            <section className="section-block school-hub-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Fix next</p>
                  <h2>Setup needed</h2>
                </div>
              </div>
              {data.setupGaps.length ? (
                <div className="school-hub-gap-list">
                  {data.setupGaps.map((gap) => <SchoolSetupGapCard gap={gap} key={gap.id} />)}
                </div>
              ) : (
                <p className="section-empty-copy">Upcoming school days look configured for this range.</p>
              )}
            </section>

            <SchoolWeatherPanel weather={data.weather} />
          </section>

          <section className="section-block school-hub-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">School-derived prep</p>
                <h2>Open actions</h2>
              </div>
              <Link className="back-link" to="/prep">Open Prep</Link>
            </div>
            <SchoolPrepActionList actions={data.openActions} onChanged={() => setRefreshVersion((value) => value + 1)} />
          </section>

          <section className="section-block school-hub-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Manage school setup</p>
                <h2>Where to update things</h2>
              </div>
            </div>
            <SchoolConfigLinks links={data.links} />
          </section>
        </>
      ) : null}
    </div>
  );
}
