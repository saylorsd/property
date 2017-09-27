/**
 * Created by sds25 on 9/15/17.
 */

import React, {Component} from 'react';
import {Map, TileLayer, GeoJSON} from 'react-leaflet';

/* Material UI Components 0*/
import Tooltip from 'material-ui/Tooltip';
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton';
import List, {ListItem, ListItemText} from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import Dialog, {DialogTitle, DialogContent} from 'material-ui/Dialog';
import Menu, {MenuItem} from 'material-ui/Menu';
import Input, {InputLabel} from 'material-ui/Input';
import Select from 'material-ui/Select';
import {FormControl, FormHelperText} from 'material-ui/Form';
import AppBar from 'material-ui/AppBar';
import Tabs, {Tab} from 'material-ui/Tabs';

/* Icons */
import Layers from 'material-ui-icons/Layers'
import FormatPaint from 'material-ui-icons/FormatPaint'
import {default as MapIcon} from 'material-ui-icons/Map'

/* Functions */
import {getCartoTiles, getParcel} from './mapUtils'
import {BASEMAPS, STYLE_DATASETS} from './mapDefaults'
import {mapDatasets} from "../containers/mapDefaults";

import MapStyleMenu from "./mapStyle"

/* Constants */
const mapDefaults = {
    position: [40.45, -79.9959],
    zoom: 16,
    maxZoom: 18
};


export class MapContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            styleLayer: null,
            selectedShape: null,
            baseMap: <TileLayer className="basemap"
                                url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
        };

        this.handleClick = this.handleClick.bind(this);
        this.updateBasemap = this.updateBasemap.bind(this);
        this.updateStyleLayer = this.updateStyleLayer.bind(this)
    }

    updateBasemap(i) {
        console.log(i)
        let basemap = BASEMAPS[i];
        this.setState({baseMap: null});
        this.setState({
            baseMap: <TileLayer className="new-basemap" url={basemap.url} attribute={basemap.attribution}/>
        });
        console.log(basemap);
        this.render();
    }


    /**
     * Runs when map is clicked.  It colors the selected parcel and then changes the parcelId for the entire map.
     * @param e
     */
    handleClick(e) {
        // Highlight the Parcel Polygon
        let sql = `SELECT pin, the_geom, the_geom_webmercator FROM allegheny_county_parcel_boundaries WHERE ST_Contains(the_geom, ST_SetSRID(ST_Point(${e.latlng.lng}, ${e.latlng.lat}), 4326))`
        this.setState({selectedShape: null});   // Hacky fix that tricks react into rerendering the layer.  Aparently changing the `selectedShape` isn't enough.
        this.setState({
            selectedShape: <CartoLayer sql={sql}
                                       css="#layer {line-color: #00F; polygon-fill: #00F; polygon-opacity: 0.4}"/>
        });

        // Lift parcelId state up
        getParcel(e.latlng)
            .then((parcelId) => {
                this.props.updateParcel(parcelId)
            });
    }

    /**
     * Request new Carto tile layer styled with `css`
     * @param {string} css - cartoCSS string used to style new layer
     */
    updateStyleLayer(css) {
        console.log("W000000000000000000000000000)TTTTTTTTTT");
        const sql = `SELECT * FROM allegheny_county_parcel_boundaries`;
        this.setState({styleLayer: <CartoLayer sql={sql} css={css}/>});
    }

    render() {
        const style = {
            base: {
                position: 'relative',
            },
            map: {
                height: '100%',
                cursor: 'pointer'
            }
        };
        return (
            <div style={style.base} className="mapContainer">
                <Map style={style.map}
                     center={mapDefaults.position}
                     zoom={mapDefaults.zoom}
                     maxZoom={mapDefaults.maxZoom}
                     onClick={this.handleClick}
                >
                    {this.state.baseMap}
                    {this.state.styleLayer}
                    {this.state.selectedShape}
                    <CartoLayer sql="SELECT * FROM allegheny_county_parcel_boundaries"
                                css={"#allegheny_county_parcel_boundaries{" +
                                "polygon-fill: #FFFFFF;" +
                                "polygon-opacity: 0.0;" +
                                "line-color: #4d4d4d;" +
                                "line-opacity: 0;" +
                                "[zoom >= 15] {line-opacity: .8; line-width: .5}" +
                                "[zoom >=17] {line-opacity: .8; line-width: 1}}"}/>
                </Map>
                <MapControls updateBasemap={this.updateBasemap} updateStyleLayer={this.updateStyleLayer}
                             basemaps={BASEMAPS}/>
            </div>
        );
    }
}


class MapControls extends Component {
    constructor(props) {
        super(props);
        this.state = {
            basemapMenuOpen: false
        };
    }


    render() {
        const style = {
            base: {
                position: 'absolute',
                top: '10px',
                right: '10px',
            },
            button: {
                margin: '0 4px',
                fontWeight: '600'
            }
        }


        return (
            <div style={style.base}>
                <BaseMapMenu updateBasemap={this.props.updateBasemap} basemaps={this.props.basemaps}/>
                <MapStyleMenu updateStyleLayer={this.props.updateStyleLayer}/>
            </div>
        );
    }
}


class BaseMapMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
            open: false
        };
        this.handleOpenClick = this.handleOpenClick.bind(this);
        this.handleBasemapSelect = this.handleBasemapSelect.bind(this);
    }

    handleOpenClick(event) {
        this.setState({open: true, anchorEl: event.currentTarget});
    };

    handleBasemapSelect(event) {
        this.props.updateBasemap(event.target.getAttribute('value'));
        this.setState({open: false});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    render() {
        const basemaps = this.props.basemaps;
        return (
            <div>
                <Button raised onClick={this.handleOpenClick}>
                    <MapIcon/> Basemmap
                </Button>
                <Menu open={this.state.open}
                      onRequestClose={this.handleClose}
                      anchorEl={this.state.anchorEl}
                >
                    {Object.keys(basemaps).map((k) => {
                            console.log('k', k, typeof(k));
                            return (
                                <MenuItem value={k}
                                          key={k}
                                          onClick={this.handleBasemapSelect}>
                                    {basemaps[k].name}
                                </MenuItem>
                            );
                        }
                    )}
                </Menu>
            </div>
        );
    }
}


/*******************************************************
 * CUSTOM MAP LAYERS
 *******************************************************/
class CartoLayer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sql: this.props.sql,
            css: this.props.css,
            tiles: ''
        };
        this.setTiles = this.setTiles.bind(this);
    }

    componentDidMount() {
        this.setTiles();
    }


    /**
     * Collects tiles from Carto and loads them into component
     */
    setTiles() {
        getCartoTiles(this.state.sql, this.state.css)
            .then((tileUrl) => {
                this.setState({tiles: tileUrl})
            }, (err) => {
                console.log(err);
            })
    }


    render() {
        const tiles = this.state.tiles;

        if (tiles === null)
            return null;

        return <TileLayer url={tiles}/>

    }
}
