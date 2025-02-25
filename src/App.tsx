import { useState } from "react";
import { ZipWriter, BlobWriter, BlobReader } from "@zip.js/zip.js";

export default function App() {
  const [images, setImages] = useState<File[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addLogoToImage = async (imageFile: File): Promise<{ name: string; blob: Blob }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (logo) {
          const logoImg = new Image();
          logoImg.src = logo;
          logoImg.onload = () => {
            // Calcula el máximo ancho y alto permitidos para el logo (15% del tamaño de la imagen original)
            const maxLogoWidth = img.width * 0.15;
            const maxLogoHeight = img.height * 0.15;
            // Calcula el factor de escala manteniendo la relación de aspecto del logo
            const ratio = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height);
            const logoWidth = logoImg.width * ratio;
            const logoHeight = logoImg.height * ratio;
            // Dibuja el logo en la esquina superior izquierda con un margen de 10px
            ctx.drawImage(logoImg, 10, 10, logoWidth, logoHeight);
            canvas.toBlob((blob) => resolve({ name: imageFile.name, blob: blob! }), "image/png");
          };
        } else {
          canvas.toBlob((blob) => resolve({ name: imageFile.name, blob: blob! }), "image/png");
        }
      };
    });
  };

  const handleDownloadZip = async () => {
    if (!images.length || !logo) return;

    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
    for (const image of images) {
      const processedImage = await addLogoToImage(image);
      await zipWriter.add(processedImage.name, new BlobReader(processedImage.blob));
    }

    const zipBlob = await zipWriter.close();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "images_with_logo.zip";
    link.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold py-16">Añadir Logo y Descargar ZIP</h1>
      <div className="flex flex-col gap-5">
        <div className="flex gap-5 flex p-5 border border-base-300 bg-base-100 rounded-lg">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Selecciona las imagenes</legend>
            <input type="file" multiple onChange={handleImageUpload} className="file-input file-input-primary" />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Selecciona el logo</legend>
            <input type="file" onChange={handleLogoUpload} className="file-input file-input-primary" />
          </fieldset>
        </div>
        <button
          onClick={handleDownloadZip}
          className="btn btn-primary w-full"
        >
          Descargar ZIP
        </button>
      </div>
    </div>
  );
}