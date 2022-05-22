import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

 
export default class SignalingSocket {


    /**
     * 获取入会信令服务器完整地址
     * @param {*} param0 
     * @returns 
     */
    static getSignalingUrl({meetingSignalingServer,roomId,peerId,roomName}){

        if (!meetingSignalingServer) {
           throw new Error("缺失信令服务器");
        }
        const commonParams = `os=${Platform.OS}&app_version=${DeviceInfo.getVersion()}&os_version=${Platform.Version}`;
        const _socketurl = `${meetingSignalingServer}?peerId=${peerId}&roomId=${roomId}&roomName=${roomName}&${commonParams}`;
        console.log("使用信令服务器:" ,meetingSignalingServer);
        return _socketurl;
    }
 }
 export {
    SignalingSocket
 }