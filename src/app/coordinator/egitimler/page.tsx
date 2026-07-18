import { requireRole } from "@/lib/auth";
import {
  getCoordinatorContext,
  getCoordinatorTrainings,
  getRegionCities,
  getAllInstructorsWithExpertise,
} from "@/lib/services/coordinator";
import { getCategories } from "@/lib/reference";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { SectionTitle } from "@/components/dashboard/stat-card";
import { formatDateTime } from "@/lib/datetime";
import { trainingStatusLabel } from "@/lib/labels";
import { TrainingCreateButton } from "./training-form";
import { TrainingSearch } from "./training-search";

export default async function TrainingManagementPage() {
  const session = await requireRole("COORDINATOR");
  const ctx = await getCoordinatorContext(session.profileId);
  const [trainings, cities, categories, instructors] = await Promise.all([
    getCoordinatorTrainings(ctx.responsibleRegionId),
    getRegionCities(ctx.responsibleRegionId),
    getCategories(),
    getAllInstructorsWithExpertise(),
  ]);

  const rows = trainings.map((t) => ({
    ...t,
    startAtStr: formatDateTime(t.startAt),
  }));

  return (
    <div className="space-y-6">
      <SectionTitle
        action={<TrainingCreateButton categories={categories} cities={cities} instructors={instructors} />}
      >
        Eğitim Yönetimi ({ctx.responsibleRegion.name})
      </SectionTitle>

      <Card>
        <CardHeader>
          <CardTitle>Bölgenizdeki Eğitimler</CardTitle>
        </CardHeader>
        <CardBody>
          {rows.length === 0 ? (
            <EmptyState title="Henüz eğitim yok" description="Yeni eğitim oluşturarak başlayın." />
          ) : (
            <TrainingSearch rows={rows} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
