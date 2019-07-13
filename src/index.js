const glob = require('glob');
const { join } = require('path');
const fs = require('fs');
const { winPath } = require('umi-utils');
const getLocalFileList = require('./getLocalFileList');
const removeLocale = require('./removeLocale');

const globList = (patternList, options) => {
  let fileList = [];
  patternList.forEach(pattern => {
    fileList = [...fileList, ...glob.sync(pattern, options)];
  });

  return fileList;
};

const getFileContent = path => fs.readFileSync(winPath(path), 'utf-8');

module.exports = ({ cwd, locale, write }) => {
  // 寻找项目下的所有 ts
  const tsFiles = globList(['**/*.tsx', '**/*.ts', '**/*.js', '**/*.jsx'], {
    cwd,
    ignore: ['**/*.d.ts', '**/locales/**'],
  });

  // 获得 locale 的配置
  const localeMap = getLocalFileList(cwd, locale);
  tsFiles.forEach(path => {
    const content = removeLocale(getFileContent(join(cwd, path)), localeMap);

    if (write) {
      fs.writeFileSync(join(cwd, path), content, 'utf-8');
      return;
    }
    console.log(content);
  });
};
