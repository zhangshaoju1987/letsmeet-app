const encode = require('hashcode').hashCode;
import { store } from '../store';
import { notify } from "../actions/requestActions";
import moment from "moment";
import { DEVELOPMENT, signaling_servers, manager_servers } from '../configs/index.js'

/**
 * 从字符串中提取会议号码
 * @param {string} str 
 * @returns 
 */
function extractMeetingNo(str) {

    if (!str) {
        return null;
    }
    // yxx-xxxx-xxxx  y为1或者6 x为数字
    var reg = /[1,6,7]\d{2}-\d{4}-\d{4}/g;

    const strs = str.match(reg);

    return strs && strs.length > 0 ? strs[0] : null;
}
/**
 * 获取随机颜色【深色】
 */
function randomColor() {
    var color = '';
    for (let i = 0; i < 6; i++) {
        color += '0123401234abcabc'[Math.floor(Math.random() * 16)];
    }
    return "#" + color;
}

/**
 * 将对象转换成数组
 * @param {Object} obj 
 */
function object2Array(obj) {
    const arr = [];
    if (!obj) {
        return arr;
    }
    for (var x in obj) {
        arr.push(obj[x]);
    }
    return arr;
}
/**
 * 计算两个时间的差值
 * @param {*} startTime 
 * @param {*} endTime 
 * @param {*} diffType 
 */
function getDateDiff(startTime, endTime, diffType) {
    //将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式 
    startTime = startTime.replace(/\-/g, "/");
    endTime = endTime.replace(/\-/g, "/");
    //将计算间隔类性字符转换为小写
    diffType = diffType.toLowerCase();
    var sTime = new Date(startTime); //开始时间
    var eTime = new Date(endTime); //结束时间
    //作为除数的数字
    var timeType = 1;
    switch (diffType) {
        case "second":
            timeType = 1000;
            break;
        case "minute":
            timeType = 1000 * 60;
            break;
        case "hour":
            timeType = 1000 * 3600;
            break;
        case "day":
            timeType = 1000 * 3600 * 24;
            break;
        default:
            break;
    }
    let time = parseInt(((eTime.getTime() - sTime.getTime()) / parseInt(timeType)) * 100) / 100;

    return time;
}

/**
 * 计算两个时间的30的整数
 * @param {*} time 

 */
function filterTime(time) {
    //  补0
    let filterZero = (i) => {
        return i < 10 ? `0${i}` : i
    }
    let [t1, t2, t3, t4, t5] = [
        new Date(time).getFullYear(),
        filterZero(new Date(time).getMonth() + 1),
        filterZero(new Date(time).getDate()),
        filterZero(new Date(time).getHours()),
        filterZero(new Date(time).getMinutes()),
    ]
    console.log(`默认日期:${t1}-${t2}-${t3} ${t4}:${t5}`);

    filterRang()
    function filterRang() {
        //  分钟取整运算
        let i = parseInt(t5)
        if (i >= 0 && i < 30) {
            t5 = 30
        } else {
            // 小时进位 
            t5 = `00`
            t4 = parseInt(t4) + 1
            filterHours(t4)
        }
    }
    function filterHours(i) {
        i = parseInt(i)
        // 现在是24小时制，可修改为12小时制
        if (i >= 0 && i < 24) {
            t4 = filterZero(i)
        } else {
            // 天数进位 
            t4 = `00`
            t3 = parseInt(t3) + 1
            filterDay(t3)
        }
    }
    function filterDay(i) {
        //  获取当月有多少天
        let nowMD = parseInt(new Date(t1, t2, 0).getDate())

        i = parseInt(i)
        if (i >= 0 && i <= nowMD) {
            t3 = filterZero(i)
        } else {
            // 月份进位 
            t3 = `01`
            t2 = parseInt(t2) + 1
            filterMonth(t2)
        }
    }
    function filterMonth(i) {
        i = parseInt(i)
        if (i >= 0 && i <= 12) {
            t2 = filterZero(i)
        } else {
            // 年进位 
            t2 = `01`
            t1 = parseInt(t1) + 1
        }
    }
    console.log(`${t1}-${t2}-${t3} ${t4}:${t5}`);
    return `${t1}-${t2}-${t3} ${t4}:${t5}`;
}
/**
 * 计算n个工作日后的日期
 * @param {*} start 
 * @param {*} endTime 
 */
