import 'react-day-picker/lib/style.css';

import _ from 'lodash';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Helmet } from 'react-helmet';
import React, { PureComponent } from 'react';
import DayPicker from 'react-day-picker';
import MomentLocaleUtils from 'react-day-picker/moment';
import { Input, Popup, Label, Button, Icon, Select } from 'semantic-ui-react';
import { createSelector } from 'reselect';
import cx from 'classnames';

import { BoundAnchor } from './bindables';
import { Range } from './range';
import { formatDate } from './utils';

const dateRanges = _.keyBy([
  { key: 'today', label: 'Today', start: moment().startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'yesterday', label: 'Yesterday', start: moment().subtract(1, 'days').startOf('day').toDate(), end: moment().subtract(1, 'days').endOf('day').toDate() },
  { key: 'last7Days', label: 'Last 7 days', start: moment().subtract(6, 'days').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'last30Days', label: 'Last 30 days', start: moment().subtract(29, 'days').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'thisMonth', label: 'This month', start: moment().startOf('month').toDate(), end: moment().endOf('day').toDate() },
  { key: 'last6Months', label: 'Last 6 months', start: moment().subtract(6, 'month').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'thisYear', label: 'This Year', start: moment().startOf('year').toDate(), end: moment().endOf('day').toDate() },
  { key: 'lastYear', label: 'Last Year', start: moment().subtract(1, 'year').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'last2Years', label: 'Last 2 years', start: moment().subtract(2, 'years').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'last5Years', label: 'Last 5 years', start: moment().subtract(5, 'years').startOf('day').toDate(), end: moment().endOf('day').toDate() },
  { key: 'last10Years', label: 'Last 10 years', start: moment().subtract(10, 'years').startOf('day').toDate(), end: moment().endOf('day').toDate() },
], 'key');

const rangePickerStyles = `
.Range .DayPicker-Day--selected:not(.DayPicker-Day--start):not(.DayPicker-Day--end):not(.DayPicker-Day--outside) { color: #4a90e2; background-color: #f0f8ff !important; }
.Range .DayPicker-Day { border-radius: 0 !important; }
`;

const dayPickerStyles = `
 .DayPicker-Month {width:290px; }
`;

const rangeDateFormat = 'DD-MMM-YYYY';
const preventBlur = (e) => e.preventDefault();

class YearMonthSelect extends PureComponent {
  static propTypes = {
    date: PropTypes.instanceOf(Date),
    fromYear: PropTypes.instanceOf(Date),
    toYear: PropTypes.instanceOf(Date),
    localeUtils: PropTypes.object,
    onChange: PropTypes.func.isRequired,
  }

  handleChange= (element, contraryElement, event, { value }) => {
    const { onChange } = this.props;
    let year; let month;
    if (element === 'month') {
      month = value;
      year = contraryElement;
    } else {
      year = value;
      month = contraryElement;
    }
    onChange(new Date(year, month));
  };

  render() {
    const { date, localeUtils, fromYear, toYear } = this.props;
    const months = localeUtils.getMonths('en');
    const selectedYear = new Date(date).getFullYear();
    const selectedMonth = date.getMonth();
    const years = _.range(toYear.getFullYear(), fromYear.getFullYear() - 1);
    const yearOptions = _.map(years, (year) => ({ key: year, value: year, text: year }));
    const monthOptions = _.map(months, (month, index) => ({ key: month, value: index, text: month }));
    return (
      <div className='DayPicker-Caption'>
        <Select compact value={selectedMonth} style={{ width: '130px' }} onChange={this.handleChange.bind(null, 'month', selectedYear)} options={monthOptions} />
        <Select compact value={selectedYear} onChange={this.handleChange.bind(null, 'year', selectedMonth)} options={yearOptions} />
      </div>
    );
  }
}


class TimePicker extends PureComponent {
  static propTypes = {
    value: PropTypes.instanceOf(Date),
    onChange: PropTypes.func,
    className: PropTypes.string,
    minTime: PropTypes.instanceOf(Date),
  }

  static defaultProps = {
    onChange: console.log,
    value: new Date(),
  }

  onTimeChange = (element, newTime) => {
    let { onChange, value, minTime } = this.props;
    const oldValue = moment(value);
    value = moment(value);
    value.set({ [element]: newTime });
    if (minTime && value.isBefore(minTime) && value.isBefore(oldValue)) {
      return;
    }
    onChange(value.toDate());
  };

