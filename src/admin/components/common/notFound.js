import React from 'react';
import { Link } from 'react-router-dom';
import { DisplayMessage } from './displayMessage';


const content = (
  <>
    <div className='mb2'>
      The page you are looking for does not exist
    </div>
    <div>
      Click <Link to='/'>here</Link> to return to the main page.
    </div>
  </>
);


export const NotFound = React.memo(() => <DisplayMessage header='Page not found' content={content} />);

NotFound.displayName = 'NotFound';
