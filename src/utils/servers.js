import * as settingsActions from '../actions/settingsActions'
import { notify } from '../actions/requestActions';
import http from '../services/axios'
import { store } from '../store';
import utils from './utils'
/**
 * 更新本地信令服务器列表
 */
async function updateLocalSignalingServers() {
    
    const { myServer } = store.getState().setting;
    const currentTime = utils.getCurrentTime();
    const expiredTime = 24 * 60 * 60 * 1000;
    // 控制24小时内不需要更新
    if (!myServer.time || (currentTime - myServer.time) >= expiredTime) {
        
        // 获取本地可用的信令服务器列表
        const SERVER_RECORDS = utils.getSignalingServerListFromLocal("meeting");
        utils.shuffleArray(SERVER_RECORDS) // 打乱顺序，可以让负载更加均衡。

        // 基于可用的信令服务器列表循环进行获取，直到获取成功（99%的情况下第一次就应该成功）
        let success = false;
        let res;
        for (let i = 0; i < SERVER_RECORDS.length; i++) {

            try {
                const server = SERVER_RECORDS[i];
                const baseURL = `https://${server.hostname}:${server.port}`;
                const fullURL = `${baseURL}/signalings/available`;
                res = await http.getWithFullURL(fullURL, {});
                console.log("准备使用：", baseURL, "更新本地服务器列表",res);
                if (res.success && res.result.list?.length > 0) {  //确保请求成功且拿到了有效数据再更新列表
                    success = true;
                    store.dispatch(settingsActions.setMyServerTime());
                    store.dispatch(settingsActions.setMyServerList(res.list));
                    console.log("更新成功",res.result.list);
                    break; // 一旦成功就跳出循环
                }
            } catch (error) {
                console.log("错误",res);
                console.error("第[" + i + "/"+SERVER_RECORDS.length+"]个获取服务器列表出现错误：" , error);
                continue;
            }
        }
        if (!success) {
            store.dispatch(notify({ type: "error", text: "获取服务器地址失败" }));
        }
    }else{
        //console.log("服务器列表最新，无需更新");
    }
}

export default { 
    updateLocalSignalingServers,
}