  render() {
    let { className, value } = this.props;
    value = moment(value);

    return (
      <div className={cx('flex flex-column', className)} onMouseDown={preventBlur}>
        <div className='flex items-center self-center'>
          <Label size='big' color='grey' content={moment(value).format('HH')} />
          <span className='f3'> : </span>
          <Label size='big' color='grey' content={moment(value).format('mm')} />
        </div>
        <h4 className='mb0'>Hour:</h4>
        <Range value={value.get('hours')} onChange={this.onTimeChange.bind(null, 'hours')} min={0} max={23} className='w5' tooltip={false} />
        <h4 className='mv0'>Minutes:</h4>
        <Range value={value.get('minutes')} onChange={this.onTimeChange.bind(null, 'minutes')} step={5} min={0} max={55} className='w5' tooltip={false} />
      </div>
    );
  }

}
class DatePicker extends PureComponent {
  static propTypes = {
    value: PropTypes.instanceOf(Date),
    initialDate: PropTypes.instanceOf(Date),
    fromYear: PropTypes.number,
    toYear: PropTypes.number,
    onChange: PropTypes.func,
    format: PropTypes.string,
    disabled: PropTypes.bool,
    time: PropTypes.bool,
    allowClear: PropTypes.bool,
    selectYearMonth: PropTypes.bool,
    minDate: PropTypes.instanceOf(Date),
  }

  static defaultProps = {
    onChange: console.log,
    initialDate: new Date(),
    format: 'DD-MMM-YYYY HH:mm',
    allowClear: false,
    fromYear: moment().subtract(100, 'years').year(),
    toYear: moment().add(10, 'years').year(),
    selectYearMonth: true,
  }

  state = {
    open: false,
    mode: 'date',
  }

  openPicker = () => !this.props.disabled && this.setState({ open: true });
  closePicker = () => this.setState({ open: false, mode: 'date', currentYearMonth: undefined });
  setMode = (mode) => this.setState({ mode });

  onDaySelected = (day, { disabled } = {}) => {
    if (disabled) {
      return;
    }

    const value = this.props.time ? moment(this.props.value) : moment(this.props.value).startOf('day');
    const newValue = moment(day);

    newValue.set({
      hour: value.get('hour'),
      minute: value.get('minute'),
      second: value.get('second'),
    });

    this.props.onChange(newValue.toDate());
  }

  handleYearMonthChange = (currentYearMonth) => {
    this.setState({ currentYearMonth });
  }

  handleClear = (e) => {
    e.preventDefault();
    const { onChange } = this.props;
    onChange(undefined);
  }

  render() {
    const { open, mode, currentYearMonth } = this.state;

    const { value, format, onChange, time, disabled, initialDate, allowClear, selectYearMonth, fromYear, toYear, minDate } = this.props;
    const toDate = new Date(toYear, 11);
    const fromDate = new Date(fromYear, 0);
    const yearMonthSelectOptions = selectYearMonth ? {
      month: currentYearMonth,
      captionElement: ({ date, localeUtils }) => (
        <YearMonthSelect
          date={date}
          fromYear={fromDate}
          toYear={toDate}
          localeUtils={localeUtils}
          onChange={this.handleYearMonthChange} />
      ),
    } : {};
    const extraProps = _.pickBy(_.omit(this.props, _.keys(DatePicker.propTypes)), _.identity);

    return (
      <Popup
        trigger={(
          <div className='relative'>
            {!_.isUndefined(value) && !disabled && allowClear && <Icon link name='close' className='clear-icon' onMouseDown={this.handleClear} />}
            <Input disabled={disabled} readOnly icon='calendar outline' {...extraProps} value={value ? formatDate(value, format) : ''} placeholder='Select...' />
          </div>
        )}
        flowing
        position='bottom left'
        onOpen={this.openPicker}
        onClose={this.closePicker}
        open={open}
        on='click'
        basic>
        <div className='flex flex-column'>
          {time && (
            <Button.Group>
              <Button toggle content='Date' icon='calendar' active={mode === 'date'} onClick={this.setMode} bind='date' as={BoundAnchor} onMouseDown={preventBlur} />
              <Button toggle content='Hour' icon='clock' active={mode === 'time'} onClick={this.setMode} bind='time' as={BoundAnchor} onMouseDown={preventBlur} />
            </Button.Group>
          )}
          {mode === 'date' && (
            <>
              <Helmet><style>{dayPickerStyles}</style></Helmet>
              <DayPicker
                localeUtils={MomentLocaleUtils}
                locale={window.__ENVIRONMENT__.APP_LOCALE}
                numberOfMonths={1}
                initialMonth={value || initialDate}
                onDayClick={this.onDaySelected}
                selectedDays={value || initialDate}
                toMonth={toDate}
                fromMonth={fromDate}
                disabledDays={minDate ? [{ before: minDate }] : undefined}
                {...yearMonthSelectOptions}
                {...extraProps} />
            </>
          )}
          {mode === 'time' && (
            <TimePicker
              className='mt3'
              value={value || initialDate}
              onChange={onChange}
              minTime={minDate} />
          )}
        </div>
      </Popup>
    );
  }
}
class RangePicker extends PureComponent {

