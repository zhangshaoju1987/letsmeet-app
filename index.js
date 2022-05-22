import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
//import App from './src/test/App';
import App from './src/app';
import {name as appName} from './app.json';
//import debug from 'debug';
//debug.enable("*");
AppRegistry.registerComponent(appName, () => App);
