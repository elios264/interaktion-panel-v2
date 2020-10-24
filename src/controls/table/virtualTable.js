/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/static-property-placement */
import './virtualTable.less';

import _ from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import {
  Table, Column, AutoSizer, SortDirection,
} from 'react-virtualized';
import { createSelector } from 'reselect';
import { Checkbox } from 'semantic-ui-react';
import cx from 'classnames';

import * as utils from '../utils';
import { BoundCheckbox } from '../bindables';

const sortDirMapping = { asc: SortDirection.ASC, desc: SortDirection.DESC };
const noRowsRenderer = () => <div className='no-rows'>No data to display</div>;

const formatTableColumns = (cols, includeHidden = false) => _(utils.flattenReactChildren(cols))
  .flattenDeep()
  .compact()
  .filter((col) => !col.props.internal && (includeHidden || col.props.visible))
  .map('props')
  .map(({
    disableSearch, cellRenderer, cellDataGetter, dataKey, searchKey, label, columnData,
  }) => ({
    label,
    valueRaw: dataKey,
    value: (searchKey || disableSearch)
      ? _.isFunction(searchKey)
        ? ({ rowData }) => searchKey({ rowData, columnData, cellData: cellDataGetter({ rowData, dataKey }) })
        : ({ rowData }) => (disableSearch ? '' : cellDataGetter({ rowData, dataKey: searchKey }))
      : ({ rowData }) => cellRenderer({ columnData, rowData, cellData: cellDataGetter({ rowData, dataKey }) }),
  }))
  .value();

export { Column };
export class VirtualTable extends Component {

