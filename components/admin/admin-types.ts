export type FieldKind = "text" | "textarea" | "number" | "boolean" | "json" | "datetime" | "select" | "reference";
export type AdminField = {
  key: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  help?: string;
  options?: { label: string; value: string }[];
  reference?: { resource: string; labelKeys: string[]; allowEmpty?: boolean };
};

export type ResourcePageConfig = {
  resource: string;
  title: string;
  description: string;
  fields: AdminField[];
  itemLabel?: string;
  allowCreate?: boolean;
};
