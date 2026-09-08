export async function readImages(files: File[], existingCount: number): Promise<string[]> {
  if (existingCount + files.length > 3) throw new Error("Use at most three screenshots");
  return Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) { reject(new Error("Use PNG, JPEG or WebP files up to 1 MB each")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  })));
}