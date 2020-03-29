import React from 'react';
import { Image, Label } from 'semantic-ui-react';
import _ from 'lodash';
import { Popup } from '../popup';
import * as utils from '../utils';

export const dateRenderer = ({ cellData, columnData = {} }) => cellData ? utils.formatDate(cellData, columnData.format) : undefined;
export const imageRenderer = ({ cellData, columnData = {} }) => <Image src={cellData || require('img/empty.png')} {...columnData} />; // eslint-disable-line react/prop-types
export const labelRenderer = ({ cellData, columnData = {}, message }) => <Popup inverted message={message} enabled={!!message}><Label content={cellData} {...columnData} /></Popup>;// eslint-disable-line react/prop-types
export const defaultDataRenderer = ({ cellData, columnData = {} }) => cellData || columnData.defaultData;
export const currencyRenderer = ({ cellData }) => _.isNumber(cellData) ? utils.formatCurrency(cellData) : undefined;

labelRenderer.search = ({ cellData }) => cellData;
