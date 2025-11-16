const fs = require("fs");
const path = require("path");
const https = require("https");

// Firebase config
const FIREBASE_CONFIG = {
  storageBucket: "sign-mt-assets",
};

// Download generic "spoken-signed" model as fallback
const GENERIC_MODEL_DIR = path.join(
  __dirname,
  "../public/assets/models/browsermt/spoken-to-signed/spoken-signed"
);
const GENERIC_FILES = [
  {
    remote:
      "models/browsermt/spoken-to-signed/spoken-signed/model.spokensigned.intgemm.alphas.bin",
    local: "model.spokensigned.intgemm.alphas.bin",
  },
  {
    remote:
      "models/browsermt/spoken-to-signed/spoken-signed/lex.50.50.spokensigned.s2t.bin",
    local: "lex.50.50.spokensigned.s2t.bin",
  },
  {
    remote:
      "models/browsermt/spoken-to-signed/spoken-signed/vocab.spokensigned.spm",
    local: "vocab.spokensigned.spm",
  },
];

// Tạo thư mục
if (!fs.existsSync(GENERIC_MODEL_DIR)) {
  fs.mkdirSync(GENERIC_MODEL_DIR, { recursive: true });
  console.log(`Created directory: ${GENERIC_MODEL_DIR}`);
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https
      .get(url, (response) => {
        if (response.statusCode === 200 || response.statusCode === 302) {
          if (response.statusCode === 302 && response.headers.location) {
            file.close();
            return downloadFile(response.headers.location, filepath)
              .then(resolve)
              .catch(reject);
          }

          response.pipe(file);
          file.on("finish", () => {
            file.close();
            const stats = fs.statSync(filepath);
            console.log(
              `✓ Downloaded: ${path.basename(filepath)} (${(
                stats.size /
                1024 /
                1024
              ).toFixed(2)} MB)`
            );
            resolve();
          });
        } else {
          file.close();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(err);
      });
  });
}

async function main() {
  console.log('📥 Downloading generic "spoken-signed" model as fallback...\n');
  console.log(`📁 Target directory: ${GENERIC_MODEL_DIR}\n`);

  const results = [];

  for (const { remote, local } of GENERIC_FILES) {
    const localPath = path.join(GENERIC_MODEL_DIR, local);

    // Skip nếu đã tồn tại
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      if (stats.size > 0) {
        console.log(
          `⏭ Skipping ${local} (already exists, ${(
            stats.size /
            1024 /
            1024
          ).toFixed(2)} MB)`
        );
        results.push({ file: local, success: true });
        continue;
      }
    }

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${
      FIREBASE_CONFIG.storageBucket
    }/o/${encodeURIComponent(remote)}?alt=media`;

    try {
      await downloadFile(downloadUrl, localPath);
      results.push({ file: local, success: true });
    } catch (error) {
      console.error(` Failed to download ${local}: ${error.message}`);
      results.push({ file: local, success: false });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("=".repeat(60));

  let successCount = 0;
  for (const { file, success } of results) {
    const status = success ? "✓" : "✗";
    console.log(`${status} ${file}`);
    if (success) successCount++;
  }

  console.log("=".repeat(60));
  console.log(
    `\Successfully downloaded: ${successCount}/${GENERIC_FILES.length} files`
  );

  if (successCount === GENERIC_FILES.length) {
    console.log("\n Generic model downloaded successfully!");
    console.log("\nNote:");
    console.log(
      '   The generic "spoken-signed" model can be used as fallback.'
    );
    console.log("   Your code already supports this with the format:");
    console.log("   `$${spokenLanguage} $${signedLanguage} ${text}`");
    console.log('\n   Example: "$en $ase Hello world"');
  }
}

main().catch(console.error);
