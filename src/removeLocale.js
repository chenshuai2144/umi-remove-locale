const parser = require('@babel/parser');
const traverse = require('@babel/traverse');
const generate = require('@babel/generator');
const prettier = require('prettier');
const t = require('babel-types');

/**
 * 生成代码
 * @param {*} ast
 */
function generateCode(ast) {
  const newCode = generate.default(ast, {}).code;
  return prettier.format(newCode, {
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
    parser: 'typescript',
  });
}

const genMessage = ({ id, defaultMessage }, localeMap) => {
  if (id && localeMap[id]) {
    return localeMap[id];
  }
  if (defaultMessage) {
    return defaultMessage;
  }
  return id;
};

const genAst = (ast, localeMap) => {
  traverse.default(ast, {
    enter(path) {
      if (path.isIdentifier({ name: 'formatMessage' })) {
        const { arguments: formatMessageArguments } = path.container;
        if (!formatMessageArguments) {
          return;
        }
        const params = {};
        formatMessageArguments.forEach(node => {
          node.properties.forEach(property => {
            params[property.key.name] = property.value.value;
          });
        });

        const message = genMessage(params, localeMap);
        const container = path.parentPath.parentPath;
        if (message) {
          const isJSXElement = container.parentPath.type === 'JSXElement';
          if (!isJSXElement) {
            container.replaceWithSourceString(`"${message}"`);
          } else {
            container.replaceWith(t.identifier(message));
          }
        }
      }
      if (path.isJSXIdentifier({ name: 'FormattedMessage' })) {
        const { attributes } = path.container;
        const params = {};
        attributes.forEach(node => {
          params[node.name.name] = node.value.value;
        });
        const message = genMessage(params, localeMap);
        if (message) {
          path.parentPath.replaceWith(t.identifier(message));
        }
      }
    },
  });
};

module.exports = (code, localeMap) => {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  genAst(ast, localeMap);
  return generateCode(ast);
};
