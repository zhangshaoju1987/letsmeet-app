import {
	createStore,
	applyMiddleware,
	compose
} from 'redux';
import thunk from 'redux-thunk';

import { persistReducer, persistStore } from 'redux-persist';

import rootReducer from './reducers/rootReducer';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {createLogger} from 'redux-logger';


const persistConfig =
{
	key: 'root',
	storage: AsyncStorage,

};

const loggerMiddleware = createLogger();

const persistedReducer = persistReducer(persistConfig, rootReducer);

const enhancers = compose(
	//applyMiddleware(thunk, loggerMiddleware),
	applyMiddleware(thunk),
);
const store = createStore(persistedReducer, enhancers);
const persistor = persistStore(store);
console.log("store加载了一次");
export default () => {
	//console.log("返回全局唯一的store");
	return { store, persistor };
}
export { store, persistor }








