import { Button } from 'semantic-ui-react';
import { makeAwaitable } from './makeAwaitable';

export { makeAwaitable };
export const AwaitableButton = makeAwaitable({ event: 'onClick', props: { disabled: true, loading: true } })(Button);
