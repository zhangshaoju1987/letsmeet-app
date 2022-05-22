import { SignalingSocket } from '../services/protoo';
import roomTransport from '../lib/room-transport';
import { Platform, Dimensions, UIManager, findNodeHandle, AppState } from 'react-native';
import { mediaDevices, MediaStream } from '@zhumi/react-native-webrtc';
import * as mediaSDK from "@zhumi/bigbrain_media-client";
import { store } from "../store";
import Orientation from '@zhumi/react-native-orientation';
import * as userAction from '../actions/userAction';
import * as roomAction from '../actions/roomAction';
import * as peerVolumeActions from '../actions/peerVolumeActions';
import { notify } from '../actions/requestActions';
const Sound = require('react-native-sound');
Sound.setCategory('Playback');
class RoomClient {
	constructor(props) {
		
		this._roomId = null;
		this._signalingSocket = null;
		/**
		 * 上一次说话时间
		 * 用来检测自动优化静音
		 */
		this._lastSpeakTime = -1;

		this._device = null;

		this._forceTcp = store.getState().setting.transportType == "tcp";

		this._recvTransport = null;

		this._autoPause = props.autoPause;

		this._sendTransport = null

		this._turnServers = null;

		this._produce = props.produce

		this._micProducer = null;

		this._isFront = true;

		this._stream = null;

		this._webVideoProduce = null;

		this.centralAudioOptions = {}

		this._consumers = new Map();

		this._type = props.type

		this._roomName = null;

		this._screenSharingProducer = null;

		this._peerId = null;

		this._closed = false;

		this.meetingSignalingServer = props.meetingSignalingServer;

		this._displayName = props.displayName;

		this._navigation = props.navigation || '';

		this._videoAspectRatio = parseInt((Dimensions.get("window").width / Dimensions.get("window").height) * 1000) / 1000;

		this._whoosh = new Sound('notify.mp3', Sound.MAIN_BUNDLE, (error) => {
			if (error) {
				console.error("通知音频加载失败");
				return;
			}
		});
		this.resetRoom();
		this._appStateChangeSubscribe = AppState.addEventListener("change",this._appStateChangeHandler);
	}

	_appStateChangeHandler(status){
		if(status == "background"){
			const {fullScreeenStream} = store.getState().room;
			if(fullScreeenStream){
				//console.log("app进入后台退出视频展示");
				//app进入后台后，关闭视频，减少不必要的cpu消耗
				store.dispatch(roomAction.removeFullScreenStream());
				Orientation.lockToPortrait();
			}
		}
	}
	/**
	 * 加入会议
	 * @param {*} param0 
	 */
	async join({ roomId, joinVideo, joinAudio, roomName }) {

		const { meetingNo } = store.getState().user

		this._roomId = roomId || meetingNo;

		roomName && (this._roomName = roomName);

		const { token } = store.getState().user;

		this._peerId = token;
		const options = {//默认参数（超时和重试机制）
			retry: {
				retries: 60,
				factor: 2,
				minTimeout: 4 * 1000,
				maxTimeout: 32 * 1000
			}
		}
		// 获取到信令服务器地址
		const signalingUrl = SignalingSocket.getSignalingUrl({ meetingSignalingServer: this.meetingSignalingServer, roomId: this._roomId, peerId: token, roomName: roomName });
		console.log("signalingUrl=",signalingUrl)
		this._transport = new roomTransport.WebSocketTransport(signalingUrl, options);
		this._signalingSocket = new roomTransport.Peer(this._transport);
		this.signalingSocketOnEvent({ joinVideo, joinAudio });
		
		if(this._autoPause){
			console.log("启动静音检查定时任务==============");
			this._audoPauseTask = setInterval(()=>{
				const current = new Date().getTime();
				const timeout = 3*60*1000;
				const elipsed = current-this._lastSpeakTime;
				const num = store.getState().room.peers?.length;//会议人数
				// 会议人数超过6人时,且超过时间不说话,就自动静音
				if(this._lastSpeakTime != -1 && elipsed > timeout && num > 8){
	
					if (!this._micProducer || this._micProducer.closed || this._micProducer.paused) {
						return;
					}
					console.log("静音超过",timeout/1000,"秒");
					this.pauseAudio();
					this._lastSpeakTime = current;// 重新开始计数
					store.dispatch(notify({ text: "由于长时间未说话,已为您自动静音", timeout: 3000 }));
				}
			},10*1000);
		}
	}

