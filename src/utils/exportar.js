import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// En Android escribe o ficheiro na caché e abre a folla de compartir do
// sistema (Drive, Gmail, Ficheiros…). No navegador descárgao.
export async function compartirFicheiro(nome, contido) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: nome,
      data: contido,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: nome, files: [uri], dialogTitle: 'Exportar datos' });
    return;
  }

  const url = URL.createObjectURL(new Blob([contido], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
