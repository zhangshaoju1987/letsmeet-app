import moment from "moment";
import store from "../store";

const { default: axios } = require("axios");

/**
 * 链路注册中心客户端
 * 1. 维护客户端和服务器之间的接入关系
 */
class LinkRegistCenterClient{

    constructor(props){
        this.linkRegistCenterUrl = "https://service.joemeet.com:12321/link_regist_center/api";
        this.registUrl = this.linkRegistCenterUrl+"/regist";
        this.queryUrl  = this.linkRegistCenterUrl+"/query";
        this.liveUrl  = this.linkRegistCenterUrl+"/live";
        this.deadUrl  = this.linkRegistCenterUrl+"/dead";


    }
    /**
     * 注册自己的链路信息到注册中心
     * @param {Object} param0 
     * @returns 
     */
    async regist({clientId,clientType,serverUrl}){
        if(!clientId || !clientType || !serverUrl){
            throw new Error("缺失服务参数，regist");
        }
        try{
            const {data} = await axios.post(this.registUrl,{clientId,clientType,serverUrl});
            return data;
        }catch(err){
            console.error("regist",err);
        }
    }

    /**
     * 报告存活状态
     * @param {Object} param0 
     * @returns 
     */
     async live({clientId,clientType}){
        if(!clientId || !clientType){
            throw new Error("缺失服务参数，live");
        }
        try{
            console.log("报告存活状态:",moment().format("YYYY-MM-DD HH:mm:ss"));
            const {data} = await axios.post(this.liveUrl,{clientId,clientType});
            return data;
        }catch(err){
            console.error("live",err);
        }
    }

    /**
     * 报告失活状态（一般用不上，大部分情况通过时间差判断是否存活）
     * @param {Object} param0 
     * @returns 
     */
     async dead({clientId,clientType}){
        if(!clientId || !clientType){
            throw new Error("缺失服务参数，dead");
        }
        try{
            console.log("报告存活状态0");
            const {data} = await axios.post(this.deadUrl,{clientId,clientType});
            return data;
        }catch(err){
            console.error("注册中心，dead",err);
        }
       
    }

    /**
     * 查询别人的链路信息
     * @param {Object} param0 
     * @returns 
     */
    async query({clientId,clientType}){
        try{
            const {data} = await axios.post(this.queryUrl,{clientId,clientType});
            return data;
        }catch(err){
            console.error("注册中心，query",err);
        }
       
    }

    /**
     * TODO 订阅其他客户端（联系人）的状态（用于批量检查，提供更加定制化的服务）
     * @param {String} param0
     * @returns 
     */
    async subscribe(clientId){
        // 存放到store
        
    }
    async unsubscribe(clientId){
        // 从store移除
        
    }
}

export {
    LinkRegistCenterClient
}