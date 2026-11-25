const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/*'] },
  {
    // lucide-react-native ships only an `exports` map, which the import resolver cannot read. TypeScript and Metro resolve it fine.
    rules: { 'import/no-unresolved': ['error', { ignore: ['^lucide-react-native$'] }] },
  },
]);
