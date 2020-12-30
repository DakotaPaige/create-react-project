const chalk = require('chalk');

exports.info = function (message, color) {
  if (color) {
    console.log(`${chalk[color](message)}`);
  } else {
    console.log(`${message}`);
  }
};

exports.succeed = function (message) {
  console.log(`\n${chalk.green(message)}`);
};

exports.warn = function (message) {
  console.log(`\n${chalk.yellow(message)}`);
};

exports.error = function (message) {
  console.log(`\n${chalk.red(message)}`);
};
