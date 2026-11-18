const fs = require('fs');

// Single source of truth: the literal names declared in the icon registry.
const icons = [
  ...new Set(
    fs
      .readFileSync(`${__dirname}/src/icons/registry.ts`, 'utf8')
      .match(/(?:solar|mdi):[a-z0-9-]+/g),
  ),
];

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-iconify/babel', { icons }]],
  };
};
