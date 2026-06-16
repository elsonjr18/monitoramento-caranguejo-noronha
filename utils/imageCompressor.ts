/**
 * Redimensiona uma imagem em formato base64 DataURL para uma largura máxima,
 * convertendo-a para JPEG com a qualidade informada.
 */
export function resizeImage(base64Str: string, maxWidth: number = 1280, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        console.error('[imageCompressor] Erro ao redimensionar imagem com Canvas:', e);
        resolve(base64Str); // fallback para o original em caso de falha silenciosa
      }
    };

    img.onerror = (err) => {
      console.error('[imageCompressor] Erro ao carregar imagem no Canvas:', err);
      resolve(base64Str); // fallback em caso de erro
    };
  });
}
