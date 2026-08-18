import adminApi from "./adminApi";

export const backupService = {
  async exportDatabaseSnapshot(): Promise<void> {
    const res = await adminApi.get("/admin/backup/export", {
      responseType: "blob",
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `wat_profile_backup_${timestamp}.json`;

    const blob = new Blob([res.data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
