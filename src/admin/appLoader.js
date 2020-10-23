import 'react-virtualized/styles.css';
import 'semantic-ui-less/semantic.less';
import 'tachyons';
import 'theme/theme.less';

import moment from 'moment';
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { BrowserRouter, Route } from 'react-router-dom';

moment.locale(window.__ENVIRONMENT__.APP_LOCALE);

const { Api } = require('./api');
const { App } = require('./components/app');
const { rootReducer } = require('./reducers');
const { initialize } = require('./actions/initializers');

const api = new Api();
const composeEnhancers = process.env.NODE_ENV === 'production' ? compose : (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose);
const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk.withExtraArgument({ api }))));

store.dispatch(initialize());

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter basename={window.__ENVIRONMENT__.APP_ADMIN_PATH}>
      <Route component={App} />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
);

if (module.hot) {
  module.hot.accept('./reducers', () => store.replaceReducer(rootReducer));
}
