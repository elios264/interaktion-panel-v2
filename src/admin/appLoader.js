/* eslint-disable import/first */
import 'react-virtualized/styles.css';
import 'semantic-ui-less/semantic.less';
import 'theme/theme.less';
import 'tachyons';

import _ from 'lodash';
import React from 'react';
import moment from 'moment';

moment.locale(_.first(_.words(window.__ENVIRONMENT__.APP_LOCALE)));

import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { BrowserRouter, Route } from 'react-router-dom';

import { Api } from './api';
import { App } from './components/app';
import { rootReducer } from './reducers';
import { initialize } from './actions/initializers';

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
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./reducers', () => store.replaceReducer(rootReducer));
}
