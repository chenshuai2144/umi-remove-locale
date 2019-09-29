const groupBy = require('lodash.groupby');
const fs = require('fs');
const { winPath } = require('umi-utils');
const glob = require('glob');
const { join, basename } = require('path');
const tsImport = require('node-import-ts');

function getLocaleFileList(absSrcPath, absPagesPath, singular) {
  const localeFileMath = /^([a-z]{2})-([A-Z]{2})\.(js|ts)$/;
  const localeFolder = singular ? 'locale' : 'locales';

  const localeFiles = glob
    .sync('*.{ts,js}', {
      cwd: winPath(join(absSrcPath, localeFolder)),
    })
    .map(name => {
      const fileName = basename(name);
      const fileInfo = localeFileMath.exec(fileName);
      return { name: `${fileInfo[1]}-${fileInfo[2]}`, path: join(absSrcPath, localeFolder, name) };
    })
    .concat(
      glob
        .sync(`**/${localeFolder}/*.{ts,js}`, {
          cwd: winPath(absPagesPath),
        })
        .map(name => join(absPagesPath, name))
        .filter(p => localeFileMath.test(basename(p)))
        .map(fullName => {
          const fileName = basename(fullName);
          const fileInfo = localeFileMath.exec(fileName);
          return {
            name: `${fileInfo[1]}-${fileInfo[2]}`,
            path: fullName,
          };
        }),
    );
  const groups = groupBy(localeFiles, 'name');
  return groups;
}

module.exports = (cwd, locale) => {
  let absSrcPath = join(cwd, 'src');
  let absPagesPath = cwd;
  if (fs.existsSync(join(cwd, 'package.json'))) {
    absSrcPath = join(cwd, 'src');
    absPagesPath = join(cwd, 'src/pages');
  }
  const localeFileObj = getLocaleFileList(absSrcPath, absPagesPath)[locale];
  if (!localeFileObj || localeFileObj.length < 1) {
    console.log('🎊 No files found');
    return;
  }
  const arrayList = localeFileObj.map(({ path }) => winPath(path));
  const localeMap = arrayList
    .map(filePath => tsImport(filePath))
    .reduce(
      (pre, item) => ({
        ...pre,
        ...item,
      }),
      {},
    );
  return localeMap || {};
};
