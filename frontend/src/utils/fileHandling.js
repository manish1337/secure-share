import { decryptFile } from "./encryption";

export const downloadFile = async (file, decryptionKey) => {
  try {
    const response = await fetch(file.url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const encryptedData = await response.blob();
    const decryptedFile = await decryptFile(encryptedData, decryptionKey);

    // Create download link
    const downloadUrl = window.URL.createObjectURL(decryptedFile);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};
