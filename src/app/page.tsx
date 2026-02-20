import { fetchData } from "@/lib/data-engine";
import { generateDailyReport } from "@/lib/analysis";
import { NexusDashboardClient } from "@/components/nexus-dashboard-client";

// Import fetch mock directly for simplicity in this MVP
// (fetchData is already imported above)

export default async function Page() {
  // Fetch Data
  const { rawMaterials, finishedProducts, inventory } = await fetchData();

  // Analyze Data
  const report = generateDailyReport(rawMaterials, finishedProducts, inventory);

  return (
    <main className="min-h-screen bg-transparent">
      <NexusDashboardClient initialReport={report} />
    </main>
  );
}
