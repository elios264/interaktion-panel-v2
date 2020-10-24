import _ from 'lodash';
import { Button, Dropdown, Loader } from 'semantic-ui-react';
import { makeAwaitable } from './makeAwaitable';

export { makeAwaitable };
export const AwaitableAnchor = makeAwaitable({ event: 'onClick', props: { style: { cursor: 'wait', color: 'gray' }, onClick: _.noop } })('a');
export const AwaitableButton = makeAwaitable({ event: 'onClick', props: { disabled: true, loading: true } })(Button);
export const AwaitableDropdownItem = makeAwaitable({ event: 'onClick', props: { disabled: true, icon: <Loader active inline size='tiny' className='icon' /> } })(Dropdown.Item);
