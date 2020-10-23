import './app.less';

import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';

import { ModalController } from 'controls/modals';
import { DisplayMessage, Navigation, ErrorBoundary } from './common';
import { LoginForm, ForgotPasswordForm, ResetPasswordForm } from './authentication';
import { ManagersList, ManagerDetails } from './managers';
import { UsersList, UserDetails } from './users';
import { Logbook } from './logbook';
import { Settings } from './settings';
import { ContentDefinitionDetails, ContentList, ContentDetails } from './contents';

export const App = hot(() => {
  const modals = useSelector((state) => state.modals);
  const userInfo = useSelector((state) => state.userInfo);
  const initializing = useSelector((state) => state.siteInfo.initializing);

  return (
    <div id={window.__ENVIRONMENT__.APP_NAME} className='min-h-100 bg-near-white'>
      <Helmet titleTemplate={`%s | ${window.__ENVIRONMENT__.APP_NAME}`} defaultTitle={window.__ENVIRONMENT__.APP_NAME}>
        <html lang='en' />
        <meta name='description' content={window.__ENVIRONMENT__.APP_NAME} />
        <meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no' />
        <link rel='icon' href={window.__ENVIRONMENT__.APP_FAVICON_URL} />
      </Helmet>
      <ErrorBoundary>
        <Switch>
          <Route path='/invalid-link' render={(props) => <DisplayMessage header='The provided link is invalid.' {...props} />} />
          <Route path='/reset-success' render={(props) => <DisplayMessage header='Your password has been successfully set.' {...props} redirect content={'You\'ll be redirected to the main page'} />} />
          <Route path='/reset-password' component={ResetPasswordForm} />
          <Route path='/forgot-password' component={ForgotPasswordForm} />

          {initializing && <Route render={(props) => <DisplayMessage header='Accessing, wait a moment please...' {...props} />} />}
          {userInfo ? <Redirect to='/' from='/login' /> : <Route path='/login' component={LoginForm} />}
          {!userInfo && <Redirect to='/login' />}
          <Redirect exact from='/' to='/managers' />

          <Route render={(props) => (
            <Navigation {...props}>
              <Switch>
                <Route exact path='/managers/:action(create)?' component={ManagersList} />
                <Route exact path='/managers/details/:userId/:action(edit)?' component={ManagerDetails} />

                <Route exact path='/users/:action(create)?' component={UsersList} />
                <Route exact path='/users/details/:userId/:action(edit)?' component={UserDetails} />

                <Route exact path='/contents/:action(create)' component={ContentDefinitionDetails} />
                <Route exact path='/contents/:definitionId/:action(edit)' component={ContentDefinitionDetails} />
                <Route exact path='/contents/:definitionId' component={ContentList} />
                <Route exact path='/contents/:definitionId/:action(create)' component={ContentDetails} />
                <Route exact path='/contents/:definitionId/details/:contentId/:action(edit)?' component={ContentDetails} />

                <Route exact path='/settings' component={Settings} />
                <Route exact path='/logbook' component={Logbook} />

                <Redirect to='/' />
              </Switch>
            </Navigation>
          )} />
        </Switch>
        <ModalController modals={modals} />
      </ErrorBoundary>
    </div>
  );
});
