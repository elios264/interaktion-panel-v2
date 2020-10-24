import { Popup as SemanticPopup } from 'semantic-ui-react';

const triggers = ['hover', 'focus'];

export const Popup = ({
  children, message, enabled, disabled, ...rest // eslint-disable-line react/prop-types
}) => (
  <SemanticPopup
    position='right center'
    on={triggers}
    content={message}
    open={enabled !== undefined ? (enabled ? undefined : false) : (disabled ? false : undefined)}
    trigger={children}
    {...rest}
  />
);
