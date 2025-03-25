import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the testContractHelper.ts file
const testHelperPath = path.join(__dirname, '../src/tests/utils/testContractHelper.ts');

async function main() {
  console.log(`Updating test helper at ${testHelperPath}`);
  
  // Read the file
  let content = fs.readFileSync(testHelperPath, 'utf8');
  
  // Replace the hardcoded address
  const oldAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const newAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Use the same address to ensure consistency
  
  const updatedContent = content.replace(
    `const tokenAddress = "${oldAddress}"`,
    `const tokenAddress = "${newAddress}"`
  );
  
  if (content === updatedContent) {
    console.log("✅ Address already set correctly in the file.");
    return;
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(testHelperPath, updatedContent, 'utf8');
  
  console.log(`✅ Updated token address from ${oldAddress} to ${newAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Update failed:", error);
    process.exit(1);
  });
