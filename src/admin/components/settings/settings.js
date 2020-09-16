import React from 'react';
import { Grid, Menu } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { ContentDefinitionsOrder } from './contentDefinitionsOrder';
import { ClientFeatures } from './clientFeatures';

export const Settings = () => (
  <section className='settings'>
    <Helmet title='Settings' />
    <Menu attached stackable className='sticky-ns z-1' />
    <div className='pa2'>
      <Grid stackable>
        <Grid.Row>
          <Grid.Column computer={16} largeScreen={8} widescreen={8}>
            <ContentDefinitionsOrder />
          </Grid.Column>
          <Grid.Column computer={16} largeScreen={8} widescreen={8} className='pt4-m pt0-l'>
            <ClientFeatures />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  </section>
);
