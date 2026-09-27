export async function uploadLocalFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          resolve(data.url || base64);
        } else {
          // Fallback to base64 data url directly
          resolve(base64);
        }
      } catch (err) {
        // Fallback to base64 data url
        resolve(reader.result as string);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
