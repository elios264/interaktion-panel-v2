const { renderEmail } = require('./utils');

const en = ({ link, name }) => ({

  text: `
${process.env.APP_NAME}

Hi ${name}

To set your new password please open this url in a web browser:

${link}

Any questions or comments please contact the ${process.env.APP_NAME} team
`,

  html: renderEmail(`
  <mjml>
  <mj-head>
    <mj-preview>Password reset</mj-preview>
    <mj-font name="Lato" href="https://fonts.googleapis.com/css?family=Lato:400,400i,700" />
    <mj-attributes>
      <mj-class name="primary" color="#1A1A1A" />
      <mj-class name="contrast" color="#9EA1A3" />
      <mj-text font-family="Lato, sans-serif" />
      <mj-section padding="0px 10px" />
      <mj-column vertical-align="middle" />
      <mj-button align="left" inner-padding="0px" background-color="transparent" text-align="left" font-family="Lato, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="160px" src="${process.env.APP_LOGO_URL}" />
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#B8860B" />
        <mj-text mj-class="primary" font-weight="700" font-size="20px">Hi ${name}</mj-text>
        <mj-text mj-class="primary" font-size="15px">To set your new password please click on the following link:</mj-text>
        <mj-button mj-class="contrast" href="${link}">${link}</mj-button>
        <mj-text mj-class="primary" font-size="15px">If you cannot access the link, please copy the url and paste it in a web browser.</mj-text>

        <mj-text mj-class="primary" font-style="italic" padding-bottom="5px">Any questions or comments please contact the ${process.env.APP_NAME} development team.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`),

});

const es = ({ link, name }) => ({

  text: `
${process.env.APP_NAME}

Hola ${name}

Para establecer su nueva contraseña haga acceda a esta url en un navegador:

${link}

Para preguntas o comentarios por favor contacte al equipo de ${process.env.APP_NAME}
`,

  html: renderEmail(`
  <mjml>
  <mj-head>
    <mj-preview>Establecimiento de contraseña</mj-preview>
    <mj-font name="Lato" href="https://fonts.googleapis.com/css?family=Lato:400,400i,700" />
    <mj-attributes>
      <mj-class name="primary" color="#1A1A1A" />
      <mj-class name="contrast" color="#9EA1A3" />
      <mj-text font-family="Lato, sans-serif" />
      <mj-section padding="0px 10px" />
      <mj-column vertical-align="middle" />
      <mj-button align="left" inner-padding="0px" background-color="transparent" text-align="left" font-family="Lato, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="160px" src="${process.env.APP_LOGO_URL}" />
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#B8860B" />
        <mj-text mj-class="primary" font-weight="700" font-size="20px">Hola ${name}</mj-text>
        <mj-text mj-class="primary" font-size="15px">Para establecer su nueva contraseña haga click en este link:</mj-text>
        <mj-button mj-class="contrast" href="${link}">${link}</mj-button>
        <mj-text mj-class="primary" font-size="15px">Si no puede acceder al link, por favor copie y pegue la url en un navegador web.</mj-text>

        <mj-text mj-class="primary" font-style="italic" padding-bottom="5px">Para preguntas o comentarios por favor contacte al equipo de ${process.env.APP_NAME}.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`),

});

module.exports = ({ language, ...props }) => {
  const templates = { en, es };
  const template = templates[language] || templates[process.env.APP_LOCALE];
  return template(props);
};
