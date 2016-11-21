import { api } from 'dva-ast';
import upperCamelCase from 'simple-uppercamelcase';
import { info, error } from './log';
import { basename, dirname, join } from 'path';
import { statSync, readFileSync } from 'fs';

function getBabelRc(cwd) {
  const rcPath = join(cwd, '.dvarc');
  if (statSync(rcPath).isFile()) {
    return JSON.parse(readFileSync(rcPath, 'utf-8'));
  } else {
    return {};
  }
}

function generate(program, { cwd }) {
  const defaultBase = 'src';
  const rc = getBabelRc(cwd);
  const base = program.base || rc.base || defaultBase;
  const defaultEntry = `${base}/index.js`;
  const defaultRouter = `${base}/router.js`;

  const [type, name] = program.args;

  try {
    switch (type) {
      case 'model':
        (() => {
          const modelPath = `./models/${name}`;
          const filePath = `${base}/models/${name}.js`;
          const entry = program.entry || defaultEntry;
          info('create', `model ${name}`);
          info('register', `to entry ${entry}`);
          api('models.create', {
            namespace: name,
            sourcePath: cwd,
            filePath,
            entry,
            modelPath,
          });
        })();
        break;
      case 'route':
        (() => {
          const componentName = upperCamelCase(name);
          const componentPath = `${base}/routes/${componentName}.js`;
          const componentCSSPath = `${base}/routes/${componentName}.css`;
          const withCSS = program.css ? `, ${componentCSSPath}` : '';
          info('create', `routeComponent ${componentPath}${withCSS}`);
          api('routeComponents.create', {
            sourcePath: cwd,
            filePath: componentPath,
            componentName,
            css: program.css,
          });
          info('create', `route ${name} with ${componentPath}`);
          api('router.createRoute', {
            filePath: program.router || defaultRouter,
            sourcePath: cwd,
            path: `/${name}`,
            component: {
              componentName,
              filePath: componentPath,
            },
          });
        })();
        break;
      case 'component':
        (() => {
          const fileName = basename(name);
          const fileDir = dirname(name);
          const componentName = upperCamelCase(fileName);
          const filePath = join(`${base}/components`, fileDir, `${componentName}.js`);
          const componentCSSPath = join(`${base}/components`, fileDir, `${componentName}.css`);
          const withCSS = program.css ? `, ${componentCSSPath}` : '';
          info('create', `component ${filePath}${withCSS}`);
          api('components.create', {
            sourcePath: cwd,
            filePath,
            componentName,
            css: program.css,
          });
        })();
        break;
      default:
        error(`ERROR: uncaught type ${type}`);
        break;
    }
  } catch (e) {
    error(e.stack);
  }
}

export default generate;
