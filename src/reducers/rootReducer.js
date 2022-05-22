import { combineReducers } from 'redux';
import room from './room';
import user from './user';
import notifications from './notifications';
import setting from './setting';
import peerVolumes from "./peerVolumes";

export default combineReducers({
    room,
    user,
    notifications,
    setting,
    peerVolumes
});