function endWorkdayDates(start,days){
    var startdate = moment(start);
    var enddate;
    var j = 0;
    if(moment(startdate).day() == 6){
      j= j+2;
    }else if(moment(startdate).day() == 0){
      j = j+1;
    }
    for(var i = 0; i<days; i++){
      var  nowDate = moment(startdate).add(i + j,'days');
      enddate = nowDate;
      if (moment(nowDate).day() == 6) {
          j = j + 1;
      }else if (moment(nowDate).day() == 0){
          j = j + 1;
      }else if (moment(nowDate).day() == 5){
          j = j + 2;
      }
      
    }
    return moment(enddate).format('YYYY-MM-DD');
}

/**
 * 计算两个日期间的工作日天数
 * @param {*} start 
 * @param {*} endTime 
 */
 function WorkdayFromDates(startdate,enddate){
    var alldays = moment(enddate).diff(moment(startdate), 'days')+2;
    var startweek = moment(startdate).day();
    var currenddate = moment(startdate);
    var weeks = 0;
    for(var i = 0; i < alldays; i++){
      if(startweek ==0 ||startweek ==6){
        weeks++;
      }
      currenddate = moment(currenddate).add(1, 'days');
      startweek =  moment(currenddate).day();
    }
    return(alldays - weeks);

}
/*根据开始时间及间隔一周次数算结束时间 
 *startDate: 开始时间
 *interval: 间隔单周数
 *weekday:每周几
 * Returns: 结束时间即最后一次时间
*/
function getEndDateForIntervalOneWeek(startDate,interval,weekday) {
	var realStartDate;
	if(weekday === 0){
		realStartDate = moment(startDate).add(moment(startDate).day());
	}else{
		if(moment(startDate).day() > weekday){
			realStartDate = moment(startDate).day(weekday +7);
		}else{
			realStartDate = moment(startDate).day(weekday );

		}
	}
    let endDateInterval = moment(realStartDate).add((interval - 1)*7 , 'days');
    return {
					realStartDate: new Date(realStartDate),
					realEndDate: moment(endDateInterval).format('YYYY-MM-DD'),
		};
}
/*根据开始时间及间隔两周次数算结束时间 
 *startDate: 开始时间
 *interval: 间隔单周数
 *weekday:每周几
 * Returns: 结束时间即最后一次时间
*/
function getEndDateForIntervalTWOWeek(startDate,interval,weekday) {
	var realStartDate;
	if(weekday === 0){
		enddate = moment(startDate).add(moment(startDate).day());
	}else{
		if(moment(startDate).day() > weekday){
			realStartDate = moment(startDate).day(weekday +7);
		}else{
			realStartDate = moment(startDate).day(weekday );

		}
	}
	let endDateInterval = moment(realStartDate).add((interval - 1)*14 , 'days');
	return {
		realStartDate: new Date(realStartDate),
		realEndDate: moment(endDateInterval).format('YYYY-MM-DD'),
};
}
/*根据开始时间及间隔每周次数算结束时间 
 *startDate: 开始时间
 *endDate: 结束时间
 *weekday:每周几
 * Returns: 次数
*/
function getIntervalOneWeekForStartDateToEndDate(startDate,endDate,weekday){
	var realStartDate;
	if(weekday === 0){
		realStartDate = moment(startDate).add(moment(startDate).day());
	}else{
		if(moment(startDate).day() > weekday){
			realStartDate = moment(startDate).day(weekday +7);
		}else{
			realStartDate = moment(startDate).day(weekday );

		}
	}
	let interval = moment(endDate).diff(moment(startDate), 'days')+2;

	let intervalWeek = interval / 7;
	return parseInt(intervalWeek) + 1;
}
/*根据开始时间及间隔两周次数算结束时间 
 *startDate: 开始时间
 *endDate: 结束时间
 *weekday:每周几
 * Returns: 次数
*/
function getIntervalTwoWeekForStartDateToEndDate(startDate,endDate,weekday){
	var realStartDate;
	if(weekday === 0){
		realStartDate = moment(startDate).add(moment(startDate).day());
	}else{
		if(moment(startDate).day() > weekday){
			realStartDate = moment(startDate).day(weekday +7);
		}else{
			realStartDate = moment(startDate).day(weekday );

		}
	}
	let interval = moment(endDate).diff(moment(startDate), 'days')+2;

	let intervalWeek = interval / 14;
	return parseInt(intervalWeek) + 1;
}