  static propTypes = {
    keyAccessor: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element),
    ])).isRequired,
    source: PropTypes.oneOfType([
      PropTypes.objectOf(PropTypes.object),
      PropTypes.arrayOf(PropTypes.object),
    ]),
    sortSearchParams: PropTypes.shape({
      sortBy: PropTypes.string,
      sortDir: PropTypes.string,
      search: PropTypes.string,
    }),
    onResultsChanged: PropTypes.func,
    onSortChange: PropTypes.func,
    onSelectionChange: PropTypes.func,
    rowHeight: PropTypes.number,
    headerHeight: PropTypes.number,
    maxHeight: PropTypes.number,
    disabled: PropTypes.bool,
    showTotals: PropTypes.bool,
    showHeader: PropTypes.bool,
    showSelection: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf(['disabled']).isRequired,
    ]),
    className: PropTypes.string,
    minWidth: PropTypes.number,
    renderNoRows: PropTypes.bool,
    selectedRows: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.string,
      PropTypes.number,
    ]),
    highlightedRows: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
  }

  static defaultProps = {
    rowHeight: 40,
    headerHeight: 60,
    maxHeight: 600,
    showHeader: true,
    keyAccessor: 'id',
    sortSearchParams: {},
    onResultsChanged: _.identity,
    showTotals: true,
    renderNoRows: true,
    selectedRows: [],
    highlightedRows: [],
    source: [],
  }

  static getDerivedStateFromProps({ selectedRows, highlightedRows }, prevState) {
    const newState = {};

    if (selectedRows !== prevState.lastSelectedRows) {
      _.assign(newState, { selectedRows: new Set(_.castArray(selectedRows)), lastSelectedRows: selectedRows });
    }

    if (highlightedRows !== prevState.lastHighlightedRows) {
      _.assign(newState, { highlightedRows: new Set(_.castArray(highlightedRows)), lastHighlightedRows: highlightedRows });
    }

    return _.isEmpty(newState) ? null : newState;
  }

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const { onResultsChanged } = this.props;
    const currentRows = this.getCurrentRows();
    if (this.lastRows !== currentRows) {
      this.lastRows = currentRows;
      onResultsChanged(currentRows);
    }
  }

  // eslint-disable-next-line react/sort-comp
  filterRows = createSelector(
    (state, props) => props.source,
    (state, props) => props.sortSearchParams,
    (state) => state.highlightedRows,
    (source, sortSearchParams, highlightedRows) => {
      const columns = formatTableColumns(this.props.children);
      const sortBy = _.findIndex(columns, ['valueRaw', sortSearchParams.sortBy]);
      const rows = utils.filterObjects(source, columns, { ...sortSearchParams, sortBy });

      return {
        rows,
        getRowClassName: ({ index }) => cx('data-row', { selected: highlightedRows.has(_.get(rows[index], this.props.keyAccessor, null)) }),
        getRow: ({ index }) => rows[index],
        originalLength: _.size(source),
        filteredLength: _.size(rows),
      };
    },
  );

  getCurrentRows = () => this.filterRows(this.state, this.props).rows;

  getAsDataArray = (formattedColumns, includeHidden = true) => {
    const { selectedRows } = this.state;
    const { children, keyAccessor } = this.props;
    const rows = _.filter(this.getCurrentRows(), (row) => selectedRows.has(_.get(row, keyAccessor)));

    return utils.toDataArray(rows.length ? rows : this.getCurrentRows(), formatTableColumns(children, includeHidden), formattedColumns);
  }

  renderSelectionCell = ({ rowData }) => {
    const { selectedRows } = this.state;
    const { keyAccessor, showSelection } = this.props;
    const rowId = _.get(rowData, keyAccessor);
    return <BoundCheckbox key={rowId} bind={rowData} checked={selectedRows.has(rowId)} disabled={showSelection === 'disabled'} onChange={this.checkRow} />;
  };

  renderSelectionHeaderCell = () => {
    const { selectedRows } = this.state;
    const { keyAccessor, showSelection } = this.props;
    const rows = this.getCurrentRows();
    const numberOfCurrentCheckedRows = _.sumBy(rows, (row) => (selectedRows.has(_.get(row, keyAccessor)) ? 1 : 0));

    const isChecked = numberOfCurrentCheckedRows === 0
      ? false
      : (numberOfCurrentCheckedRows === rows.length
        ? true
        : undefined);

    return <Checkbox onChange={this.checkAll} checked={isChecked || false} disabled={showSelection === 'disabled'} indeterminate={isChecked === undefined} />;
  }

  checkAll = (event, { checked }) => {
    const { keyAccessor } = this.props;

    let selectedRows;
    if (checked) {
      selectedRows = _.map(this.getCurrentRows(), keyAccessor);
      selectedRows = _.union(Array.from(this.state.selectedRows), selectedRows);
    } else {
      selectedRows = _.difference(Array.from(this.state.selectedRows), _.map(this.getCurrentRows(), keyAccessor));
    }

    this.setState(
      { selectedRows: new Set(selectedRows) },
      () => _.invoke(this.props, 'onSelectionChange', selectedRows),
    );
  }

  checkRow = (row) => {
    const rowId = _.get(row, this.props.keyAccessor);

    this.setState((prevState) => {
      const selectedRows = new Set(prevState.selectedRows);

      if (selectedRows.has(rowId)) {
        selectedRows.delete(rowId);
      } else {
        selectedRows.add(rowId);
      }

      return { selectedRows };
    }, () => _.invoke(this.props, 'onSelectionChange', Array.from(this.state.selectedRows)));

  }

  updateSort = ({ sortBy, sortDirection: sortDir }) => {
    sortDir = utils.getValue(sortDir, _.invert(sortDirMapping));
    this.props.onSortChange({ sortBy, sortDir });
  }

  render() {
    const {
      rows, getRow, originalLength, filteredLength, getRowClassName,
    } = this.filterRows(this.state, this.props);
    const {
      children, rowHeight, headerHeight, maxHeight, showSelection, onSortChange, showHeader, className, sortSearchParams, minWidth, showTotals, renderNoRows,
    } = this.props;
    const { selectedRows } = this.state;
    const { sortDir, sortBy } = sortSearchParams;
    const extraProps = _.omit(this.props, _.keys(VirtualTable.propTypes)); // eslint-disable-line react/forbid-foreign-prop-types
    const selectionCount = selectedRows.size;
    const flattenedChildren = utils.flattenReactChildren(children);
    return ([
      <AutoSizer key='table' disableHeight allowHorizontalScroll={minWidth !== undefined}>
        {({ width }) => (
          <Table
            rowCount={rows.length}
            headerClassName='header-column'
            rowClassName={getRowClassName}
            rowGetter={getRow}
            headerHeight={headerHeight}
            disableHeader={!showHeader}
            width={minWidth !== undefined ? Math.max(minWidth, width - 2) : width - 2}
            height={rows.length ? Math.min(maxHeight, (rows.length * rowHeight) + (!showHeader ? 0 : headerHeight)) : 100}
            sort={onSortChange ? this.updateSort : undefined}
            sortDirection={utils.getValue(sortDir, sortDirMapping)}
            sortBy={sortBy}
            rowHeight={rowHeight}
            noRowsRenderer={renderNoRows ? noRowsRenderer : undefined}
            className={cx('virtual-table', className)}
            {...extraProps}
          >
            {showSelection && (
              <Column
                dataKey='selectionKey'
                width={20}
                minWidth={20}
                internal
                disableSort
                disableSearch
                cellRenderer={this.renderSelectionCell}
                headerRenderer={this.renderSelectionHeaderCell}
              />
            )}
            {_.filter(flattenedChildren, 'props.visible')}
          </Table>
        )}
      </AutoSizer>,
      showTotals && (
        <div key='totals' className='mt2 tr b'>
          {filteredLength !== originalLength
            ? `Showing ${filteredLength} of ${originalLength} ${originalLength === 1 ? 'record' : 'records'}`
            : `${originalLength}  ${originalLength === 1 ? 'record' : 'records'}` }
          {selectionCount ? `, ${selectionCount} selected` : null }
        </div>
      ),
    ]);
  }
}
