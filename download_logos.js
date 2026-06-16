import fs from 'fs';
import https from 'https';
import path from 'path';

const logosDir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const downloads = [
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Logo_ICMBio.png',
    dest: path.join(logosDir, 'icmbio.png')
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/L%C3%B3gotipo_da_Universidade_Federal_do_Sul_da_Bahia.png',
    dest: path.join(logosDir, 'ufsb.png')
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Edinburgh_Napier_University_logo.svg/320px-Edinburgh_Napier_University_logo.svg.png',
    dest: path.join(logosDir, 'napier.png')
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        if (response.statusCode === 301 || response.statusCode === 302) {
          download(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        reject(new Error(`Failed to download logo. Status code: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Successfully downloaded logo to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of downloads) {
    try {
      await download(item.url, item.dest);
    } catch (err) {
      console.error(`Error downloading logo:`, err);
    }
  }
}

run();
