const fs = require('fs');
const path = require('path');

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.USERPROFILE || 'C:\\Users\\Hp', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
];

let found = null;
for (const p of paths) {
  if (fs.existsSync(p)) {
    found = p;
    break;
  }
}

if (found) {
  console.log('CHROME_PATH_FOUND:', found);
} else {
  console.log('CHROME_PATH_NOT_FOUND');
}
