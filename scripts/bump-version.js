const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '../app.json');
const appJson = require(appJsonPath);

// Current Versions
const currentVersion = appJson.expo.version; // e.g. "1.1.8"
const currentBuild = appJson.expo.android.versionCode || 1;

// Bump Build Number (versionCode)
const newBuild = currentBuild + 1;
appJson.expo.android.versionCode = newBuild;

// Bump Patch Version (x.y.Z)
const parts = currentVersion.split('.');
parts[2] = parseInt(parts[2], 10) + 1;
const newVersion = parts.join('.');
appJson.expo.version = newVersion;

// Save
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log(`Bumped version to ${newVersion} (Build ${newBuild})`);
