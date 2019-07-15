const glob = require('glob');
const { join } = require('path');
const fs = require('fs');
const { winPath } = require('umi-utils');
const getLocalFileList = require('./getLocalFileList');
const removeLocale = require('./removeLocale');
const eslintJs = require('./eslintJs');
const prettier = require('prettier');
const fabric = require('@umijs/fabric');
const ora = require('ora');

const spinner = ora();

const globList = (patternList, options) => {
  let fileList = [];
  patternList.forEach(pattern => {
    fileList = [...fileList, ...glob.sync(pattern, options)];
  });

  return fileList;
};
const prettierCode = (code, filepath) =>
  prettier.format(code, {
    ...fabric.prettier,
    filepath,
  });

const getFileContent = path => fs.readFileSync(winPath(path), 'utf-8');

module.exports = ({ cwd, locale = 'zh-CN', write }) => {
  // 寻找项目下的所有 ts
  spinner.start('🕵️‍  find js or ts files');
  const tsFiles = globList(['**/*.tsx', '**/*.ts', '**/*.js', '**/*.jsx'], {
    cwd,
    ignore: ['**/*.d.ts', '**/locales/**', '**/node_modules/**'],
  });
  spinner.succeed();

  spinner.start('🍻  load all locale file and build ts ');
  // 获得 locale 的配置
  const localeMap = getLocalFileList(cwd, locale);
  spinner.succeed();

  tsFiles.forEach((path, index) => {
    spinner.start(`✂️  remove locale for ${path}. (${index + 1}/${tsFiles.length})`);
    const source = getFileContent(join(cwd, path));
    if (source.includes('formatMessage') || source.includes('FormattedMessage')) {
      let content = removeLocale(source, localeMap);

      if (write) {
        content = prettierCode(eslintJs(content), path);
        fs.writeFileSync(join(cwd, path), content, 'utf-8');
        spinner.succeed();
        return;
      }
      console.log(content);
    }
    spinner.succeed();
  });
};
