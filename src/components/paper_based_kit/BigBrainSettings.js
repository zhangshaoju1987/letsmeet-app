import * as React from 'react';
import MaterialCommunityIcon from './BigBrainMaterialCommunityIcon';


export const { Provider, Consumer } = React.createContext({
  icon: MaterialCommunityIcon,
});