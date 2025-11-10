
import { ImageFile } from '../types';

export const fileToGenerativePart = async (file: File): Promise<ImageFile> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        resolve("");
      }
    };
    reader.readAsDataURL(file);
  });

  return {
    base64: await base64EncodedDataPromise,
    mimeType: file.type,
  };
};
