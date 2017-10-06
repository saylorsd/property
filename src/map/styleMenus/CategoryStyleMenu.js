import React, {Component, PureComponent} from 'react';

/* Material UI Components*/
import Button from 'material-ui/Button'
import List, {ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction} from 'material-ui/List';
import Input, {InputLabel} from 'material-ui/Input';
import Select from 'material-ui/Select';
import Avatar from 'material-ui/Avatar';

import IconButton from 'material-ui/IconButton';
import AddCircleIcon from 'material-ui-icons/AddCircle';
import RemoveCircleIcon from 'material-ui-icons/RemoveCircle';
import LayersIcon from 'material-ui-icons/Layers';



/* Defaults & Helper Functions */
import {createCategoryCSS, createStyleSQL, COLORS} from '../mapUtils';
const DEFAULT_COLOR = 'red';


/**
 * Line that has a category-color pair for styling the map by category
 *
 * @param props
 * @return {XML} <ListItem> containing <Selects> for category and color
 * @constructor
 */
function CategorySelectionLine(props) {
    // TODO: fix default value
    const itemIdx = props.itemIdx;
    const item = props.menuItem;
    const categoryOptions = props.categoryOptions;
    const colorOptions = COLORS;  // TODO: decide whether this should be dynamic or just leave as a constant
    const handleChangeItem = props.handleChangeItem;
    return (
        <div>
            <Select native value={item.category}
                    onChange={handleChangeItem('category', itemIdx)}
                    input={<Input id={'category-value-' + {itemIdx}}/>}
            >
                {categoryOptions.map((opt, optionIdx) => (
                    <option key={optionIdx.toString()}
                            value={categoryOptions[optionIdx]}>{categoryOptions[optionIdx]}
                    </option>
                ))}
            </Select>
            <Select native value={item.color}
                    onChange={handleChangeItem('color', itemIdx)}
                    input={<Input id={'color-value-' + {itemIdx}}/>}
            >
                {colorOptions.map((opt, optionIdx) => (
                    <option key={optionIdx.toString()}
                            value={colorOptions[optionIdx]}>{colorOptions[optionIdx]}
                    </option>
                ))}
            </Select>
        </div>
    );
};


class CategoryStyleMenu extends Component {
    /**
     * Provides menu for defining style based on coloring parcels by category.
     * @param props
     */
    constructor(props) {
        super(props);

        this.state = {
            menuItems: [],         // List of menu items {'category': '', 'color': ''}
        };
    }

    /**
     * Updates the SQL and cartoCSS that define style on a Carto Map.
     * @private
     */
    _handleStyleInfoChange = () => {
        let sql = createStyleSQL(this.props.dataset, this.props.field);
        let css = createCategoryCSS(this.props.dataset, this.props.field, this.state.menuItems);
        this.props.handleStyleInfoChange(sql, css);
    };

    /**
     * Sets `menuItem` to default state. Currently this means setting that category to the first fieldValue and color
     * to the default color
     * @param {array} fieldValues - possible values for field being styled
     * @private
     */
    _initMenuItems = (fieldValues) => {
        this.setState(
            {menuItems: [{category: fieldValues[0], color: DEFAULT_COLOR}]},
            this._handleStyleInfoChange
        )
    };

    /**
     * Runs when 'add' button is clicked.  Adds a menu item to the menu item list.
     */
    handleAddMenuItem = () => {
        let newMenuItems = this.state.menuItems.concat([{category: this.props.fieldValues[0], color: DEFAULT_COLOR}]);

        this.setState({
            menuItems: newMenuItems
        })
    };

    /**
     * Runs when 'delete' button is clicked.  Removes menu item from list of menu items in state.
     * @param targetIdx
     */
    handleRemoveMenuItem = (targetIdx) => (e) => {
        this.setState({
            menuItems: this.state.menuItems.filter((menuItem, currentIdx) => targetIdx !== currentIdx)
        })
    };

    /**
     * Runs when an menu item is changed
     * @param {string} field - name of field which changed
     * @param {int} targetIdx - index of menu item in `this.state.menuItems` that was changed
     */
    handleChangeMenuItem = (field, targetIdx) => (event) => {
        // Update the list of menu items
        const newMenuItems = this.state.menuItems.map((menuItem, currentIdx) => {
            if (targetIdx !== currentIdx) {
                return menuItem;
            } else {
                return {...menuItem, [field]: event.target.value};
            }
        });
        this.setState(
            {menuItems: newMenuItems},

            // Generate new SQL and CSS from the current user selections and lift up to
            () => {
                this._handleStyleInfoChange();
            });
    };

    /**
     * When receiving new dataset and field props, reset the category dropdowns.
     * @param nextProps - new set of props that were given to component
     */
    componentWillReceiveProps = (nextProps) => {
        // First check to make sure that the dataset or field has changed
        // (apparently this could run even when we don't explicitly change props)
        // https://reactjs.org/docs/react-component.html#componentwillreceiveprops
        if (nextProps.dataset !== this.props.dataset ||
            nextProps.field !== this.props.field ||
            nextProps.fieldValues.length !== this.props.fieldValues.length ||
            !(nextProps.fieldValues.every((fieldValue, i) => {
                return fieldValue === this.props.fieldValues[i]
            }))
        ) {
            this._initMenuItems(nextProps.fieldValues)
        }
    };

    componentDidMount = () => {
        this._initMenuItems(this.props.fieldValues);
    };

    componentDidUpdate = (prevProps) => {
        if (prevProps.dataset !== this.props.dataset ||
            prevProps.field !== this.props.field ||
            prevProps.fieldValues.length !== this.props.fieldValues.length ||
            !(prevProps.fieldValues.every((fieldValue, i) => {
                return fieldValue === this.props.fieldValues[i]
            }))
        ) {
            this._handleStyleInfoChange();
        }
    };

    render() {
        return (
            <div>
                <List>
                    {this.state.menuItems.map((menuItem, idx) =>
                        <ListItem key={idx.toString()}>
                            <ListItemAvatar>
                                <Avatar><LayersIcon/></Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={
                                <CategorySelectionLine
                                    itemIdx={idx}
                                    menuItem={menuItem}
                                    categoryOptions={this.props.fieldValues}
                                    handleChangeItem={this.handleChangeMenuItem}
                                />
                            }/>
                            <ListItemSecondaryAction>
                                <IconButton onClick={this.handleRemoveMenuItem(idx)}>
                                    <RemoveCircleIcon/>
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    <ListItem onClick={this.handleAddMenuItem}>
                        <Button>
                            <ListItemAvatar>
                                <Avatar>
                                    <AddCircleIcon/>
                                </Avatar>

                            </ListItemAvatar>
                            <ListItemText primary={'Add Another Category'}/>
                        </Button>

                    </ListItem>
                </List>
            </div>
        );
    }
}

export default CategoryStyleMenu;