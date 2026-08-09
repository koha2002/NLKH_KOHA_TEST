"use client";
import { AdminResourcePanel } from "../../../components/admin/AdminResourcePanel";import { MediaUploader } from "../../../components/admin/MediaUploader";import { configs } from "../../../components/admin/resource-configs";export default function Page(){return <><MediaUploader/><AdminResourcePanel config={configs.media}/></>}