/**
 * 根据姓名获取随机的颜色
 * @param {} userName 
 */
function getColorByUsername(userName) {
    const colors = ["#f37b1d", '#fbbd08', '#8dc63f', '#39b54a', '#1cbbb4', '#0081ff', '#6739b6', '#9c26b0', '#24998d', '#1f9baa', '#219167', '#239676', '#99cc33', '#3f9337'];
    let hash = encode().value(userName);
    let index = Math.abs(hash) % 14;
    return colors[index];
}
/**
 * 校验是否为roomid
 * @param {*} data 
 */
function checkRoomId(data) {
    if (!data) {
        return false
    }
    const arr = data.split("-");
    const numberArr = data.replace(/-/g, '');
    var reg = /^[0-9]+.?[0-9]*$/;
    if (arr.length == 3 && arr[0].length==3 && arr[1].length== 4 && arr[2].length == 4 && reg.test(numberArr)) {
        return true
    } else {
        return false
    }
}
/**
 * 校验roomname是否合法
 * @param {*} name 
 */
function checkRoomName(name) {
    if (!name) {
        return false
    }
    let reg = /^(\w|[\u4e00-\u9fa5]){1,}$/;
    return reg.test(name)
}
/**
 * 去掉字符串空格
 * @param {*} name 
 */
function deleteStringSpace(str){
   return str.replace(/^\s+|\s+$/g,"");
}
/**
* 判断此对象是否是Object类型
* @param {Object} obj  
 */
function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
};
/**
* 判断此对象是否是json字符串
* @param {String} str  
 */
function isObjectStr(str) {
    if (typeof str == 'string') {
        try {
            var obj = JSON.parse(str);
            if (typeof obj == 'object' && obj) {
                return true;
            } else {
                return false;
            }

        } catch (e) {
            console.log('error:' + str + '!!!' + e);
            return false;
        }
    }
};
/**
 * 判断此类型是否是Array类型
 * @param {Array} arr 
 */
function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
};
/**
 *  深度比较两个对象是否相同
 * @param {Object} oldData 
 * @param {Object} newData 
 */
function isEquals(oldData, newData) {
    // 类型为基本类型时,如果相同,则返回true
    if (oldData === newData) return true;
    if (isObject(oldData) && isObject(newData) && Object.keys(oldData).length === Object.keys(newData).length) {
        // 类型为对象并且元素个数相同

        // 遍历所有对象中所有属性,判断元素是否相同
        for (const key in oldData) {
            if (oldData.hasOwnProperty(key)) {
                if (!isEquals(oldData[key], newData[key]))
                    return false;
            }
        }
    } else if (isArray(oldData) && isArray(oldData) && oldData.length === newData.length) {
        for (let i = 0, length = oldData.length; i < length; i++) {
            if (!isEquals(oldData[i], newData[i]))
                return false;
        }
    } else {
        return false;
    }

    return true;
};

/**
 * 将websocket链接转成http
 * @param {string} url 
 */
function websocketUrl2HttpUrl(url) {
    if (!url) {
        throw new Error("参数为空");
    }
    if (url.startsWith("ws")) {
        const after = url.substring(2);
        return "http" + after;
    }
    return url;
}

