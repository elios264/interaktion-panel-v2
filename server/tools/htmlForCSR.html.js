const _ = require('lodash');

const renderHtml = _.template(`
<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <% _.map(css, (item) => { %><link href="<%= item %>" rel="stylesheet"><% }) %>
    </head>
  <body>
    <div id="root"></div>
      <script>window.__ENVIRONMENT__ = Object.freeze(<%= JSON.stringify(environment) %>)</script>
      <% _.map(js, (item) => { %><script src="<%= item %>"></script><% }) %>
  </body>
</html>
`);

module.exports = ({ environment, css, js }) => renderHtml({ environment, css, js });
