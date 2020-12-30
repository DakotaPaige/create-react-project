#!/usr/bin/env node
const _ = require('lodash');
const fs = require('fs-extra');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const path = require('path');
const log = require(`../utils/log`);

const GITHUB_ORG = 'dakotapaige';

const initializeProject = function () {
  let projectName, projectTemplate;

  return {
    run: async function () {
      console.log('Creating a new project');

      await this.promptUser();
      await this.downloadTemplate();
      await this.generateTemplate();
      this.successMessage();
    },

    promptUser: async function () {
      ({ projectName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          validate: (t) => {
            if (_.isEmpty(t)) return 'Project name is required';
            if (_.kebabCase(t) !== t)
              return 'Project name must be kebab-cased (i.e. hello-world)';
            return true;
          },
        },
      ]));

      ({ projectTemplate } = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectTemplate',
          message: 'Select template:',
          choices: [
            {
              name: 'react-builder',
              value: `${GITHUB_ORG}/react-builder`,
            },
          ],
        },
      ]));
    },

    downloadTemplate: async function () {
      await new Promise((resolve, reject) => {
        download(
          projectTemplate,
          `${projectName}/tmp`,
          { clone: true },
          function (err) {
            if (err) {
              throw new Error('Failed to download repo');
            }
            resolve();
          }
        );
      });
    },

    generateTemplate: async function () {
      const dir = path.resolve(process.cwd(), projectName);

      const files = [...walk(path.resolve(dir, './tmp/template'))];

      console.log('');
      for (const file of files) {
        const src = path.join(dir, './tmp');
        const out = path.relative(src, file).startsWith('template/')
          ? path.relative(path.join(src, 'template'), file)
          : path.relative(src, file);
        const exts = [
          '.js',
          '.jsx',
          '.css',
          '.yaml',
          '.yml',
          '.json',
          '.html',
          '.md',
          '.xml',
        ];

        if (_.startsWith(`../`, out)) return;

        const outFile = path.join(dir, out);

        if (~exts.indexOf(path.extname(out))) {
          console.log(`Templating ${outFile}`);

          const s = await fs.readFile(file, `utf8`);
          const t = _.template(s, {
            interpolate: /{{=([\s\S]+?)}}/g,
          });
          const o = t({ projectName });

          await fs.mkdirs(path.dirname(outFile));
          await fs.writeFile(outFile, o);
        } else {
          await fs.mkdirs(path.dirname(outFile));
          await fs.copyFile(file, outFile);
        }
      }

      fs.remove(path.join(dir, './tmp'));
    },

    successMessage: function () {
      log.succeed('Successfully scaffolded project');
      console.log('');
      console.log('Run the following to start developing:');
      console.log('');
      console.log(`  cd ${projectName}`);
      console.log('  nvm use');
      console.log('  npm install');
      console.log('  npm run dev');
    },
  };
};

initializeProject().run();

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  });

  return fileList;
}
