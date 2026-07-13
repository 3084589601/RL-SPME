import { AboutPageShell } from "@/components/AboutPageShell";
import { getCachedLabIntro } from "@/lib/cached-data";
import { FacultyClientPage } from "./FacultyClientPage";

export default async function FacultyPage() {
  const data = await getCachedLabIntro();

  return (
    <AboutPageShell>
      <FacultyClientPage faculty={data.faculty} studentAdmins={data.studentAdmins} />
    </AboutPageShell>
  );
}