/**
 * 得到当前时间的时间戳
 * @returns 
 */
function getCurrentTime() {
    return new Date().getTime();
}
/**
 * 从本地获取某一类型的信令服务器列表
 * @param {String} type 
 * @returns 可用的信令服务器列表
 */
function getSignalingServerListFromLocal(type = "meeting") {

    const { myServer } = store.getState().setting;  // 后期从服务器更新到的列表（将本地和服务器的进行合并）
    let currentList = signaling_servers;            // 配置在本地config.js里的信令服务器列表
    if (myServer?.list && myServer.list.length > 0) {
        currentList.concat(myServer.list);          // 合并
    }
    let serverType = type;
    let servers = [];
    const env = DEVELOPMENT ? 'test' : 'product';
    for (let i = 0; i < currentList.length; i++) {
        const element = currentList[i];
        if (element.status === 'online' && element.env === env && element.type === serverType) {
            servers.push(element);
        }
    }
    return servers;
}

/**
 * 获取管理后台地址
 * @returns 
 */
function getManagerServer() {
    const env = DEVELOPMENT ? 'test' : 'product';
    let managerServer;
    for (let i = 0; i < manager_servers.length; i++) {
        const element = manager_servers[i];
        if (element.env === env) {
            managerServer = element.url;
        }
    }
    return managerServer;
}

/**
 * 打乱一个数组
 * @param {Array} arr 
 */
function shuffleArray(arr) {
    var i = arr.length, t, j;
    if (i <= 1) {
        return; // 曾经这里出现过死循环的bug,i==0时
    }
    while (--i) {
        j = Math.floor(Math.random() * i);
        t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
    }
}


/**
 * 得到范围内的随机数
 * @param {*} min 
 * @param {*} max 
 * @returns 
 */
function getRandomNumBetweenAnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
/**
 * 得到随机的服务URL
 * @returns 
 */
function getRandomSignalingServerUrl(protocol, signalingType) {
    const SERVER_RECORDS = getSignalingServerListFromLocal(signalingType);
    // 打乱，确保随机，确保负载均衡
    shuffleArray(SERVER_RECORDS);
    if (!SERVER_RECORDS || SERVER_RECORDS.length == 0) {
        console.error("无可用的信令服务器，请检查配置");
        store.dispatch(notify({ type: "error", text: "无可用的信令服务器，请检查配置" }));
        return "none";
    }
    const defaultBaseUrl = protocol + '://' + SERVER_RECORDS[0].hostname + ':' + SERVER_RECORDS[0].port;
    return defaultBaseUrl;
}

/**
 * 拦截对象的componentWillUnmount 和 setState 方法，保证安全性
 * @param {Object} target 
 */
function inject_react_unmount(target) {
    // 改装componentWillUnmount，销毁的时候记录一下
    let next = target.prototype.componentWillUnmount
    target.prototype.componentWillUnmount = function () {
        if (next) next.call(this, ...arguments);
        this.unmount = true
    }
    // 对setState的改装，setState查看目前是否已经销毁
    let setState = target.prototype.setState
    target.prototype.setState = function () {
        if (this.unmount) return;
        setState.call(this, ...arguments)
    }
}

export default {
    deleteStringSpace,
    websocketUrl2HttpUrl,
    randomColor,
    getDateDiff,
    filterTime,
    getColorByUsername,
    checkRoomId,
    isEquals,
    isObjectStr,
    checkRoomName,
    getCurrentTime,
    getSignalingServerListFromLocal,
    getManagerServer,
    getRandomNumBetweenAnd,
    getRandomSignalingServerUrl,
    shuffleArray,
    inject_react_unmount,
    object2Array,
    extractMeetingNo,
    endWorkdayDates,
    WorkdayFromDates,
    getEndDateForIntervalOneWeek,
		getEndDateForIntervalTWOWeek,
		getIntervalOneWeekForStartDateToEndDate,
		getIntervalTwoWeekForStartDateToEndDate,
}