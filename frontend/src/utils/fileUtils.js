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
  element.href = URL.createObjectURL(fileBlob);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};
