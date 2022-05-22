/**
 * 
 */

import { Platform } from 'react-native';


export const IS_IOS = Object.is(Platform.OS, 'ios');
export const IS_ANDROID = !IS_IOS;

export const WEB_URL = '';
export const SATATIC_URL = '';

export const signaling_servers = [

     // 测试环境
     {id:1     ,hostname:"meeting.zhangshaoju.me"   ,port:10001,type:"meeting",env:"test",status:"online"},
     {id:2     ,hostname:"meeting.zhangshaoju.me"   ,port:10002,type:"whiteboard",env:"test",status:"online"},
     {id:3     ,hostname:"meeting.zhangshaoju.me"   ,port:10003,type:"live_boradcast",env:"test",status:"online"},
     {id:4     ,hostname:"meeting.zhangshaoju.me"   ,port:10004,type:"remote_desktop",env:"test",status:"online"},
     {id:5     ,hostname:"meeting.zhangshaoju.me"   ,port:10005,type:"joemeet_client",env:"test",status:"online"},


    // 生产环境
    // 竹米客户端
    {id:1000001,hostname:"signaling1001.joemeet.com",port:50050,type:"joemeet_client",env:"product",status:"offline"},
    {id:1000002,hostname:"signaling1002.joemeet.com",port:50050,type:"joemeet_client",env:"product",status:"online"},

    // 白板信令服务器
    {id:1100001,hostname:"signaling1001.joemeet.com",port:50060,type:"whiteboard",env:"product",status:"offline"},
    {id:1100002,hostname:"signaling1002.joemeet.com",port:50060,type:"whiteboard",env:"product",status:"online"},
    
    // 直播信令服务器
    {id:1200001,hostname:"signaling1001.joemeet.com",port:50070,type:"live_boradcast",env:"product",status:"offline"},
    {id:1200002,hostname:"signaling1002.joemeet.com",port:50070,type:"live_boradcast",env:"product",status:"online"},
    
    // 会议信令服务器列表
    {id:1300001,hostname:"signaling1001.joemeet.com",port:50080,type:"meeting",env:"product",status:"offline"},
    {id:1300002,hostname:"signaling1002.joemeet.com",port:50080,type:"meeting",env:"product",status:"online"},

    // 远程桌面信令服务器列表
    {id:1400001,hostname:"signaling1001.joemeet.com",port:50090,type:"remote_desktop",env:"product",status:"offline"},
    {id:1400002,hostname:"signaling1002.joemeet.com",port:50090,type:"remote_desktop",env:"product",status:"online"},
]
export const VIEWPADDING = 20;
export const TIME = 60;
export const HEADERHEIGHT = 50;

export const SECURE = true;
export const DEVELOPMENT = false; // true 为开发环境。注意，切换环境，一定要将app先卸载了。ios,android都删除

