const mjml2html = require('mjml');

const renderEmail = (template) => {
  const { html, errors } = mjml2html(template, {
    minify: true,
    validationLevel: 'skip',
  });
  if (errors.length) {
    console.warn(errors);
  }
  return html;
};

module.exports = {
  renderEmail,
};
