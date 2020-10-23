import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useEffect } from 'react';
import { Header, Image, Segment } from 'semantic-ui-react';
import cx from 'classnames';

export const DisplayMessage = ({ header, content, redirect, helmet, history }) => {

  useEffect(() => {
    if (redirect && history) {
      setTimeout(() => {
        history.replace('/');
      }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (!content && redirect) {
    content = 'Wait 3 seconds to be redirected ...';
  }

  return (
    <div className='display-message flex items-center flex-column min-vh-100 w-100 pa3'>
      <Helmet title={helmet || header} />
      <div className='flex-auto flex justify-center flex-column'>
        <Image src={window.__ENVIRONMENT__.APP_LOGO_URL} alt='logo' size='medium' className='center mb3' />
        <Segment raised color='blue' textAlign='center' padded>
          <Header size='large'>
            <Header.Content className={cx('normal', { mb2: !!content })}>
              {header}
            </Header.Content>
            <Header.Subheader>
              {content}
            </Header.Subheader>
          </Header>
        </Segment>
      </div>
      <div className='self-stretch pt3 mt-auto justify-between flex-wrap flex'>
        <div className='mr3'>Build: <span className='b'>{window.__ENVIRONMENT__.BUILD}</span> Environment: <span className='b'>{window.__ENVIRONMENT__.BUILD_ENVIRONMENT}</span></div>
        <div>Developed by <a className='contrast dim' href='mailto:elios264@outlook.com' rel='noopener noreferrer' target='_blank'>elios264</a></div>
      </div>
    </div>
  );
};

DisplayMessage.propTypes = {
  redirect: PropTypes.bool,
  header: PropTypes.node.isRequired,
  content: PropTypes.node,
  helmet: PropTypes.string,
  history: PropTypes.object,
};
