const fs = require("fs");
const path = require("path");

const EN_ASE_DIR = path.join(
  __dirname,
  "../public/assets/models/browsermt/spoken-to-signed/en-ase"
);
const GENERIC_DIR = path.join(
  __dirname,
  "../public/assets/models/browsermt/spoken-to-signed/spoken-signed"
);

const EN_ASE_FILES = [
  "model.enase.intgemm.alphas.bin",
  "lex.50.50.enase.s2t.bin",
  "vocab.enase.spm",
];

const GENERIC_FILES = [
  "model.spokensigned.intgemm.alphas.bin",
  "lex.50.50.spokensigned.s2t.bin",
  "vocab.spokensigned.spm",
];

console.log("Checking BrowserMT model files...\n");

// Check en-ase model
console.log("📁 English to ASL (en-ase) model:");
console.log(`   Directory: ${EN_ASE_DIR}\n`);

let enAsePresent = true;
EN_ASE_FILES.forEach((file) => {
  const filePath = path.join(EN_ASE_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ✓ ${file} (${sizeMB} MB)`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    enAsePresent = false;
  }
});

console.log("\n");

// Check generic model
console.log("📁 Generic (spoken-signed) model:");
console.log(`   Directory: ${GENERIC_DIR}\n`);

let genericPresent = true;
GENERIC_FILES.forEach((file) => {
  const filePath = path.join(GENERIC_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ✓ ${file} (${sizeMB} MB)`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    genericPresent = false;
  }
});

const allPresent = enAsePresent || genericPresent;

console.log("\n");

// Check worker files
const WORKER_DIR = path.join(__dirname, "../public/browsermt");
const WORKER_FILES = [
  "worker.js",
  "bergamot-translator-worker.js",
  "bergamot-translator-worker.wasm",
];

console.log("Checking BrowserMT worker files...\n");
console.log(`Worker directory: ${WORKER_DIR}\n`);

WORKER_FILES.forEach((file) => {
  const filePath = path.join(WORKER_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ ${file} (${sizeKB} KB)`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allPresent = false;
  }
});

console.log("\n");

if (allPresent) {
  if (enAsePresent) {
    console.log(" en-ase model is present!");
  } else if (genericPresent) {
    console.log(" Generic model is present (will be used as fallback)");
    console.log(
      "   Note: en-ase model is missing, but generic model can be used."
    );
    console.log(
      "   The translation service will automatically use the generic model."
    );
  }
  process.exit(0);
} else {
  console.log("  Model files are missing.");
  console.log("\n To download models:");
  if (!genericPresent) {
    console.log("   Generic model: node scripts/download-generic-model.js");
  }
  if (!enAsePresent) {
    console.log("   en-ase model: Not available in Firebase Storage");
    console.log("                Contact sign.mt team or train your own model");
  }
  console.log("\n Model files should be placed in:");
  if (!enAsePresent) {
    console.log(`   en-ase: ${EN_ASE_DIR}`);
  }
  if (!genericPresent) {
    console.log(`   generic: ${GENERIC_DIR}`);
  }
  console.log("\n Worker files should be placed in:");
  console.log(`   ${WORKER_DIR}`);
  process.exit(1);
}