  static propTypes = {
    value: PropTypes.shape({ start: PropTypes.instanceOf(Date), end: PropTypes.instanceOf(Date) }),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
  }

  static defaultProps = {
    onChange: console.log,
    value: { ...dateRanges.thisMonth },
  }

  state = { open: false, ...this.props.value };

  componentDidUpdate(newProps) {
    const { value } = this.props;
    if (value !== newProps.value) {
      this.setState({ ...value });
    }
  }

  openPicker = () => !this.props.disabled && this.setState({ open: true });
  closePicker = () => {
    const { start, end } = this.props.value;
    this.setState({ open: false, start, end });
  }

  onDaySelected = (day) => {
    const { onChange } = this.props;
    let { start, end } = this.state;

    if ((start && end) || !start) {
      this.setState({ start: day, end: undefined, key: undefined });
    } else {
      end = day;

      if (moment(start).isAfter(end, 'day')) {
        [start, end] = [end, start];
      }

      start = moment(start).startOf('day').toDate();
      end = moment(end).endOf('day').toDate();

      this.setState({ start, end });
      onChange({ start, end });
      this.closePicker();
    }
  }

  onDayHovered = (endPreview) => {
    const { start } = this.state;
    if (start) {
      this.setState({ endPreview });
    }
  }

  setPreset = ({ key, start, end }) => {
    const { onChange } = this.props;
    this.setState({ key, start, end });
    onChange({ start, end });
    this.closePicker();
  }

  render() {
    const { value, disabled } = this.props;
    const { open, start, end, endPreview, key } = this.state;

    const modifiers = { start, end: (end || endPreview) };
    const selectedDays = [start, { from: start, to: (end || endPreview) }];
    const rangeText = `${formatDate(value.start, rangeDateFormat)} ~ ${formatDate(value.end, rangeDateFormat)}`;
    const extraProps = _.pickBy(_.omit(this.props, _.keys(RangePicker.propTypes)), _.identity);


    return (
      <Popup
        trigger={<Input disabled={disabled} readOnly icon='calendar outline' transparent value={rangeText} style={{ minWidth: (rangeText.length * 8) + 10 }} />}
        flowing
        hoverable
        position='bottom left'
        onOpen={this.openPicker}
        onClose={this.closePicker}
        open={open}
        on='click'
        basic
        offset='-10, 10'>
        <Helmet><style>{rangePickerStyles}</style></Helmet>
        <div>
          <DayPicker
            localeUtils={MomentLocaleUtils}
            locale={window.__ENVIRONMENT__.APP_LOCALE}
            className='Range'
            numberOfMonths={2}
            initialMonth={value.start}
            selectedDays={selectedDays}
            modifiers={modifiers}
            onDayClick={this.onDaySelected}
            onDayMouseEnter={this.onDayHovered}
            {...extraProps} />
          {_.map(_.chunk(_.values(dateRanges), 6), (elements, i) => (
            <div key={i} className='mb2'>
              {_.map(elements, (item) => (
                <Label
                  key={item.key}
                  as={BoundAnchor}
                  bind={item}
                  onMouseDown={preventBlur}
                  onClick={this.setPreset}
                  active={item.key === key}
                  content={item.label} />
              ))}
            </div>
          ))}
        </div>
      </Popup>
    );
  }
}


DatePicker.Time = TimePicker;
DatePicker.Range = RangePicker;
DatePicker.ranges = dateRanges;
DatePicker.rangeDateFormat = rangeDateFormat;
DatePicker.rangeSerializer = ({ start, end }) => ([formatDate(start, rangeDateFormat), formatDate(end, rangeDateFormat)]);
DatePicker.rangeDeserializer = createSelector(
  ([start]) => start,
  ([, end]) => end,
  (start, end) => ({ start: moment(start, rangeDateFormat).toDate(), end: moment(end, rangeDateFormat).endOf('day').toDate() })
);

export { DatePicker };
