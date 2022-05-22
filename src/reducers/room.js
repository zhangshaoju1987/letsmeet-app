const initialState = {
    stream: { toURL: () => { return ''; } },
    isOpenVideo: false,
    isOpneAudio: false,
    audioProducer: null,
    peers: [],
    activeSpeaker: {},
    consumerStream: null,
    muteAll: false,
    roleMap: null,
    roles: [],
    time: "00:00:00",
    roomHistory: [],
    meetingSubjects:[],// 会议主题
    meetingNormalSubjects: [],//常规会议主题
    meetingCycleSubjects: [],//周期性会议
    consumerVideoStreams: {},
    consumerAudioStreams: {},
    consumerScreenStreams: {},
    producerScores: {},
    fullScreeenStream: null,
    roomBtnStatus: true,
    roomMyStreamStatus: true,
    locked: false,
    whiteboardShareServer: '',
    lobbyPeer: {},
    recordingStatus:false,
    roomStatus:'noStart',  // noStart,connecting,reconnecting,meeting,finished
}

const room = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_MY_STREAM': {
            const { stream } = action.payload;
            return { ...state, stream };
        }
        case 'RESET_PEERS': {
            // 替换原来的peers，用在入会前初始化
            const { peers } = state;
            const newPeerList = action.payload.peers;
            peers.length = 0;
            peers.push(...newPeerList);
            return { ...state, peers };
        }
        case 'ADD_PEER': {
            if (action.payload) {
                
                const {peers} = state;
                const index = peers.findIndex((item)=> item.id == action.payload.id);
                if(index != -1){ // 如果已经存在，要先删除之前的
                    console.log("加入时删除已经存在的peer",index,action.payload.id);
                    peers.splice(index,1);
                }
                peers.push(action.payload);
                // let i = 0;
                // peers.map((item)=>{
                //     console.log((++i)+'\t加入后 参会人员', item.displayName+"\t",item.id);
                // });
                return { ...state, peers };
            } else {
                return state;
            }
        }
        case 'CLEAR_PEER': {
            // 连接断开或者会议初始化时清空
            const {peers} = state;
            peers.length = 0;
            return { ...state, peers:[] };
        }
        case 'REMOVE_PEER_BY_ID': {
            // 对方主动退出或者我方将其踢出
            const { peers } = state;
            const id = action.payload;
            // let i = 0;
            // peers.map((item)=>{
            //     console.log((++i)+'\t删除前 参会人员', item.displayName+"\t",item.id);
            // });

            const index = peers.findIndex((item)=> item.id == id);
            if(index != -1){
                //console.log("删除已经存在的peer",index,id);
                peers.splice(index,1);
            }
            return { ...state, peers };
        }
        case 'SET_ACTIVE_SPEAKERS': {
            const { peerid, volume } = action.payload;
            const activeSpeaker = {
                peerid: peerid,
                volume: volume,
            }
            return { ...state, activeSpeaker };
        }
        
        case 'ADD_CONSUMER_VIDEO_STREAM': {
            let consumerVideoStreams = state.consumerVideoStreams||{};
            const { consumerId, consumer } = action.payload;
            //console.log("添加一个视频消费者：",consumerId)
            consumerVideoStreams[consumerId] = consumer;
            return { ...state, consumerVideoStreams };
        }
        case 'REMOVE_CONSUMER_VIDEO_STREAM': {
            let { consumerVideoStreams } = state;
            const { consumerId } = action.payload;
            //console.log("移除一个视频消费者：",consumerId)
            if (consumerVideoStreams) {
                delete consumerVideoStreams[consumerId];
            }
            return { ...state, consumerVideoStreams };
        }
        case 'REMOVE_ALL_CONSUMER_VIDEO_STREAM': {
            let { consumerVideoStreams } = state;
            if (consumerVideoStreams) {
                for(var consumerId in consumerVideoStreams){
                    delete consumerVideoStreams[consumerId];
                }
            }
            return { ...state, consumerVideoStreams };
        }
        case 'SET_MUTEALL': {
            const muteAll = action.payload;
            return { ...state, muteAll };
        }
        case 'SET_ROLE_MAP': {
            const { roleMap } = action.payload;
            return { ...state, roleMap };
        }
        case 'SET_ROLE': {
            const peers = state.peers;
            const newPeer = []
            for (let i = 0; i < peers.length; i++) {
                const element = peers[i];
                if (action.payload.peerId == element.id) {
                    if (!element.roles) {
                        element.roles = []
                    }
                    if (!element.roles.includes(action.payload.roleId)) {
                        element.roles.push(action.payload.roleId);
                    }

                }
                newPeer.push(element)
            }

            return { ...state, peers: newPeer };
        }
        case 'SET_ROOT_TIME': {
            const { time } = action.payload;
            return { ...state, time };
        }
        case 'ADD_ROOM_HISTORY': {
            const roomHistory = action.payload;
            let roomHistories = state.roomHistory || [];
            var list = roomHistories.filter(item => item.roomId != roomHistory.roomId)
            list.push(roomHistory);
            return { ...state, roomHistory: list };
        }
        case 'REMOVE_ROOM_HISTORY': {
            const roomId = action.payload;
            let oldRoomHistory = state.roomHistory || [];
            // js 遍历newRoomHistory数组，删除和roomId匹配的记录
            let newRoomHistory = oldRoomHistory.filter((item)=>{
                return item.roomId != roomId;
            });
            oldRoomHistory.length=0;
            oldRoomHistory=[];
            return { ...state, roomHistory: newRoomHistory };
        }

        case 'ADD_MEETING_SUBJECT': {
            const subject = action.payload;
            let meetingSubjects = state.meetingSubjects || [];
            var list = meetingSubjects.filter(val => val != subject)
            list.push(subject);
            return { ...state, meetingSubjects: list };
        }
        case 'ADD_MEETINGNORMAL_SUBJECT': {
            const subject = action.payload;
            let meetingSubjects = state.meetingNormalSubjects || [];
            var list = meetingSubjects.filter(val => val != subject)
            list.push(subject);
            return { ...state, meetingNormalSubjects: list };
        }
        case 'ADD_MEETINGCYCLITY_SUBJECT': {
            const subject = action.payload;
            let meetingSubjects = state.meetingCycleSubjects || [];
            var list = meetingSubjects.filter(val => val != subject)
            list.push(subject);
            return { ...state, meetingCycleSubjects: list };
        }
        case 'REMOVE_MEETING_SUBJECT': {
            const subject = action.payload;
            let oldMeetingSubjects = state.meetingSubjects || [];
            // js 遍历newRoomHistory数组，删除和roomId匹配的记录
            let newMeetingHistory = oldMeetingSubjects.filter((val)=>{
                return val != subject;
            });
            oldMeetingSubjects.length=0;
            oldMeetingSubjects=[];
            return { ...state, meetingSubjects: newMeetingHistory };
        }
        case 'REMOVE_MEETINGNORMAL_SUBJECT': {
            const subject = action.payload;
            let oldMeetingSubjects = state.meetingNormalSubjects || [];
            // js 遍历newRoomHistory数组，删除和roomId匹配的记录
            let newMeetingHistory = oldMeetingSubjects.filter((val)=>{
                return val != subject;
            });
            oldMeetingSubjects.length=0;
            oldMeetingSubjects=[];
            return { ...state, meetingNormalSubjects: newMeetingHistory };
        }
        case 'REMOVE_MEETINGCYCLITY_SUBJECT': {
            const subject = action.payload;
            let oldMeetingSubjects = state.meetingCycleSubjects || [];
            // js 遍历newRoomHistory数组，删除和roomId匹配的记录
            let newMeetingHistory = oldMeetingSubjects.filter((val)=>{
                return val != subject;
            });
            oldMeetingSubjects.length=0;
            oldMeetingSubjects=[];
            return { ...state, meetingCycleSubjects: newMeetingHistory };
        }
        case 'ADD_PRODUCER_SCORES': {
            var producerScores = state.producerScores||{};
            const { producerId, score } = action.payload;
            producerScores[producerId]= score;
            return { ...state, producerScores };
        }
        case 'REMOVE_PRODUCER_SCORES': {
            let { producerScores } = state;
            const { producerId } = action.payload;
            if (producerId) {
                delete producerScores[producerId];
            }else{
                console.error("不应该出现：",producerId);
            }
            return { ...state, producerScores };
        }
        case 'ADD_CONSUMER_AUDIO_STREAM': {
            let consumerAudioStreams = state.consumerAudioStreams||{};
            const { consumerId, consumer } = action.payload;
            consumerAudioStreams[consumerId]= consumer;
            return { ...state, consumerAudioStreams };
        }
        case 'REMOVE_CONSUMER_AUDIO_STREAM': {
            let { consumerAudioStreams } = state;
            const { consumerId } = action.payload;
            if (consumerId) {
                delete consumerAudioStreams[consumerId];
            }
            return { ...state, consumerAudioStreams };
        }
        case 'REMOVE_ALL_CONSUMER_AUDIO_STREAM': {
            let { consumerAudioStreams } = state;
            if (consumerAudioStreams) {
                for(var x in consumerAudioStreams){
                    delete consumerAudioStreams[x];
                }
            }
            return { ...state, consumerAudioStreams };
        }
        case 'ADD_CONSUMER_SCREEN_STREAM': {
            let consumerScreenStreams = state.consumerScreenStreams||{};
            const { consumerId, consumer } = action.payload;
            consumerScreenStreams[consumerId] = consumer;
            return { ...state, consumerScreenStreams };
        }
        case 'REMOVE_CONSUMER_SCREEN_STREAM': {
            let { consumerScreenStreams } = state;
            const { consumerId } = action.payload;
            if(consumerScreenStreams){
                delete consumerScreenStreams[consumerId];
            }
            return { ...state, consumerScreenStreams };
        }
        case 'REMOVE_ALL_CONSUMER_SCREEN_STREAM': {
            let { consumerScreenStreams } = state;
            if(consumerScreenStreams){
                for(var consumerId in consumerScreenStreams){
                    delete consumerScreenStreams[consumerId];
                }
            }
            return { ...state, consumerScreenStreams };

        }
        case 'SET_FULL_SCREEN_STREAM': {
            const { stream } = action.payload;
            return { ...state, fullScreeenStream: stream };
        }
        case 'REMOVE_FULL_SCREEN_STREAM': {
            return { ...state, fullScreeenStream: null };
        }
        case 'ROOM_BTN_STATUS': {
            const { status } = action.payload;
            return { ...state, roomBtnStatus: status };
        }
        case 'ROOM_MY_STREAM_STATUS': {
            const { status } = action.payload;
            return { ...state, roomMyStreamStatus: status };
        }
        case 'SET_CONSUMER_STS': {
            const { consumerId, type, originator, value } = action.payload;
            //console.log('SET_CONSUMER_STS==', action.payload)
            let consumers = ''
            if (type == 'mic') {
                consumers = state.consumerAudioStreams;
            } else if (type == 'webcam') {
                consumers = state.consumerVideoStreams;
            }else{
                console.error("不应该出现type=",type)
            }
            if (consumers && consumerId) {
                let consumer = consumers[consumerId];
                if (!consumer) {
                    return state;
                }
                if (originator == 'local') {
                    consumer.consumer.locallyPaused = value
                } else {
                    consumer.consumer.remotelyPaused = value
                }
                consumers[consumerId]= consumer;
                if (type == 'mic') {
                    return { ...state, consumerAudioStreams: consumers }
                } else if (type == 'webcam') {
                    return { ...state, consumerVideoStreams: consumers }
                }

            } else {
                return state;
            }
        }
        case 'ROOM_SET_LOCKED': {
            return { ...state, locked: true };
        }

        case 'ROOM_SET_UN_LOCKED': {
            return { ...state, locked: false };
        }
        case 'SET_WHITE_BOARD_SHARE_SERVER': {
            const { url } = action.payload;
            return { ...state, whiteboardShareServer: url };
        }
        case 'ADD_LOBBY_PEER': {
            const { displayName, peerId } = action.payload;
            let lobbyPeer = state.lobbyPeer || {};
            if (displayName && peerId) {
                lobbyPeer[peerId] = {displayName, peerId };
            }
            return { ...state, lobbyPeer };
        }
        case 'ADD_LOBBY_PEERS':{
            const { peers } = action.payload;
            let lobbyPeer = state.lobbyPeer || {};
            if(peers && peers.length > 0){
                peers.forEach(element => {
                    lobbyPeer[element.peerId] = {...element};
                }); 
            }
            return { ...state, lobbyPeer };
        }
        case 'REMOVE_LOBBY_PEER':{
            const { peerId } = action.payload;
            let lobbyPeer = state.lobbyPeer;
            if(peerId){
                delete lobbyPeer[peerId];
            }
            return { ...state, lobbyPeer };
        }
        case 'REMOVE_ALL_LOBBY_PEER':{
            let lobbyPeer = state.lobbyPeer;
            if(lobbyPeer){
                for(var peerId in lobbyPeer){
                    delete lobbyPeer[peerId];
                }
            }
            return { ...state, lobbyPeer };
        }
        
        case 'SET_RECORDING_STATUS':{
            const { value } = action.payload;
            let recordingStatus = value || false;
            return { ...state, recordingStatus };
        }
        case 'SET_ROOM_STATUS':{
            const { value } = action.payload;
            return { ...state, roomStatus: value };
        }
        default:
            return state;
    }
}

export default room;