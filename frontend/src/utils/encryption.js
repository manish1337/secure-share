import CryptoJS from "crypto-js";

const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

export const encryptFile = async (file) => {
  const key = generateKey();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      try {
        const fileData = e.target.result;
        const encrypted = CryptoJS.AES.encrypt(fileData, key).toString();

        // Create a new file with encrypted data
        const encryptedBlob = new Blob([encrypted], {
          type: "application/octet-stream",
        });
        const encryptedFile = new File([encryptedBlob], file.name, {
          type: "application/octet-stream",
        });

        resolve({
          file: encryptedFile,
          key: key,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const decryptFile = async (encryptedData, key, fileName, mimeType) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(
      CryptoJS.enc.Utf8
    );
    const dataUrl = decrypted;

    // Convert data URL back to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    throw new Error("Failed to decrypt file");
  }
};
