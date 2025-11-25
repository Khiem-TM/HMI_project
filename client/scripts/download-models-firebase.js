const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Firebase config
const FIREBASE_CONFIG = {
  projectId: "sign-mt",
  appId: "1:665830225099:web:18e0669d5847a4b047974e",
  databaseURL: "https://sign-mt-default-rtdb.firebaseio.com",
  storageBucket: "sign-mt-assets", 
  locationId: "us-central",
  authDomain: "sign-mt.firebaseapp.com",
  messagingSenderId: "665830225099",
  measurementId: "G-1LXY5W5Z9H",
  apiKey: "AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg", // From translate-master
};

const MODEL_DIR = path.join(
  __dirname,
  "../public/assets/models/browsermt/spoken-to-signed/en-ase"
);
const FILES = [
  "model.enase.intgemm.alphas.bin",
  "lex.50.50.enase.s2t.bin",
  "vocab.enase.spm",
];

// Tạo thư mục nếu chưa có
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log(`Created directory: ${MODEL_DIR}`);
}

// Function để download file từ URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 200 || response.statusCode === 302) {
          // Handle redirect
          if (response.statusCode === 302 && response.headers.location) {
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
        } else if (response.statusCode === 404) {
          file.close();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          reject(new Error(`File not found (404): ${url}`));
        } else {
          file.close();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
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

// Function để lấy download URL từ Firebase Storage
async function getFirebaseDownloadUrl(filePath) {
  // Method 1: Try direct Firebase Storage URL
  const encodedPath = encodeURIComponent(filePath);
  const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_CONFIG.storageBucket}/o/${encodedPath}`;

  // Try với alt=media parameter
  const directUrl = `${baseUrl}?alt=media`;

  return directUrl;
}

// Function để download với retry
async function downloadWithRetry(fileName, maxRetries = 3) {
  const filePath = `models/browsermt/spoken-to-signed/en-ase/${fileName}`;
  const localPath = path.join(MODEL_DIR, fileName);

  // Skip nếu file đã tồn tại
  if (fs.existsSync(localPath)) {
    const stats = fs.statSync(localPath);
    if (stats.size > 0) {
      console.log(
        `⏭ Skipping ${fileName} (already exists, ${(
          stats.size /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
      return true;
    }
  }

  console.log(`\n📥 Downloading ${fileName}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const downloadUrl = await getFirebaseDownloadUrl(filePath);
      console.log(
        `   Attempt ${attempt}/${maxRetries}: ${downloadUrl.substring(
          0,
          100
        )}...`
      );

      await downloadFile(downloadUrl, localPath);
      return true;
    } catch (error) {
      console.error(`   ✗ Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      } else {
        console.error(
          `   ✗ Failed to download ${fileName} after ${maxRetries} attempts`
        );
        return false;
      }
    }
  }

  return false;
}

// Main function
async function main() {
  console.log(
    "🚀 Starting BrowserMT model download from Firebase Storage...\n"
  );
  console.log(`📁 Target directory: ${MODEL_DIR}\n`);
  console.log(`📦 Storage bucket: ${FIREBASE_CONFIG.storageBucket}\n`);

  const results = [];

  for (const file of FILES) {
    const success = await downloadWithRetry(file);
    results.push({ file, success });
  }

  console.log("\n" + "=".repeat(60));
  console.log(" Download Summary:");
  console.log("=".repeat(60));

  let successCount = 0;
  for (const { file, success } of results) {
    const status = success ? "✓" : "✗";
    console.log(`${status} ${file}`);
    if (success) successCount++;
  }

  console.log("=".repeat(60));
  console.log(
    `\n Successfully downloaded: ${successCount}/${FILES.length} files`
  );

  if (successCount < FILES.length) {
    console.log("\n  Some files failed to download.");
    console.log("   Possible reasons:");
    console.log("   1. Files require Firebase authentication");
    console.log("   2. Files are not publicly accessible");
    console.log("   3. Files do not exist in Firebase Storage");
    console.log("\n   Try:");
    console.log("   - Check Firebase Storage console");
    console.log("   - Verify file paths are correct");
    console.log("   - Use Firebase Admin SDK with service account if needed");
    process.exit(1);
  } else {
    console.log("\n All models downloaded successfully!");
    console.log('   Run "npm run verify-models" to verify files.');
  }
}

main().catch(console.error);
