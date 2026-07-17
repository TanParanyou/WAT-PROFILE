import api from "./api";

export type RichTextMigrationPayload = {
  resource: "event" | "monk" | "content_page";
  id: string;
  updated_at: string;
  field: "description" | "bio" | "body";
  value: unknown;
};

export const richTextMigrationService = {
  async migrate(payload: RichTextMigrationPayload) {
    await api.post("/admin/rich-text/migrations", payload);
  },
};
