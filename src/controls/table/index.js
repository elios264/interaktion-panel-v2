import _ from 'lodash';
import React from 'react';
import { AutoSizer, Column } from 'react-virtualized';

Column.defaultProps.disableSearch = false;
Column.defaultProps.visible = true;
Column.defaultProps.cellDataGetter = ({ rowData, dataKey }) => _.get(rowData, dataKey);

const originalRender = AutoSizer.prototype.render;
const autoOverflow = { overflow: 'auto' };
AutoSizer.prototype.render = function render() {
  const { allowHorizontalScroll } = this.props;
  const renderedElement = originalRender.call(this);

  return allowHorizontalScroll
    ? React.cloneElement(renderedElement, { style: autoOverflow })
    : renderedElement;
};

export * from './virtualTable';
export * from './renderers';
