/**
 * Created by sds25 on 9/20/17.
 */
import React from 'react';
import cartodb from 'cartodb'

import CartoMapLayer from '../components/map/CartoMapLayer'

import {dataSource, LayerTypes, PARCEL} from "./mapDefaults";


const cartoSQL = cartodb.SQL({user: 'wprdc'});

// Available quantification methods used by Carto for choropleth maps
export const QUANTIFICATION_METHODS = {
  quantiles: {title: 'Quantiles'},
  jenks: {title: 'Jenks'},
  equal: {title: 'Equal Intervals'},
  headtails: {title: 'Head/Tails'}
};


export const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'teal', 'black', 'white', 'gray'];

// Available Choropleth color groups
export const CHOROPLETHS = {
  "orange": {
    "3": ["#fee8c8", "#fdbb84", "#e34a33"],
    "4": ["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"],
    "5": ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"],
    "6": ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"],
    "7": ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"]
  },
  "blue": {
    "3": ["#deebf7", "#9ecae1", "#3182bd"],
    "4": ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"],
    "5": ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
    "6": ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
    "7": ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"]
  },
  "black": {
    "3": ["#f0f0f0", "#bdbdbd", "#636363"],
    "4": ["#f7f7f7", "#cccccc", "#969696", "#525252"],
    "5": ["#f7f7f7", "#cccccc", "#969696", "#636363", "#252525"],
    "6": ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#636363", "#252525"],
    "7": ["#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525"]
  },
  "yellow-blue": {
    "3": ["#edf8b1", "#7fcdbb", "#2c7fb8"],
    "4": ["#ffffcc", "#a1dab4", "#41b6c4", "#225ea8"],
    "5": ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"],
    "6": ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494"],
    "7": ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"]
  }
};


export const makeChoropleth = (color, bins, reverse) => {
  const colors = CHOROPLETHS[color][bins]
  if (reverse) {
    return colors.reverse()
  } else {
    return colors
  }
}

/**
 * Gets carto tiles based on a sql query and cartoCSS to define style.
 *
 * @param {string} sql - SQL query that defines what data to show on map.
 * @param {string} css - cartoCSS that defines how to style the map data
 * @return {Promise} - resolves a tile service url, rejects and error message
 */
export function getCartoTiles(sql, css) {
  let url = 'https://wprdc.carto.com/api/v1/map/';

  if (typeof(sql) === 'undefined') {
    throw new TypeError('missing SQL')
  }

  if (typeof(css) === 'undefined') {
    css = '#layer { polygon-fill: #FFF; polygon-opacity: 0.2; line-color: #000; line-opacity: 1;}'
  }

  let mapconfig = {
    "version": "1.3.1",
    "layers": [{
      "type": "cartodb",
      "options": {
        "cartocss_version": "2.1.1",
        "cartocss": css,
        "sql": sql
      }
    }]
  };

  let headers = new Headers();
  headers.append("Content-Type", "application/json");


  let options = {
    mode: 'cors',
    method: 'POST',
    body: JSON.stringify(mapconfig),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    },
    dataType: 'json'
  }

  return new Promise((resolve, reject) => {

    fetch(url, options).then((response) => {
      if (response.ok) {
        response.json()
          .then((data) => {
            resolve('https://wprdc.carto.com/api/v1/map/' + data.layergroupid + '/{z}/{x}/{y}.png');
          }, (err) => {
            reject(err);
          })
      }
      else {
        reject(response.status)
      }
    });
  });
}


/**
 * Finds parcel at latlng.
 * This currently uses Carto's SQL API to find what parcel contains the point that was clicked.
 * TODO: decouple from carto, and allow different functions to be used in it's place depending developer's stack.
 *
 * @param {object} latlng - object containing `lat` and `lng` properties representing latitude and longitude.
 *                          The point should use the WGS84 projection (SRID: 4326)
 * @return {Promise} - resolves with parcel id string, rejects with error message
 */
export function getParcelFromPoint(latlng) {
  let url = 'https://wprdc.carto.com/api/v2/sql?q=';
  let sql = `SELECT pin FROM allegheny_county_parcel_boundaries WHERE ST_Contains(the_geom, ST_SetSRID(ST_Point(${latlng.lng}, ${latlng.lat}), 4326))`;

  return new Promise((resolve, reject) => {
    fetch(url + sql).then((response) => {
      if (response.ok) {
        response.json()
          .then((data) => {
            // Check that a parcel was found.
            if (data.rows.length)
              resolve(data.rows[0].pin);  // pin is short for Parcel ID Number
            else
              reject("Query successful, but no parcel found.")
          }, (err) => {
            reject(err)
          })
      }
      else {
        reject(response.status)
      }
    })
  })
}

