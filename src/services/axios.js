import axios from 'axios';
import qs from 'querystring';
import { IS_IOS, IS_ANDROID,SECURE } from '../configs/index';
import APP from "../../app.json";
import utils from '../utils/utils'
import { store } from '../store';
import { notify } from "../actions/requestActions";
import { setUserLoginSts, setUserPhone, setUserName, setUserToken, setUserMeetingNo } from '../actions/userAction';
import NavigationService from '../navigator/NavigationService'
import * as settingsActions from '../actions/settingsActions'

import { Platform } from 'react-native';

let os = IS_IOS ? 'ios' : (IS_ANDROID ? 'android' : '')
let version = APP.version;

axios.defaults.timeout = 8000;
// axios拦截器
axios.interceptors.request.use(config => { //拦截器处理

    if (config.method === 'get') {
        config.params = {
            ...config.data,
            os: os,
            vendor:"joemeet",
            app_version: version,
            os_version: Platform.Version,
            _t: Date.parse(new Date()) / 1000,
        }
    }
    return config;
});

//
axios.interceptors.response.use(response => {
    if (response.data && response.data.code === 'E9999' && response.config.url.indexOf('meeting/user/query') > -1) {
        store.dispatch(notify({ text: "您的登录状态已失效，需要重新登录" }));
        const timer = setTimeout(() => {
            clearTimeout(timer);
            store.dispatch(setUserLoginSts(false));
            store.dispatch(setUserPhone(''));
            store.dispatch(setUserName(''));
            store.dispatch(setUserToken(''));
            store.dispatch(setUserMeetingNo(''));
            store.dispatch(settingsActions.setShowHomeFabGroup(false));
            NavigationService.navigate('Login')
        }, 1000);
        //NavigationService.navigate('Login');
        return response;
    } else {
        return response;
    }

},error => {
    console.error("axios.interceptors.response",error);
});

class http {
    /**
     * 
     * @param {String} uri 
     * @param {Object} params 
     * @param {String} signalingType
     * @returns 
     */
    static async get(uri, params, signalingType) {
        const defaultBaseUrl = utils.getRandomSignalingServerUrl("https",signalingType);
        if (defaultBaseUrl === "none") {
            console.error("缺失有效的"+signalingType+"信令服务器");
            return {};
        }
        if( signalingType !== "meeting" && 
            signalingType !== "remote_desktop" && 
            signalingType !== "live_boradcast" && 
            signalingType !== "joemeet_client" && 
            signalingType !== "whiteboard" ){

            console.error("不支持的信令类型：",signalingType);
            return {};
        }
        let res = null;
        const query = qs.stringify(params);
        const url = (!params || JSON.stringify(params) === '{}')?defaultBaseUrl+uri:defaultBaseUrl+uri+"?"+query;
        try {
            //console.info("请求接口：",url);
            res = await axios.get(url);
            //console.info("接口响应：",res.data);
            return res.data;
        } catch (error) {
            console.error("请求：", url, "出现异常", error);
            return {};
        }
    }

    /**
     * 
     * @param {String} fullURL 
     * @returns 
     */
     static async getWithFullURL(fullURL, params) {
        
        if(!fullURL || !fullURL.startsWith("https")){
            console.error("服务器地址错误，需要以https开头");
            return {};
        }
        let query = qs.stringify(params);
        let res = null;
        const url = (!params || JSON.stringify(params) === '{}')?fullURL:fullURL+"?"+query;
        try {
            res = await axios.get(url);
            return res.data;
        } catch (error) {
            console.error("请求：", url, "出现异常", error);
            return {};
        }
    }
    /**
     * 
     * @param {String} fullURL 
     * @returns 
     */
     static async getWithParams(url) {
        
        if(!url || !url.startsWith("https")){
            console.error("服务器地址错误，需要以https开头");
            return null;
        }
        let res = null;
        try {
            res = await axios.get(url);
            return res.data;
        } catch (error) {
            console.error("请求：", url, "出现异常", error);
            return {};
        }
    }
    /**
     * 
     * @param {String} uri 
     * @param {Object} params 
     * @param {String} signalingType
     * @returns 
     */
    static async post(uri, data = {}, signalingType = "meeting") {
        const protocol = SECURE?"https":"http";
        const defaultBaseUrl = utils.getRandomSignalingServerUrl(protocol,signalingType);
        if (defaultBaseUrl === "none") {
            console.error("缺失有效的"+signalingType+"信令服务器");
            return {};
        }
        if( signalingType !== "meeting" && 
            signalingType !== "remote_desktop" && 
            signalingType !== "live_boradcast" && 
            signalingType !== "joemeet_client" && 
            signalingType !== "whiteboard" ){

            console.error("不支持的信令类型",signalingType);
            return {};
        }
        let res = null;
        const url = defaultBaseUrl+uri;
        try {
            res = await axios.post(url,data);
            return res.data;
        } catch (error) {
            console.error("请求", url, "出现异常", error);
            return {};
        }
    }

     /**
     * 
     * @param {string} fullURL 
     * @returns 
     */
      static async postWithFullURL(fullURL, data) {
        
        if(!DEVELOPMENT && (!fullURL || !fullURL.startsWith("https"))){
            console.error("服务器地址错误，需要以https开头");
            return {success:false,message:"服务器地址错误，需要以https开头"};
        }
        try {
            const res = await axios.post(fullURL,data);
            return res.data;
        } catch (error) {
            console.error("请求", fullURL, "出现异常", error);
            return {success:false,message:error.message};
        }
    }

    /**
     * 
     * @param {string} fullURL 
     * @returns 
     */
     static async postWithFullURLAndText(fullURL, data) {
        
        if(!DEVELOPMENT && (!fullURL || !fullURL.startsWith("https"))){
            console.error("服务器地址错误，需要以https开头");
            return {success:false,message:"服务器地址错误，需要以https开头"};
        }
        try {
            const res = await axios.post(fullURL,qs.stringify(data));
            return res.data;
        } catch (error) {
            console.error("请求", fullURL, "出现异常", error);
            return {success:false,message:error.message};
        }
    }
}

export default http;

