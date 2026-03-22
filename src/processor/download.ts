import axios from 'axios';
import * as fs from 'fs';

export async function downloadVideo(url: string, filePath: string) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  return new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
}