/**
 * Collect listing of possible values for `field` in Carto `dataset`
 *
 * @param dataset
 * @param field
 * @return {Promise} - resolves list of possible values, rejects an error message
 */
export function getFieldValues(dataset, field) {
  const {parcelIdField, cartoConnection} = dataset;
  const {account, table, mapId, cartoCssId} = cartoConnection;

  let url = `https://wprdc.carto.com/api/v2/sql/?q=SELECT DISTINCT(${field.id}) FROM "${account}"."${table}"`;
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        response.json()
          .then((data) => {
            if (data.hasOwnProperty('rows')) {
              resolve(data.rows.sort((a, b) => {
                const nameA = a[field.id];
                const nameB = b[field.id];
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                return 0;
              }).map((row) => row[field.id]));
            } else {
              reject('"row" not in results')
            }
          }, (err) => reject(err))
      }, (err) => reject(err))
  })
}

/**
 * Generates SQL string for querying Carto for a styled.  Provides the minimum information needed to style a layer.
 *
 * @return {string}
 */
export function createStyleSQL(dataset, field) {
  const {parcelIdField, cartoConnection} = dataset;
  const {account, table, mapId, cartoCssId} = cartoConnection;

  return `SELECT ds.cartodb_id, pb.the_geom, pb.the_geom_webmercator, ds.${field.id}, ds.${parcelIdField}
        FROM wprdc.allegheny_county_parcel_boundaries pb JOIN "${account}"."${table}" ds ON pb.pin = ds.${parcelIdField}`;
}

/**
 * Generate cartoCSS that styles parcels if they fall into a category.
 *
 * @param {object} dataset - dataset in carto on which style is based
 * @param {object} field - field in `dataset` on which style is based
 * @param {array} categoryColors - array of {category: '', color: ''} objects that define how to style layer
 * @return {string} - cartoCSS string that defines the style
 */
export function createCategoryCSS(dataset, field, categoryColors, mode) {
  const {cartoConnection} = dataset;
  const {cartoCssId} = cartoConnection;

  let opacityTarget = 'polygon-opacity';
  let fillTarget = 'polygon-fill';
  let lineWidth = '0';
  if (mode === 'line') {
    opacityTarget = 'line-opacity';
    fillTarget = 'line-color'
    lineWidth = '10';
  }


  // Base css for category styling
  let css = `#${cartoCssId}{
                polygon-opacity: 0.0;  
                line-color: #000;  line-opacity: 0;
                line-width: ${lineWidth};
                `;

  // Add conditional css for each category-color combo entered
  categoryColors.map((item) => {
    css += `[ ${field.id} = "${item.category}" ]{ ${opacityTarget}: 1.0; ${fillTarget}: ${item.color};}`;
  });
  css += '}';
  return css
}

/**
 * Generate cartoCSS that styles parcels using a ramp of colors
 *
 * @param {object{ dataset - dataset in carto on which style is based
 * @param {object} field - field in `dataset` on which style is based
 * @param {int} binCount - number of bins into which values will be separated
 * @param {string} color - name of color pattern
 * @param {string} quantMethod - quantification method (e.g. jenks, quantile)
 * @return {string} - cartoCSS string that defines the style
 */
export function createChoroplethCSS(dataset, field, binCount, color, quantMethod) {
  const {cartoConnection} = dataset;
  const {cartoCssId} = cartoConnection;

  // Allow for default quantification method, though may never be used.
  if (typeof(quantMethod) === 'undefined') {
    quantMethod = 'quantiles'
  } else if (!QUANTIFICATION_METHODS.hasOwnProperty(quantMethod)) {
    // If not found, throw an error - better than just not seeing the map change.
    throw TypeError('quantification method must be one of the following: ' + QUANTIFICATION_METHODS.join(', '))
  }

  // Pull an array of color values
  let colors = CHOROPLETHS[color][binCount.toString()];

  return `#${cartoCssId}{
                polygon-opacity: 1.0;  line-color: #000;  line-width: .5; [zoom < 15]{line-width: 0;}   line-opacity: 1;
                polygon-fill: ramp([${field.id}], (${colors.join(',')}), ${quantMethod}(${binCount}))
                }`
}

/**
 * Generate cartoCSS that styles parcels by only coloring those whose values for `field` fall within a range
 *
 * @param {object} dataset - dataset in carto on which style is based
 * @param {object} field - field in `dataset` on which style is based
 * @param {float} min - minimum value of range to be colored
 * @param {float} max - maximum value of range to be colored
 * @param {string} color - to apply parcels in range
 * @return {string}
 */