	async signalingSocketOnEvent({ joinVideo, joinAudio }) {
		//console.log('signalingSocketOnEvent --- start');

		this._signalingSocket.on('open', () => {
			console.log('signalingSocketOnEvent --- open');
			store.dispatch(roomAction.setRoomStatus('connecting'))
		});

		this._signalingSocket.on('disconnected', () => {
			console.log('signalingSocketOnEvent --- disconnected');
			this.removePeers();
			store.dispatch(roomAction.removeAllConsumerScreenStream()); // 退出或者关闭会议时移除
			store.dispatch(roomAction.removeAllConsumerAudioStream());
			store.dispatch(roomAction.removeAllConsumerVideoStream());
			store.dispatch(roomAction.removeFullScreenStream());
			store.dispatch(roomAction.removeAllLobbyPeer());
			// 网络切换的时候容易触发到这里，这里需要考虑重连
			store.dispatch(roomAction.setRoomStatus('reconnecting'))
			if (this._screenSharingProducer) {
				this._screenSharingProducer.close()
				this._screenSharingProducer = null;
			}
			if (this._webVideoProducer) {
				this._webVideoProducer.close();
				store.dispatch(roomAction.setMyStream());
				this._webVideoProducer = null;
			}
			if (this._micProducer) {
				this._micProducer.close();
				this._micProducer = null;
			}

			if (this._sendTransport) {
				this._sendTransport.close();
				this._sendTransport = null;
			}
			if (this._recvTransport) {
				this._recvTransport.close();
				this._recvTransport = null;
			}

			console.log('signalingSocketOnEvent --- disconnected');
		});

		this._signalingSocket.on('close', () => {
			console.log('signalingSocketOnEvent --- close');
			this.close("检测到信令通道关闭,自己被动离开会议");
			store.dispatch(roomAction.setRoomStatus('finished'))
		});

		this._signalingSocket.on('failed', () => {
			console.log('signalingSocketOnEvent --- failed');
		});
		//客户端发给服务端
		this._signalingSocket.on('request', async (request, accept) => {
			switch (request.method) {
				case 'newConsumer': {

					const peer = this.getPeerInfoById(request.data.appData.peerId);
					const {
						peerId,
						producerId,
						id,
						kind,
						rtpParameters,
						appData,
						producerPaused
					} = request.data;

					let displayName = peer?.displayName;
					console.log('local start newConsumer:from', peer?.displayName, appData.source,id);
					// 由于重试策略,newConsumer可能出现多次重新请求的情况
					// 多次请求，会导致多个重复的consumer,导致媒体信号管理失控，比如明明所有人都静音了，但是还是有杂音
					if(!this._consumers.has(id)){
						this._recvTransport.consume({ id, producerId, kind, rtpParameters, appData: { ...appData, peerId, displayName } })
						.then((consumer)=>{
							this._consumers.set(consumer.id, consumer);
							//console.log('local success newConsumer:from', peer?.displayName,appData.source);
							accept(null);
							console.log('local success newConsumer:from', peer?.displayName,appData.source,id);
							consumer.locallyPaused = false;
							consumer.remotelyPaused = producerPaused;
							if (kind == 'video') {
								const stream = new MediaStream();
								stream.addTrack(consumer.track);
								this.sendRequest('pauseConsumer', { consumerId: consumer.id })
								.then(()=>{consumer.pause()})
								.catch((error)=>{
									console.log("send request pauseConsumer got error",error);
								})

								if (appData.source == 'webcam') {  //视频
									store.dispatch(roomAction.addConsumerVideoStream(consumer.id, { consumer, stream }));
								} else if (appData.source == 'screen') {  //屏幕分享
									//TODO 屏幕分享参照微信那样显示，并且预留出来一个view，存放大屏数据，并且旋转
									store.dispatch(roomAction.addConsumerScreenStream(consumer.id, { consumer, stream }));
								}
							}
							if (kind == 'audio') {
								const stream = new MediaStream();
								stream.addTrack(consumer.track);
								store.dispatch(roomAction.addConsumerAudioStream(consumer.id, { consumer, stream }))
							}
							consumer.on('transportclose', () => { });
						})
						.catch((error)=>{
							console.log("Create consumer on local side got error",error);
						})
						
					}else{
						console.log("ERROR newConsumer 重复接收",request.data);
						console.log('ERROR local success newConsumer:from', peer?.displayName, request.data.appData.source);
						accept(null);
						console.log('ERROR remot success newConsumer:from', peer?.displayName, request.data.appData.source);
					}					
					break;
				}
				default: { }

			}
		});
		//服务端通知客户端[]
		this._signalingSocket.on('notification', async (notification) => {
			// console.log('signalingSocketOnEvent --- notification:', notification);
			// if(notification.method != 'activeSpeaker'){
			// 	alert(notification.method);

			// }
			switch (notification.method) {
				case 'roomReady': {  //房间准备好了
					console.log("收到roomReady通知")
					const {
						turnServers
					} = notification.data;

					this._turnServers = turnServers;
					const { audioSts, videoSts } = store.getState().user;
					if (audioSts) {
						joinAudio = true;
					}
					if (videoSts) {
						joinVideo = true;
					}
					try {
						await this.JoinRoom({ joinVideo, joinAudio });
					} catch (err) {
						console.log("加入会议出现异常",err);
						this.close("加入会议出现异常");
						store.dispatch(notify({ text: "加入会议出现异常:" + err.message, type: "error" }));
					}

					break;
				}
				case 'producerScore': {
					const { producerId, score } = notification.data;
					//console.log('signalingSocketOnEvent --- producerScore:', producerId);
					if(AppState.currentState != "active"){
						break;
					}
					const {roomBtnStatus} = store.getState().room; // 非会议原始界面不显示上传质量
					if(!roomBtnStatus){
						break;
					}
					for (let i = 0; i < score.length; i++) {
						const element = score[i];
						if (element.score > 0 && element.score <= 7) {
							store.dispatch(notify({ text: '由于您的上传带宽不足,您发送的[' + this.getTypeForProducerId(producerId).name + "]将受到影响" }));
						}
					}
					break;
				}
				case 'consumerScore': {
					const { consumerId, score } = notification.data;
					//console.log('signalingSocketOnEvent --- consumerScore:', score);
					if(AppState.currentState != "active"){
						break;
					}
					const {roomBtnStatus} = store.getState().room; // 非会议原始界面不显示通信质量
					if(!roomBtnStatus){
						break;
					}
					try {
						const { appData } = this._consumers.get(consumerId);
						if (score && score.score > 0 && score.score <= 7) {
							let str = appData.source == 'mic' ? '您收听的' : '您观看的';
							store.dispatch(notify({ text: "本地网络不稳定,下载带宽不足\n" + str + "来自" + this.getPeerInfoById(appData.peerId).displayName + '的' + this.chineseNameByType(appData.source) + "将受到影响" }));
						}
					} catch (e) { }

					break;
				}
				case 'moderator:kick': {

					const { message } = notification.data;
					console.log("被踢出", message);
					store.dispatch(notify({ text: message, timeout: 3000 }));
					this.close("收到主持人关闭会议的请求,被动离开会议");
					break;
				}
				case 'serverMessage': {
					// 展示来自服务器端的推送消息
					const { message, type, timeout } = notification.data;
					if(AppState.currentState != "active"){
						break;
					}
					const {roomBtnStatus} = store.getState().room; // 非会议原始界面不显示服务器消息
					if(!roomBtnStatus){
						break;
					}
					console.log("服务器消息", message);
					store.dispatch(notify({ type, text: message, timeout }));
					break;
				}
				case 'activeSpeaker': {   //有人说话
					const { peerId, volume } = notification.data;
					if(AppState.currentState != "active"){// app进入后台，则不显示音量动画，避免不必要的cpu消耗
						break;
					}
					const {roomBtnStatus} = store.getState().room; // 非会议原始界面不显示音量动画，进一步优化cpu性能
					if(!roomBtnStatus){
						break;
					}
					//console.log('signalingSocketOnEvent --- notification:', notification);
					if (peerId) {
						
						const threshold = -45;
						if(volume>threshold){ // 忽略噪音背景音，进一步减少没必要的CPU消耗
							store.dispatch(peerVolumeActions.setPeerVolume(peerId, volume));
						}
						if(peerId == store.getState().user.token && volume > threshold ){//越靠近0音量越大,-40~0之间一般是正常人说话
							// 用户自己的音量信息
							//console.log('signalingSocketOnEvent --- notification:', notification);
							// 用于辅助实现自动静音功能
							this._lastSpeakTime = new Date().getTime();
						}
					}else{
						//store.dispatch(peerVolumeActions.clearPeerVolume());
					}
					break;
				}
				case 'peerClosed': {
					const { peerId } = notification.data;
					const peer = this.getPeerInfoById(peerId);
					if (peer.id != "unKnown") {
						console.log("peerClosed",peer?.displayName,peer?.id);
						store.dispatch(roomAction.removerPeerById(peerId));
						store.dispatch(peerVolumeActions.deletePeerVolume(peerId));
						store.dispatch(notify({ timeout: 1000, text: "["+peer?.displayName + "]离开了会议" }));
					}
					break;
				}
				case 'newPeer': {   //有新的人员加入会议
					const peer = notification.data;
					//console.log("newPeer",peer?.displayName,peer.id);
					store.dispatch(roomAction.addPeer(peer));
					store.dispatch(notify({ timeout: 500, text: "["+peer?.displayName + "]加入了会议" }));
					break;
				}
				case 'consumerClosed': {   //音频或者视频信号关闭
					const { consumerId } = notification.data;
					this.postConsumerClosed(consumerId);
					break;
				}
				case 'consumerPaused': {
					// 存在本地还没有创建消费者，但是服务端已经发送响应指令的情况(TODO 需要考虑)
					const { consumerId } = notification.data;
					let consumer = this._consumers.get(consumerId);
					if(!consumer){
						console.error("consumerPaused consumerId not exist",consumerId);
						break;
					}
					const appData = consumer.appData;
					const { displayName, source,peerId } = appData;
					if (source == "mic") {
						store.dispatch(notify({timeout:1000, text: `[${displayName}]静音了` }));
						//console.log("mute",peerId);
						store.dispatch(peerVolumeActions.deletePeerVolume(peerId));
					}
					store.dispatch(roomAction.setConsumerStatus(consumerId, source, 'remote', true))
					break;
				}
				case 'consumerResumed': {
					// 存在本地还没有创建消费者，但是服务端已经发送响应指令的情况(TODO 需要考虑)
					const { consumerId } = notification.data;
					let consumer = this._consumers.get(consumerId);
					if(!consumer){
						console.error("consumerResumed consumerId not exist",consumerId);
						break;
					}
					const appData = consumer.appData;
					const { displayName, source } = appData;
					if (source == "mic") {
						store.dispatch(notify({timeout:1000,  text: `[${displayName}]开启了麦克风` }));
					}
					store.dispatch(roomAction.setConsumerStatus(consumerId, source, 'remote', false))
					break;
				}
				case 'gotRole': {
					const { peerId, roleId } = notification.data;
					if (peerId === this._peerId) {
						store.dispatch(roomAction.setRole(roleId, peerId))
					}
					break
				}
				case 'moderator:mute': {  //被静音
					this.pauseAudio();
					break
				}
				case 'lockRoom': {
					const { peerId } = notification.data;
					store.dispatch(notify({ text: this.getPeerInfoById(peerId).displayName + "锁定了会议" }));
					store.dispatch(roomAction.setRoomLocked());
					break
				}
				case 'unlockRoom': {
					const { peerId } = notification.data;
					store.dispatch(notify({ text: this.getPeerInfoById(peerId).displayName + "解锁了会议" }));
					store.dispatch(roomAction.setRoomUnLocked());
					break
				}
				case 'lobby:changeDisplayName': {
					const { peerId, displayName } = notification.data;
					//console.log('parkedPeer===', notification.data)
					store.dispatch(roomAction.addLobbyPeer(displayName, peerId));
					break
				}
				case 'lobby:promotedPeer': {
					const { peerId } = notification.data;
					store.dispatch(roomAction.removeLobbyPeer(peerId));
					break
				}
				default: { }

			}
		});
	}

