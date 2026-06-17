import MiniChartGrid from "../MiniChartGrid";
import type { VolunteerSnapshot } from "../../../api/volunteers";
import { VOLUNTEER_CHARTS } from "../categories/volunteerSpecs";

interface Props {
  data: VolunteerSnapshot[];
}

export default function VolunteerTrendChart({ data }: Props) {
  return (
    <MiniChartGrid
      data={data}
      charts={VOLUNTEER_CHARTS}
      gridColsClass="lg:grid-cols-4"
    />
  );
}
