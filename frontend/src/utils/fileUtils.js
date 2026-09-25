export async function calculateSHA256(fileOrString) {
  let buffer;
  if (fileOrString instanceof File || fileOrString instanceof Blob) {
    buffer = await fileOrString.arrayBuffer();
  } else {
    buffer = new TextEncoder().encode(fileOrString);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatWeight(bp) {
  const grams = bp * 1.096e-21;
  if (grams < 1e-18) return (grams * 1e21).toFixed(2) + " zeptograms";
  if (grams < 1e-15) return (grams * 1e18).toFixed(2) + " attograms";
  if (grams < 1e-12) return (grams * 1e15).toFixed(2) + " femtograms";
  return (grams * 1e12).toFixed(2) + " picograms";
}

export const downloadFile = (content, filename) => {
  const element = document.createElement("a");
  const fileBlob = new Blob([content], {type: 'text/plain'});
  const url = URL.createObjectURL(fileBlob);
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

export const downloadFromServer = async (fileId, format, filename, apiBaseUrl, axiosInstance) => {
  try {
    const res = await axiosInstance.get(`${apiBaseUrl}/api/dna/download/${fileId}/${format}`, {
      withCredentials: true,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Server download failed", err);
    alert("Failed to download file. Please try again.");
  }
};

export function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}
