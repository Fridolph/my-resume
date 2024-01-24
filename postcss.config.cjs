/* eslint-env node */
module.exports = {
  plugins: [
    require('postcss-import'),    
    require('postcss-each-variables'),
    require('postcss-nested'),
    require('postcss-each')({
      plugins: {
        beforeEach: [require('postcss-for'), require('postcss-color-mix')],
      },
    }),
    require('autoprefixer'),
    require('tailwindcss'),
    require('tailwindcss/nesting'),
  ],
}
