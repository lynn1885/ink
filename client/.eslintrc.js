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
    'no-use-before-define': 'warn',
    'no-restricted-syntax': 'warn',
    'no-underscore-dangle': 'off',
    'guard-for-in': 'warn',
    'import/no-unresolved': 'warn',
    'import/extensions': 'warn',
    'max-len': 'warn',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