export function createRangeCSS(dataset, field, min, max, color, mode) {
  const {cartoConnection} = dataset;
  const {cartoCssId} = cartoConnection;

  let targetType = 'polygon';
  let colorLine = `polygon-fill: ${color}; line-color: #000;`;
  let lineWidth = 0;
  if (mode === 'line') {
    targetType = 'line';
    colorLine = `line-color: ${color}; polygon-fill: #000;`
    lineWidth = 3;
  }


  return `#${cartoCssId}{  
        ${colorLine}
        polygon-opacity: 0.0;  line-color: #000; line-width: ${lineWidth};   [zoom < 15]{line-width: 0;}   
        line-opacity: 1;
    }
     
    #${cartoCssId}[ ${field.id} <= ${max}] { ${targetType}-opacity: 1;} 
    
    #${cartoCssId}[ ${field.id} < ${min}] { ${targetType}-opacity: 0;}
      
    #${cartoCssId}[ ${field.id} > ${max}] { ${targetType}-opacity: 0;}`
}

/**
 * Finds minimum and maximum values in carto table
 * @param dataset
 * @param field
 * @return {Promise}
 */
export const findMinMaxValues = (dataset, field) => {
  console.log(dataset);
  const {parcelIdField, cartoConnection} = dataset;
  const {account, table, mapId, cartoCssId} = cartoConnection;

  const url = 'https://wprdc.carto.com/api/v2/sql?q=';
  const sql = `SELECT MIN(${field.id}) as min, MAX(${field.id}) as max FROM "${account}"."${table}"`;

  return new Promise((resolve, reject) => {
    fetch(url + sql).then((response) => {
      if (response.ok) {
        response.json()
          .then((data) => {
            // Check that a parcel was found.
            if (data.rows.length)
              resolve(data.rows[0]);  // pin is short for Parcel ID Number
            else
              reject("Query successful, but no min/max found.")
          }, (err) => {
            reject(err)
          })
      }
      else {
        reject(response.status)
      }
    })
  })
}

/**
 * Shape layer factory.
 * @param id
 * @param shapeClass
 */
export const singleShapeLayer = (id, shapeClass = PARCEL) => {
  const {idField, tableId} = shapeClass;

  const sql =
    `SELECT "${idField}", the_geom, the_geom_webmercator 
         FROM ${tableId} 
         WHERE "${idField}" = '${id}'`;

  const css =
    `#layer {
            line-color: #0e66f7; 
            [zoom < 16] {
                line-width: 2;
            }
            [zoom >= 16 ] {
                line-width: 4;
            }
            polygon-fill: #0e66f7; 
            polygon-opacity: 0.4
        }`;

  return {sql, css}

};

export const getDataset = (datasetId) => {
  return dataSource.getDataset(datasetId);
}

export const getField = (datasetId, fieldId) => {
  return dataSource.getField(datasetId, fieldId);
}


export const getAvailableDatasets = (styleMode) => {
  let availableDatasets = dataSource.getDatasets();

  // Filter out datasets that have no fields that accommodate the style type
  switch (styleMode) {
    case 'category':
      availableDatasets = availableDatasets.filter((dataset) =>
        dataSource.accommodatesType(dataset.id, 'category'));
      break;
    case 'choropleth':
    case 'range':
      availableDatasets = availableDatasets.filter((dataset) =>
        dataSource.accommodatesType(dataset.id, 'numeric'));
      break;
  }
  return availableDatasets.sort();
};

export const getAvailableFields = (styleMode, dataset) => {
  let fields = [];

  // Filter fields based on style method
  switch (styleMode) {
    case 'category':
      fields = dataset.fields.filter((field) => field.type === 'category');
      break;
    case 'choropleth':
    case 'range':
      fields = dataset.fields.filter((field) => field.type === 'numeric');
      break;
    default:
      fields = dataset.fields;
  }

  return fields.sort();
};


export const getAvailableValues = (dataset, field) => {
  getFieldValues(dataset, field)
    .then((newOptions) => {
        console.log(newOptions)
        newOptions.sort();
        console.log(newOptions);
        this.setState({fieldValues: newOptions})
      },
      (err) => {
        console.log(err)
      })
};

export const generateLegendInfo = (geoType, layerType, layerState) => {
  let colorMapping = null,
    styleType = null;

  if (layerType === LayerTypes.CUSTOM) {
    const submenu = layerState.submenuStates[layerState.styleMode];
    styleType = layerState.styleMode;
    switch (layerState.styleMode) {
      case 'category':
        colorMapping = submenu.menuItems.map(item => ({
          value: item.category,
          color: item.color
        }));
        break;
      case 'range':
        colorMapping = {
          range: submenu.values,
          color: submenu.color
        };
        break;
      case 'choropleth':
        colorMapping = {
          colors: CHOROPLETHS[submenu.colorName],
          min: Math.min(...layerState.fieldValues),
          max: Math.max(...layerState.fieldValues)
        }
        break;
    }
  }
  return {
    geoType,
    styleType,
    colorMapping
  }
}