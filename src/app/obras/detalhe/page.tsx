import { Suspense } from "react";
import { Loading } from "@/components/common";
import { ProjectRoute } from "@/modules/project-route";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectRoute />
    </Suspense>
  );
}
