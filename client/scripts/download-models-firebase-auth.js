const fs = require("fs");
const path = require("path");
const https = require("https");

// Firebase config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg",
  authDomain: "sign-mt.firebaseapp.com",
  projectId: "sign-mt",
  storageBucket: "sign-mt-assets",
  messagingSenderId: "665830225099",
  appId: "1:665830225099:web:18e0669d5847a4b047974e",
  measurementId: "G-1LXY5W5Z9H",
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

// Try alternative paths
const ALTERNATIVE_PATHS = [
  "models/browsermt/spoken-to-signed/en-ase/",
  "models/browsermt/spoken-to-signed/spoken-signed/", // Generic model
  "models/browsermt/spoken-to-signed/en-fr/", // Alternative
];

// Function để list files trong directory
async function listFirebaseDirectory(dirPath) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(dirPath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_CONFIG.storageBucket}/o?prefix=${encodedPath}&maxResults=1000`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.items) {
              resolve(json.items.map((item) => item.name));
            } else {
              resolve([]);
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// Function để download file từ URL
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
        } else if (response.statusCode === 404) {
          file.close();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          reject(new Error(`File not found (404)`));
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

// Function để tìm và download file
async function findAndDownloadFile(fileName) {
  console.log(`\nSearching for ${fileName}...`);

  // Try direct path first
  const directPath = `models/browsermt/spoken-to-signed/en-ase/${fileName}`;
  const directUrl = `https://firebasestorage.googleapis.com/v0/b/${
    FIREBASE_CONFIG.storageBucket
  }/o/${encodeURIComponent(directPath)}?alt=media`;

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

  // Try direct download first
  try {
    console.log(`   Trying direct path...`);
    await downloadFile(directUrl, localPath);
    return true;
  } catch (error) {
    console.log(`   ✗ Direct path failed: ${error.message}`);
  }

  // Try listing directories to find the file
  for (const altPath of ALTERNATIVE_PATHS) {
    try {
      console.log(`   Checking directory: ${altPath}`);
      const files = await listFirebaseDirectory(altPath);

      // Look for matching file
      const matchingFile = files.find(
        (f) => f.includes(fileName) || f.endsWith(fileName)
      );
      if (matchingFile) {
        console.log(`   ✓ Found: ${matchingFile}`);
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${
          FIREBASE_CONFIG.storageBucket
        }/o/${encodeURIComponent(matchingFile)}?alt=media`;
        await downloadFile(downloadUrl, localPath);
        return true;
      }
    } catch (error) {
      console.log(`   ✗ Directory listing failed: ${error.message}`);
    }
  }

  // Try alternative file names
  const alternatives = [
    fileName,
    fileName.replace("enase", "en-ase"),
    fileName.replace(".enase.", ".en-ase."),
  ];

  for (const altName of alternatives) {
    if (altName === fileName) continue;

    const altPath = `models/browsermt/spoken-to-signed/en-ase/${altName}`;
    const altUrl = `https://firebasestorage.googleapis.com/v0/b/${
      FIREBASE_CONFIG.storageBucket
    }/o/${encodeURIComponent(altPath)}?alt=media`;

    try {
      console.log(`   Trying alternative name: ${altName}`);
      await downloadFile(altUrl, localPath);
      return true;
    } catch (error) {
      // Continue to next alternative
    }
  }

  console.log(`   ✗ Could not find ${fileName}`);
  return false;
}

// Main function
async function main() {
  console.log(
    "🚀 Starting BrowserMT model download from Firebase Storage...\n"
  );
  console.log(`Target directory: ${MODEL_DIR}\n`);
  console.log(`Storage bucket: ${FIREBASE_CONFIG.storageBucket}\n`);

  // First, try to list what's available
  console.log(" Checking available files in Firebase Storage...\n");
  try {
    const files = await listFirebaseDirectory(
      "models/browsermt/spoken-to-signed/"
    );
    if (files.length > 0) {
      console.log(`Found ${files.length} files:`);
      files.slice(0, 20).forEach((f) => console.log(`  - ${f}`));
      if (files.length > 20) {
        console.log(`  ... and ${files.length - 20} more`);
      }
      console.log("");
    } else {
      console.log("No files found in browsermt/spoken-to-signed/\n");
    }
  } catch (error) {
    console.log(`Could not list directory: ${error.message}\n`);
  }

  const results = [];

  for (const file of FILES) {
    const success = await findAndDownloadFile(file);
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
    console.log("\n Suggestions:");
    console.log("   1. Models may require Firebase authentication");
    console.log(
      "   2. Models may not exist yet (en-ase might need to be trained)"
    );
    console.log(
      '   3. Try using the generic "spoken-signed" model as fallback'
    );
    console.log(
      "   4. Check Firebase Storage console: https://console.firebase.google.com/project/sign-mt/storage"
    );
    process.exit(1);
  } else {
    console.log("\n All models downloaded successfully!");
    console.log('   Run "npm run verify-models" to verify files.');
  }
}

main().catch(console.error);
