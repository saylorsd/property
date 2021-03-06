import React from 'react'
import PropTypes from 'prop-types'

import {ListItem, ListItemAvatar, ListItemText} from 'material-ui/List';
import Avatar from 'material-ui/Avatar';


import AddIcon from 'material-ui-icons/Add'
import {green} from 'material-ui/colors'

const style = {
  backgroundColor: green[600]
};

const AddLayerListItem = props => {
  const {onClick} = props;

  return (
    <ListItem button onClick={onClick}>
      <ListItemAvatar>
        <Avatar style={style}>
          <AddIcon/>
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={"New Style Layer"}/>
    </ListItem>
  );
};

AddLayerListItem.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default AddLayerListItem
