"use client";
import { AdminResourcePanel } from "../../../components/admin/AdminResourcePanel";import { configs } from "../../../components/admin/resource-configs";export default function Page(){return <><AdminResourcePanel config={configs.software}/><AdminResourcePanel config={configs.softwareCategories}/></>}
