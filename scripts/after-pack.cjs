const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = async context => {
  if (context.electronPlatformName !== 'darwin') return;
  const bundle = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('/usr/bin/xattr', ['-cr', bundle]);
};
