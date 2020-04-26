import _ from 'lodash';
import React, { Fragment } from 'react';
import { parseToPredicate } from 'search-parser';
import XLSX from 'xlsx';
import moment from 'moment';
import downscale from 'downscale';
import fileDialog from 'file-dialog';
import { nanoid } from 'nanoid';
import crypto from 'crypto';


const makeFilterable = (propName, columns) => (item) => {
  item[propName] = item[propName]
    ? item[propName]
    : _.transform(columns, (result, { value }, idx) => {
      result[idx] = normalizeStr(value({ rowData: item }));
    }, {});
  return item;
};
const filterWithProp = (propName) => (item, textToSearch, keyword) => {
  if (keyword === 'freetext') {
    return _(item[propName]).values().some((value) => _.includes(value, textToSearch));
  }
  return _.includes(item[propName][keyword], textToSearch);
};
const currencyFormatter = new Intl.NumberFormat(window.__ENVIRONMENT__.APP_LOCALE, { style: 'currency', currency: window.__ENVIRONMENT__.APP_CURRENCY, minimumFractionDigits: 2 });

export const generateUniqueId = (length = 10) => nanoid(length);
export const normalizeStr = _.flow(_.trim, _.toLower, _.deburr);
export const flattenReactChildren = (children) => _.flatten(React.Children.map(children, (child) => _.get(child, 'type') === Fragment ? flattenReactChildren(child.props.children) : child));
export const formatCurrency = currencyFormatter.format;
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
export const formatDate = (date, format = 'DD-MMM-YYYY HH:mm') => moment(date).format(format);
export const getValue = (value, mapping = {}, defaultValue) => _.get(mapping, [value], defaultValue);
export const selectFiles = (...args) => fileDialog(...args);
export const equalBy = (fst, snd, ...properties) => _.every(properties, (prop) => _.isEqual(_.get(fst, prop), _.get(snd, prop)));
export const joinAndSeparatorJSX = (elements, separator = ', ', lastSeparator = ' and ') => _(elements).compact().transform((acc, cur, i, arr) => {
  if (i > 0) {
    acc.push(<Fragment key={`${i}.`}>{i < arr.length - 1 ? separator : lastSeparator}</Fragment>);
  }
  acc.push(<Fragment key={i}>{cur}</Fragment>);
}, []).value();
export const joinAndSeparator = (elements, separator = ', ', lastSeparator = ' and ') => _.join(_(elements).compact().transform((acc, cur, i, arr) => {
  if (i > 0) {
    acc.push(i < arr.length - 1 ? separator : lastSeparator);
  }
  acc.push(cur);
}, []).value(), '');

export const getMD5Base64Hash = (input) => {
  const algorithm = crypto.createHash('md5');
  algorithm.update(input);
  return algorithm.digest('base64');
};
export const toReadable = (file, readerFn = 'readAsDataURL') => new Promise((res, rej) => {
  const reader = new FileReader();
  reader[readerFn](file);
  reader.onload = () => res(reader.result);
  reader.onerror = (err) => rej(err);
});
export const loadImageBase64FromFile = (file) => new Promise((res) => {
  const newImg = new Image();
  newImg.onload = () => res(newImg);
  toReadable(file).then((base64) => (newImg.src = base64));
});
export const selectImages = async ({ multiple = true } = {}) => {
  const files = await selectFiles({ accept: 'image/*', multiple });

  return Promise.all(_.map(files, async (file) => {
    const [, imageType] = _.split(file.type, '/');
    const image = await loadImageBase64FromFile(file);

    let newWidth = image.width;
    let newHeight = image.height;

    if (newWidth > 1920) {
      newHeight = newHeight * 1920 / newWidth;
      newWidth = 1920;
    }
    if (newHeight > 1080) {
      newWidth = newWidth * 1080 / newHeight;
      newHeight = 1080;
    }

    const base64 = image.width !== newWidth || image.height !== newHeight
      ? await downscale(image, newWidth, newHeight, { imageType })
      : image.src;

    file.base64 = base64;
    return file;
  }));
};
export const downloadBlob = (blob, fileName) => {
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, fileName);
  } else {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = fileName;
    elem.click();
    window.URL.revokeObjectURL(elem.href);
  }
};
export const debounceCall = (method, delay = 250) => {
  let timeout = null;
  let items = [];
  return (arg1) => {
    items.push(arg1);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      method(items); items = [];
    }, delay);
  };
};
export const filterObjects = (source, columns, { search, sortDir, sortBy, preserveCache = true }) => {
  search = _.replace(normalizeStr(search), /[()]/g, '');

  const sortByName = _.get(columns[sortBy], 'valueRaw');
  const metaProp = '__filterInfo';
  const searchFn = filterWithProp(metaProp);
  const createMetadata = makeFilterable(metaProp, columns);

  let results = _(source).map(createMetadata);

  if (search) {
    results = results.filter(parseToPredicate(search, searchFn));
  }

  if (sortByName || sortDir) {
    results = results.orderBy((item) => _.get(item, sortByName, _.get(item[metaProp], sortBy)), sortDir);
  }

  results = results.value();

  if (!preserveCache) {
    _.each(source, (item) => (delete item[metaProp], item));
  }

  return results;
};
export const toDataArray = (entries, columns, formattedColumns) => {

  const formatRow = (rowData) => _.map(columns, ({ value, valueRaw }) => {
    const getFinalValue = () => _.hasIn(rowData, valueRaw)
      ? _.get(rowData, valueRaw)
      : value({ rowData });

    if (_.get(formattedColumns, valueRaw, false) === false) {
      return getFinalValue();
    }
    const formatter = formattedColumns[valueRaw];
    return _.isFunction(formatter)
      ? formatter(getFinalValue())
      : value({ rowData });
  });

  return [
    _.map(columns, 'label'),
    ...(_.map(entries, formatRow)),
  ];
};
export const arrayToXLSXBlob = (dataArray, sheetName) => {
  const worksheet = XLSX.utils.aoa_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const blobData = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true, bookSST: true, cellDates: true });
  return new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const objectToJSONBlob = (object) => new Blob([JSON.stringify(object, null, 2)], { type: 'application/json' });
