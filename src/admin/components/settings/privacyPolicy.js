import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Segment, Button, Header, Grid, Form } from 'semantic-ui-react';

import { Popup, getJoiLanguagesValidationSchema, MultiLanguageInput } from 'controls';
import { useFieldset, useDispatchCallback } from 'controls/hooks';
import { savePrivacyPolicyUrl } from 'admin/actions/settings';

const privacyPolicySchema = {
  privacyPolicyUrl: getJoiLanguagesValidationSchema('Privacy policy', (r) => r.uri()),
};

export const PrivacyPolicy = () => {
  const privacyPolicyConfig = useSelector((state) => state.siteInfo.config['privacy-policy-url']);
  const privacyPolicyConfigInstance = useMemo(() => ({ privacyPolicyUrl: privacyPolicyConfig.value }), [privacyPolicyConfig.valueString]); // eslint-disable-line react-hooks/exhaustive-deps

  const { fields: { privacyPolicyUrl }, submit, loading, reset } = useFieldset({
    schema: privacyPolicySchema,
    onSubmit: useDispatchCallback(savePrivacyPolicyUrl),
    source: privacyPolicyConfigInstance,
  });

  return (
    <Segment raised>
      <Form onSubmit={submit}>
        <div className='mb4'>
          <Header
            content='Privacy policy url'
            size='large'
            subheader='Configure privacy policy url.'
            icon='info' />
        </div>
        <Grid>
          <Grid.Column>
            <Form.Field error={privacyPolicyUrl.errored} required>
              <label>Privacy policy url</label>
              <Popup message={privacyPolicyUrl.message} enabled={privacyPolicyUrl.errored}>
                <MultiLanguageInput value={privacyPolicyUrl.value} onChange={privacyPolicyUrl.onChange} autoComplete='off' />
              </Popup>
            </Form.Field>

          </Grid.Column>
        </Grid>
        <div className='tr mt3'>
          <Button
            type='button'
            className='w-100 w-auto-ns'
            secondary
            disabled={loading}
            loading={loading}
            onClick={reset}
            icon='cancel'
            content='Cancel' />
          <div className='db mt1 di-ns mt0-ns' />
          <Button
            type='submit'
            disabled={loading}
            loading={loading}
            className='w-100 w-auto-ns'
            primary
            icon='edit'
            content='Save' />
        </div>
      </Form>
    </Segment>
  );
};
