"use client";

import { AdminResourcePanel } from "../../../components/admin/AdminResourcePanel";
import { IntegrationSecretForm } from "../../../components/admin/IntegrationSecretForm";
import { configs } from "../../../components/admin/resource-configs";

export default function ApiAdminPage() {
  return <><IntegrationSecretForm /><AdminResourcePanel config={configs.integrations} /><AdminResourcePanel config={configs.jobs} /></>;
}
