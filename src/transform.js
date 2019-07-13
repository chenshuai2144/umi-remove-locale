const babel = require('@babel/core');

module.exports = filePath => {
  const { code } = babel.transformFileSync(filePath, {
    presets: [
      [
        '@babel/env',
        {
          targets: {
            node: true,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  });
  return code;
};
