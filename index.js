const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generate = require("@babel/generator");
const prettier = require("prettier");
const fs = require("fs");
const t = require("babel-types");

const code = `import { Button, Card, Icon, Result } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Fragment } from 'react';

import { GridContent } from '@ant-design/pro-layout';
import styles from './index.less';

const Content = (
  <Fragment>
    <div className={styles.title}>
      <FormattedMessage
        id="BLOCK_NAME.error.hint-title"
        defaultMessage="The content you submitted has the following error:"
      />
    </div>
    <div style={{ marginBottom: 16 }}>
      <Icon style={{ marginRight: 8 }} className={styles.error_icon} type="close-circle-o" />
      <FormattedMessage
        id="BLOCK_NAME.error.hint-text1"
        defaultMessage="Your account has been frozen"
      />
      <a style={{ marginLeft: 16 }}>
        <FormattedMessage id="BLOCK_NAME.error.hint-btn1" defaultMessage="Thaw immediately" />
        <Icon type="right" />
      </a>
    </div>
    <div>
      <Icon style={{ marginRight: 8 }} className={styles.error_icon} type="close-circle-o" />
      <FormattedMessage
        id="BLOCK_NAME.error.hint-text2"
        defaultMessage="Your account is not yet eligible to apply"
      />
      <a style={{ marginLeft: 16 }}>
        <FormattedMessage id="BLOCK_NAME.error.hint-btn2" defaultMessage="btn2" />
        <Icon type="right" />
      </a>
    </div>
  </Fragment>
);

export default () => (
  <GridContent>
    <Card bordered={false}>
      <Result
        status="error"
        title={formatMessage({ id: 'BLOCK_NAME.error.title' })}
        subTitle={formatMessage({ id: 'BLOCK_NAME.error.description', defaultMessage:"Your account is not yet eligible to apply"})}
        extra={
          <Button type="primary">
            <FormattedMessage id="BLOCK_NAME.error.btn-text" defaultMessage="Return to modify" />
          </Button>
        }
        style={{ marginTop: 48, marginBottom: 16 }}
      >
        {Content}
      </Result>
    </Card>
  </GridContent>
);
`;

const ast = parser.parse(code, {
  sourceType: "module",
  plugins: [
    // enable jsx and flow syntax
    "jsx",
    "typescript"
  ]
});

/**
 * 生成代码
 * @param {*} ast
 */
function generateCode(ast) {
  const newCode = generate.default(ast, {}).code;
  return prettier.format(newCode, {
    // format same as ant-design-pro
    singleQuote: true,
    trailingComma: "es5",
    printWidth: 100,
    parser: "typescript"
  });
}

traverse.default(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "formatMessage" })) {
      const { arguments: formatMessageArguments } = path.container;
      if (!formatMessageArguments) {
        return;
      }
      const params = {};
      formatMessageArguments.forEach(node => {
        node.properties.forEach(propertie => {
          params[propertie.key.name] = propertie.value.value;
        });
      });

      let message = "";
      if (params["defaultMessage"]) {
        message = `"${params["defaultMessage"]}"`;
      } else {
        if (params["id"]) {
          message = `"${params["id"]}"`;
        }
      }
      if (message) {
        path.parentPath.replaceWithSourceString(message);
      }
    }
    if (path.isJSXIdentifier({ name: "FormattedMessage" })) {
      const { attributes } = path.container;
      const params = {};
      attributes.forEach(node => {
        params[node.name.name] = node.value.value;
      });
      let message = "";
      if (params["defaultMessage"]) {
        message = `${params["defaultMessage"]}`;
      } else {
        if (params["id"]) {
          message = `${params["id"]}`;
        }
      }
      if (message) {
        path.parentPath.parentPath.replaceWith(t.identifier(message));
      }
    }
  }
});

const codeContent = generateCode(ast);

fs.writeFileSync("./test.tsx", codeContent, "utf-8");
