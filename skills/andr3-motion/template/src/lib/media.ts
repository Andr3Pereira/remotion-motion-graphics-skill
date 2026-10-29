import {Skia, type SkImage} from '@shopify/react-native-skia';
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

// Carrega uma imagem de public/ (captura, logo, fotografia) para Skia. O render espera por ela.
export const useImagem = (ficheiro: string): SkImage | null => {
  const [img, setImg] = useState<SkImage | null>(null);
  const [handle] = useState(() => delayRender(`imagem ${ficheiro}`));
  useEffect(() => {
    Skia.Data.fromURI(staticFile(ficheiro)).then((d) => {
      const i = Skia.Image.MakeImageFromEncoded(d);
      if (!i) throw new Error(`Imagem inválida: ${ficheiro}`);
      setImg(i);
      continueRender(handle);
    });
  }, [ficheiro, handle]);
  return img;
};