	/**
	 * 消费者关闭后的处理逻辑
	 * @param {string} consumerId 
	 */
	postConsumerClosed(consumerId){
		/**
		 * 1. 将本地consumer要同步关闭
		 * 2. 要处理和consumer相关的其他资源，比如界面元素
		 */
		const consumer = this._consumers.get(consumerId);
		if(!consumer){
			return;
		}
		const appData = consumer.appData;
		if (appData.source == 'webcam') {
			store.dispatch(roomAction.removeConsumerVideoStream(consumerId));
		} else if (appData.source == 'screen') {
			store.dispatch(roomAction.removeConsumerScreenStream(consumerId));
		} else if (appData.source == 'mic') {
			store.dispatch(roomAction.removeConsumerAudioStream(consumerId));
		}
		const {fullScreeenStream} = store.getState().room;
		if (fullScreeenStream && (consumer.stream.id == fullScreeenStream.stream.id)) {
			store.dispatch(roomAction.removeFullScreenStream());
		}
		try {
			this._consumers.delete(consumerId);
			consumer.close();
		} catch (e) {
			console.error("本地消费者关闭异常:", e);
		}
	}


	/**
	 * 播放通知声音
	 */
	async playNotification() {

		if (this._micProducer && !this._micProducer.paused) {
			return;
		}

		if (!this._whoosh) {
			return;
		}
		// iphone再开启麦克风的情况下，会没有声音
		// this._whoosh.play((success) => {});
	}

