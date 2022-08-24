module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-param-reassign': 'warn',
    'no-use-before-define': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'guard-for-in': 'off',
    'no-continue': 'off',
    'import/no-unresolved': 'warn',
    'import/extensions': 'warn',
    'max-len': 'off',
    'comma-dangle': 'off',
    'function-paren-newline': 'warn',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