	/**
	 * 收到roomReady之后加入会议
	 * 注意RN调试模式下会有问题
	 * @param {*} param0 
	 */
	async JoinRoom({ joinVideo, joinAudio }) {
		if (joinVideo || joinAudio) {
			this._produce = true;
		}
		this._device = new mediaSDK.Device();
		const routerRtpCapabilities = await this.sendRequest('getRouterRtpCapabilities');
		routerRtpCapabilities.headerExtensions = routerRtpCapabilities.headerExtensions.filter((ext) => ext.uri !== 'urn:3gpp:video-orientation');

		await this._device.load({ routerRtpCapabilities });
		//if (this._produce) {
		console.log("Crate send transport")
		await this.createSendTransportBuild();
		//}
		console.log("Create receive transport")
		await this.createRecvTransportBuild();
		const { token } = store.getState().user;
		const userInfo = {
			displayName: this._displayName,  //用户名称
			token: token, //用户头像
		}
		console.log("Start to send join request",this._displayName);
		const data = await this.sendRequest('join', Object.assign({ rtpCapabilities: this._device.rtpCapabilities }, userInfo));
		const { peers, userRoles, roomName, locked, lobbyPeers, whiteboardShareServer,meetingUuid } = data;
		//处理加入会议的记录
		this.roomName = roomName;		// 保存当前会议名称
		console.log("roomName from server side:",roomName);
		this.meetingUuid = meetingUuid;	// 保存会议uuid
		let meetingHistory = { roomName: roomName, roomId: this._roomId }
		if (meetingHistory.roomName && meetingHistory.roomName!="undefined" && 
				meetingHistory.roomId && meetingHistory.roomId!= store.getState().user.meetingNo) {
			store.dispatch(roomAction.addRoomHistory(meetingHistory))
		}
		//当前会议参会人员处理
		// let i = 0;
		// peers.map((item)=>{
		// 	console.log((++i)+'\t初始参会人员', item.displayName+"\t",item.id);
		// });

		store.dispatch(roomAction.resetPeer(peers));
		store.dispatch(roomAction.setRoleMap(userRoles))
		store.dispatch(roomAction.setRoomStatus('meeting'))
		store.dispatch(roomAction.setWhiteboardShareServer(whiteboardShareServer))
		if (locked) {
			store.dispatch(roomAction.setRoomLocked());
		} else {
			store.dispatch(roomAction.setRoomUnLocked());
		}
		store.dispatch(roomAction.addLobbyPeers(lobbyPeers))
		//如果是要发送数据
		if (this._produce) {
			if (joinVideo) {  //视频
				this.updateVideoDevices();
			}
			if (joinAudio) { //音频
				this.updateAudioDevices(joinAudio);
			}
		}
	}
	/**
	 * 暂停视频
	 */
	async pauseVideo() {
		if (!this._webVideoProducer) {
			return
		}
		this._webVideoProducer.pause();
		try {
			await this.sendRequest('pauseProducer', { producerId: this._webVideoProducer.id });
		} catch (error) { }
	}
	/**
	 * 开启视频
	 */
	async resumeVideo() {
		if (!this._webVideoProducer) {
			await this.updateVideoDevices()
			return
		}
		this._webVideoProducer.resume();
		try {
			await this.sendRequest('resumeProducer', { producerId: this._webVideoProducer.id });
			// store.dispatch(userAction.setVideoStatus(true))
		} catch (error) { }
	}
	/**
	 * 暂停音频
	 */
	async pauseAudio() {
		if (!this._micProducer || this._micProducer.closed || this._micProducer.paused) {
			store.dispatch(userAction.setAudioStatus(false));
			return;
		}

		store.dispatch(userAction.setAudioStatus(false));
		this._micProducer.pause();
		this.sendRequest('pauseProducer', { producerId: this._micProducer.id }).catch(error=>{
			console.log("pauseAudio got error", error);
			store.dispatch(userAction.setAudioStatus(true));
		});
	}
	/**
	 * 开启音频
	 */
	async resumeAudio() {
		this._lastSpeakTime = new Date().getTime();
		if (!this._micProducer) {
			await this.updateAudioDevices();
			store.dispatch(userAction.setAudioStatus(true));
			return;
		}
		store.dispatch(userAction.setAudioStatus(true));
		this._micProducer.resume();
		this.sendRequest('resumeProducer', { producerId: this._micProducer.id }).catch(error=>{
			console.log("resumeAudio got error", error);
			store.dispatch(userAction.setAudioStatus(false));
		});
	}
	async disableAudio() {
		try {
			if(!this._micProducer || this._micProducer.closed){
				this._micProducer = undefined;
				return;
			}
			this._micProducer.close();
			await this.sendRequest('closeProducer', { producerId: this._micProducer.id });
		} catch (error) {
			console.log("disableAudio got error", error);
		}
		this._micProducer = undefined;
	}
	/**
	 * 音频传输
	 */
	async updateAudioDevices() {
		if (this._closed) {
			return;
		}

		const deviceId = await this._getAudioSourceId();
		const stream = await mediaDevices.getUserMedia({
			audio: {
				deviceId: deviceId,
				sampleRate:96000,
				sampleSize:24,
				channelCount:{
					ideal:2,min:1
				},
				volume:1.0,
				autoGainControl: true,
				echoCancellation: true,
				noiseSuppression: true,
			},
			video: false
		});
		let track;
		([track] = stream.getAudioTracks());

		try{
			this._micProducer = await this._sendTransport.produce({
				track,
				codecOptions:
				{
					opusStereo:true,
					opusDtx:true,
					opusFec:true,
					opusPtime:20,
					opusMaxPlaybackRate:96000
				},
				appData: { source: 'mic' }
			});
			store.dispatch(userAction.setAudioStatus(true))
			this._micProducer.on('transportclose', () => {
				//this._micProducer = null;
			});
	
			this._micProducer.on('trackended', () => {
				//this.disableMic();
			});
		}catch(err){
			console.log("audioProduce got error",err);
			store.dispatch(notify({text:err.message}));
		}
	}
	/**
	 * 屏幕分享
	 */
	async screenShareDevices({ iosScreenRecorder }) {
		if (this._closed) {
			return;
		}
		let track;
		if (this._screenSharingProducer) {
			return;
		}
		mediaDevices.getDisplayMedia({ video: true }).then(async (stream) => {
			const videoSettings = store.getState().setting.videoSettings;
			let screenCodec = videoSettings && videoSettings.screenCodec ? videoSettings.screenCodec : "h264";
			const codec = this._device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === 'video/' + screenCodec);
			// IOS需要启动扩展来获取屏幕录制的数据(1. 先创建流，启动socket服务 2.启动extension，通过socket服务传输屏幕数据到流)
			if (Platform.OS === "ios") {
				const reactTag = findNodeHandle(iosScreenRecorder);
				console.log("ios手机调用屏幕分享,reactTag===", reactTag);
				//AccessibilityInfo.setAccessibilityFocus(reactTag);
				UIManager.dispatchViewManagerCommand(reactTag, UIManager.ScreenCapturePickerView.Commands.show, []);
			}

			([track] = stream.getVideoTracks());
			let appData = { source: 'screen', width: Dimensions.get("window").width, videoAspectRatio: this._videoAspectRatio }
			this._screenSharingProducer = await this._sendTransport.produce({ track, codec, appData });

			this._screenSharingProducer.on('transportclose', () => {
				console.log('screenShareDevices --- transportclose:');
				this._screenSharingProducer = null;
			});
			this._screenSharingProducer.on('trackended', () => {
				console.log('screenShareDevices --- trackended:');
			});
		}).catch((err) => {
			store.dispatch(notify({text:err.message}));
		});
	}

	/**
	 * 视频播放
	 */
	async updateVideoDevices() {
		if (this._closed) {
			return;
		}
		//视频信息相关
		const videoSettings = store.getState().setting.videoSettings;
		let cameraCodec = videoSettings && videoSettings.cameraCodec ? videoSettings.cameraCodec : "h264";

		const codec = this._device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === 'video/' + cameraCodec);
		const deviceId = await this._getVideoSourceId();
		const stream = await mediaDevices.getUserMedia({
			audio: false,
			video: {
				mandatory: {
					minWidth: 320,
					minHeight: 480,
					minFrameRate: 25
				},
				facingMode: (this._isFront ? "user" : "environment"),
				deviceId: deviceId
			}
		});


		store.dispatch(roomAction.setMyStream(stream));
		let track;
		([track] = stream.getVideoTracks());
		let appData = { source: 'webcam', width: Dimensions.get("window").width, videoAspectRatio: this._videoAspectRatio }
		try{
			// 会触发发送通道上的produce事件
			this._webVideoProducer = await this._sendTransport.produce({ track, codec, appData });

			store.dispatch(userAction.setVideoStatus(true))
			this._webVideoProducer.on('transportclose', () => {
				this._webVideoProducer = null;
			});

			this._webVideoProducer.on('trackended', () => { });
		}catch(err){
			console.log("Camera produce got error",err);
			this.disableVideo();
			store.dispatch(notify({text:err.message}));
		}
		
	}
	/**
	 * 获取视频设备id(分前置摄像头和后置摄像头)
	 */
	async _getVideoSourceId() {
		const devices = await mediaDevices.enumerateDevices();
		let videoDeviceId;
		for (let i = 0; i < devices.length; i++) {
			const device = devices[i];
			if (device.kind == "videoinput" && device.facing == (this._isFront ? "front" : "environment")) {
				videoDeviceId = device.deviceId;
			}
		}
		return videoDeviceId;
	}
	/**
	 * 获取音频设备id
	 */
	async _getAudioSourceId() {
		const devices = await mediaDevices.enumerateDevices();
		let videoDeviceId;
		for (let i = 0; i < devices.length; i++) {
			const device = devices[i];
			if (device.kind == "audioinput") {
				videoDeviceId = device.deviceId;
			}
		}
		return videoDeviceId;
	}
	/**
	 * 创建一个发送通道
	 */
	async createSendTransportBuild() {
		if (this._closed) {
			return;
		}
		const transportInfo = await this.sendRequest('createWebRtcTransport', { forceTcp: this._forceTcp, producing: true, consuming: false });
		const { id, iceParameters, iceCandidates, dtlsParameters } = transportInfo;
		this._sendTransport = this._device.createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters, iceServers: this._turnServers });
		// 第一次produce的时候触发，只触发一次
		this._sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
			try {
				// 和服务器端进行连接
				this.sendRequest('connectWebRtcTransport', { transportId: this._sendTransport.id, dtlsParameters });
				callback();
			} catch (error) {
				errback();
			}
		});

		// 每次produce的时候被调用，异常信息会在produce里抛出来
		this._sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
			try {
				if(kind == "audio"){
					this._lastSpeakTime = new Date().getTime();
				}
				const { id } = await this.sendRequest('produce', { transportId: this._sendTransport.id, kind, rtpParameters, appData });
				callback({ id });
			} catch (error) {
				errback(error);
			}
		});
	}
	/**
	 * 创建一个接收通道
	 */
	async createRecvTransportBuild() {
		if (this._closed) {
			return;
		}
		//请求服务器创建通道
		const transportInfo = await this.sendRequest('createWebRtcTransport', { forceTcp: this._forceTcp, producing: false, consuming: true });
		const { id, iceParameters, iceCandidates, dtlsParameters } = transportInfo;
		//创建一个本地通道
		this._recvTransport = this._device.createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters, iceServers: this._turnServers });
		//等待服务器端建立连接
		this._recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
			try {
				// 请求服务器端建立连接
				this.sendRequest('connectWebRtcTransport', { transportId: this._recvTransport.id, dtlsParameters });
				callback();
			} catch (error) {
				errback();
			}
		});
	}
	/**
	 * 重置会议室的状态
	 * 会议开始或者结束时调用
	 */
	resetRoom(){
		this.removePeers();
		store.dispatch(peerVolumeActions.clearPeerVolume());
		store.dispatch(roomAction.removeAllConsumerScreenStream());
		store.dispatch(roomAction.removeAllConsumerAudioStream());
		store.dispatch(roomAction.removeAllConsumerVideoStream());
		store.dispatch(roomAction.removeFullScreenStream());
		store.dispatch(roomAction.removeAllLobbyPeer());
		store.dispatch(roomAction.roomBtnStatus(true));
		store.dispatch(roomAction.roomMyStreamStatus(true));
		store.dispatch(roomAction.setMyStream());
		store.dispatch(roomAction.setMuteAll(false));
		store.dispatch(roomAction.setRecordingStatus(false));
		store.dispatch(userAction.setAudioStatus(false));
		store.dispatch(userAction.setVideoStatus(false));
	}

	/**
	 * 个人退出/离开会议
	 */
	async close(reason) {

		if (this._closed) { // 避免重复关闭
			return;
		}
		console.log("关闭会议,原因 ", reason);
		this._closed = true;
		if(this._appStateChangeSubscribe){
			this._appStateChangeSubscribe.remove();
		}else{
			console.log("ERROR:this._appStateChangeSubscribe null");
		}
		clearInterval(this._audoPauseTask);
		this.resetRoom();
		try {
			if (this._signalingSocket && !this._signalingSocket.closed) {
				this._signalingSocket.close();
				console.log("关闭信令通道");

			}

			if (this._sendTransport && !this._sendTransport.closed) {
				this._sendTransport.close();
				console.log("关闭媒体发送通道");
			}

			if (this._recvTransport && !this._recvTransport.closed) {

				this._recvTransport.close();
				console.log("关闭媒体接收通道");

			}
			if (this._whoosh) {
				this._whoosh.release();
			}

		} catch (e) { console.log("RoomClient Close got error", e) }
		this._navigation.goBack();
	}
	/**
	 * 结束会议
	 */
	async closeMeeting() {
		try {
			await this.sendRequest('moderator:closeMeeting');
		} catch (e) {
			console.log("closeMeeting got error", e);
		}
	}
	/**
	 * 删除会议成员
	 * 1. 第一次入会，初始化时，清空
	 * 2. 连接断开，清空
	 * 3. 离开会议时
	 */
	async removePeers() {
		store.dispatch(roomAction.clearPeer());
	}
	/**
	 * 关闭视频
	 */
	async disableVideo() {
		//console.log("disableVideo", this._webVideoProducer)
		try {
			store.dispatch(userAction.setVideoStatus(false));
			store.dispatch(roomAction.setMyStream(null));
			if(this._webVideoProducer){
				await this.sendRequest('closeProducer', { producerId: this._webVideoProducer.id });
			}
		} catch (error) {
			console.log('disableVideo.error', error)
		}
		this._webVideoProducer = null;
	}
	/**
	 * 关闭屏幕共享
	 */
	async disableScreenSharing() {

		if (!this._screenSharingProducer) {
			return;
		}
		this._screenSharingProducer.close();
		try {
			await this.sendRequest('closeProducer', { producerId: this._screenSharingProducer.id });
		} catch (error) { }
		this._screenSharingProducer = null;
	}
	/**
	 * 踢出某个人
	 * @param {*} peerId 
	 */
	async kickPeer(peerId) {
		try {
			console.log("踢出参会者", peerId);
			store.dispatch(roomAction.removerPeerById(peerId));
			await this.sendRequest('moderator:kickPeer', { peerId });
		} catch (error) { }
	}
	/**
	 * 全场静音
	 */
	async muteAllPeers() {
		//console.log("muteAllPeers-----start")
		try {
			await this.sendRequest('moderator:muteAll');
			store.dispatch(roomAction.setMuteAll(true));
		} catch (error) {
			//console.log("muteAllPeers-----error", error)
		}
	}
	/**
	 * 暂停某个人的consumer
	 * @param {} consumer 
	 */
	async consumerPause(consumer) {
		if (consumer.paused || consumer.closed) {
			return
		}
		// 1 先假定成功
		store.dispatch(roomAction.setConsumerStatus(consumer.id, 'mic', 'local', true));
		this.sendRequest('pauseConsumer', { consumerId: consumer.id })// 让服务端暂停发送
		.then(()=>{
			consumer.pause();// 本地暂停接收
		})
		.catch((error)=>{
			console.log("consumerPause ----- error", error);
			// 当做已关闭处理
			this.postConsumerClosed(consumer.id);
		});
	}
	/**
	 * 恢复某个人的consumer
	 * @param {*} consumer 
	 */
	async consumerResume(consumer) {
		if (!consumer.paused || consumer.closed){
			return;
		}
		store.dispatch(roomAction.setConsumerStatus(consumer.id, 'mic', 'local', false));
		this.sendRequest('resumeConsumer', { consumerId: consumer.id }) // 请求服务端继续发送
		.then(()=>{
			consumer.resume();// 本地恢复接收
		})
		.catch((error)=>{
			console.log("consumerResume ----- error", error);
			// 当做已关闭处理
			this.postConsumerClosed(consumer.id);
		});
		
	}
	/**
	 * 操作权限检查
	* @param {*} peer 
	* @param {*} permission 
	*/
	_hasPermission(peer, permission) {
		const { roleMap, peers } = store.getState().room;
		if (!roleMap) {
			return false;
		}
		peer = peer || this._peerId;
		var result = false;
		for (let i = 0; i < peers.length; i++) {
			const element = peers[i];
			if (element.id == peer && element.roles) {
				for (let j = 0; j < element.roles.length; j++) {
					const role = element.roles[j];
					if (role == roleMap[permission]?.id) {
						result = true;
					}
				}
			}
		}
		return result;
	}
	isMyself(peerId) {
		const { token } = store.getState().user;
		return (peerId == token);
	}
	/**
	 * 发送请求
	 * @param {*} method 
	 * @param {*} data 
	 */
	async sendRequest(method, data) {
		if (!data) {
			data = {};
		}
		if (!this._signalingSocket || this._signalingSocket.closed) {
			throw new Error("meeting signaling channel has closed");
		}
		try{
			return await this._signalingSocket.request(method, data);
		}catch(error){
			console.log("Send request",method,"width data",data,"Got error",error);
		}
	}
	/**
	 * 查询生产者的类型
	 * @param {*} producerId 
	 */
	getTypeForProducerId(producerId) {
		//麦克风，摄像头，屏幕分享
		//mic,webcam,screen
		let type = '';
		if (this._webVideoProducer && this._webVideoProducer.id == producerId) {
			type = 'webcam';
		} else if (this._screenSharingProducer && this._screenSharingProducer.id == producerId) {
			type = 'screen';
		} else if (this._micProducer && this._micProducer.id == producerId) {
			type = 'mic';
		}
		return {
			type: type,
			name: this.chineseNameByType(type)
		}
	}
	/**
	 * 根据媒体类型查中文名称
	 * @param {*} type 
	 */
	chineseNameByType(type) {
		if (type === 'screen') {
			return '屏幕分享';
		} else if (type === 'mic') {
			return '麦克风';
		} else if (type === 'webcam') {
			return '摄像头';
		} else {
			return '';
		}
	}
	/**
	 * 根据id查用户信息
	 * @param {*} id 
	 */
	getPeerInfoById(id) {
		const { peers } = store.getState().room;
		// let i = 0;
		// peers.map((item)=>{
		// 		console.log((++i)+'\t哈哈哈 参会人员', item.displayName+"\t",item.id);
		// });
		let peer = peers.find((item) => item.id == id);
		if (!peer) {
			return { displayName: "unKnown", id: "unKnown" };
		}
		return peer;
	}
	/**
	 * 房间取消锁定
	 */
	async unlockRoom() {
		//console.log('unlockRoom')
		try {
			await this.sendRequest('unlockRoom');
			store.dispatch(roomAction.setRoomUnLocked());
			store.dispatch(notify({ text: "会议已解锁" }));
		} catch (error) {
			store.dispatch(notify({ text: "权限不足，会议解锁失败" }));
		}
	}
	/**
	 * 房间锁定
	 */
	async lockRoom() {
		//console.log('lockRoom')

		try {
			await this.sendRequest('lockRoom');
			store.dispatch(roomAction.setRoomLocked());
			store.dispatch(notify({ text: "会议已锁定" }));
		} catch (error) {
			console.log('lockRoom.error', error)
			store.dispatch(notify({ text: "权限不足，会议锁定失败" }));
		}
	}

	/**
	 * 将某个人从游客提升到参会人员
	 * @param {*} peerId 
	 */
	async promoteLobbyPeer(peerId) {
		try {
			await this.sendRequest('promotePeer', { peerId });
		} catch (error) { }
	}
	/**
	 * 将所有客户端从游客提升到参会人员
	 */
	async promoteAllLobbyPeers() {

		try {
			await this.sendRequest('promoteAllPeers');
		} catch (error) {

		}
	}
	/**
	 * 恢复视频消费
	 * @param {Object} consumer 
	 */
	async requestConsumerKeyFrame(consumer) {
		try {
			await this.sendRequest('resumeConsumer', { consumerId: consumer.id });
			consumer.resume();
			await this.sendRequest('requestConsumerKeyFrame', { consumerId: consumer.id });
		} catch (e) {
			console.log('requestConsumerKeyFrame.error', e)
			store.dispatch(notify({ type: "error", text: "网络不稳定,请求视频画面出现错误:" + e.message }));
		}
	}
	async smallFullScreenRequest(consumer) {
		try {
			await this.sendRequest('pauseConsumer', { consumerId: consumer.id });
			consumer.pause();
		} catch (e) {
			console.log("smallFullScreenRequest got error",e);
		}
	}
	// getroomID(){
	// 	return "111";
	// }
}

export {
	RoomClient,
	// getroomID
}