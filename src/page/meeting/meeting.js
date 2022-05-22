import React from 'react';
import { StyleSheet, Image, Dimensions, ScrollView, View, Text, Platform, DeviceEventEmitter } from 'react-native';
import { VIEWPADDING } from '../../configs/index';
import ManagePeers from '../../components/ManagePeers';
import { FAB } from 'react-native-paper';
import BottomSheet from 'reanimated-bottom-sheet';
import BottomSheetHeader from '../../components/BottomSheetHeader';
import Orientation from '@zhumi/react-native-orientation';
import Clipboard from '@react-native-community/clipboard';
import { notify } from "../../actions/requestActions";
import { RoomClient } from '../../utils/RoomClient';
import { store } from "../../store";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/MaterialIcons";
import VIForegroundService from '@voximplant/react-native-foreground-service';
import RoomPeerPart from "../../components/RoomPeerPart";
import InCallManager from '@zhumi/react-native-incall-manager';
import RoomFloatingBtnScreenShare from '../../components/RoomFloatingBtnScreenShare'
import RoomFloatingBtnVideos from '../../components/RoomFloatingBtnVideos'
import RoomFloatingBtnLobbyPeers from '../../components/RoomFloatingBtnLobbyPeers'
import RTCVideo from '../../components/RTCVideo'
import RTCVideoLoca from '../../components/RTCVideoLoca'
import * as roomAction from '../../actions/roomAction';
import RoomStatus from '../../components/RoomStatus';
import { ScreenCapturePickerView } from "@zhumi/react-native-webrtc";
import utils from "../../utils/utils";
import http from '../../services/axios';
import { Touchable } from '../../components/Touchable';

//计算底部导航top
const { height, width } = Dimensions.get('window');
const contentHeight = height - 270;
const bottomNavSize = width / 5 - 20;
//兼容华为手机下。屏幕高度跟设备高度不一致的情况
const fullScreenBoxHeight = Dimensions.get("screen").height;
function HookTopComponent() {
  const insets = useSafeAreaInsets();

  return <View style={{ paddingBottom: insets.top, backgroundColor: "#242529" }} />;
}
/**
 * 会议页面
 */
export default class Meeting extends React.Component {

  constructor(props) {
    super(props);
    this.exitBtnRef = React.createRef();
    this.peersListRef = React.createRef();
    this.complainRef = React.createRef();
    this.roomId = this.props.navigation.state.params.roomId || '';
    const displayName = this.props.navigation.state.params.displayName;
    this.create_user = this.props.navigation.state.params.create_user;
    /**
     * 是否是主持人
     */
     const {userName,userId } = store.getState().user;
    this.isPresident = store.getState().user.meetingNo == this.roomId ||userId == this.create_user;
    const { token, phone, meetingNo } = store.getState().user;
    this.me = {
      displayName:"我自己",
      id: token,
      mobile: phone,
      meetingNo: meetingNo,
      isMe: true,
      picture: null,
      raisedHand: false,
      raisedHandTimestamp: null,
      roles: [],
    }
    this.state = {
      joinAudio: false,
      joinVideo: false,
      produce: false,
      peers: [],
      type: "",
      complainBehavior:"",
      isShowManagePeers: false,
      roomName: '',
      hasScreenShare: false,
      isShowMore: false,
      roomTime: '00:00:00',
      showOutRoom: false,
      fabGroupVisible: true,
      streamOpacity: 0,
      streamFull: false,
      speakerFlag: true,
      roomBtnStatus: true,
      fullScreeenStream: null,
      stream: null,
      roomMyStreamStatus: true,
      locked: false,
      lobbyPeer: [],
      consumerScreenStreams: [],
      consumerVideoStreams: [],
      peerVolumes:{},// 用户的音量信息
      videoSts: false,
      audioSts: false,
      showRoomIdOrName: true,
      president:this.isPresident?this.me:{id:"president-id-wait",displayName:"主持人"}  // 会议发起人
    }
    //console.log("store.getState().setting.theme.color",store.getState().setting.theme.color);
    this.state.joinVideo = this.props.navigation.state.params.isOpenVideo || false;  //上一个页面传过来的是否开启视频

    this.state.type = this.props.navigation.state.params.type || 'JOIN';

    this.state.joinAudio = this.props.navigation.state.params.isOpenAudio;  //上一个页面传过来的是否开启音频

    this.state.roomName = this.props.navigation.state.params.roomName;

    this.state.speakerFlag = this.props.navigation.state.params.speakerFlag;
    /**
     * 初始化人员列表
     */
    this.state.peers = JSON.parse(JSON.stringify(store.getState().room.peers));
    /**
     * 会议信令服务器
     */
    this.meetingSignalingServer = this.props.navigation.state.params.meetingSignalingServer;

    if (this.state.joinVideo || this.state.joinAudio) {
      this.state.produce = true;
    }


    this.roomClient = new RoomClient({
                  displayName, produce: this.state.produce, 
                  autoPause:this.props.navigation.state.params.autoPause,
                  type: this.state.type, navigation: this.props.navigation, 
                  meetingSignalingServer: this.meetingSignalingServer });
    this.roomClient.join({ joinAudio: this.state.joinAudio, joinVideo: this.state.joinVideo, roomId: this.roomId, roomName: this.state.roomName });

    //use NativeEventEmitter instead of DeviceEventEmitter
    DeviceEventEmitter.addListener('Proximity', function (data) {
      //console.log("检测到靠近听筒:", data);
    });
    // 注意监听器里this的指向
    const meetingInstance = this;
    DeviceEventEmitter.addListener('WiredHeadset', function (data) {
      //console.log("检测到有线耳:", data);
      if (data.isPlugged) {
        meetingInstance.changeSpeakPhone(false);  // 耳机插入，切换听筒
      } else {
        meetingInstance.changeSpeakPhone(true);   // 切换扬声器
      }
    });
    
  }

  /**
   * 用来减少组件的不必要刷新，做的按需刷新
   * @param {*} nextProps 
   * @param {*} nextState 
   */
  shouldComponentUpdate(nextProps, nextState) {

    if(nextState.president.id != this.state.president.id){
      console.log("更新主持人",nextState.president);
      return true;
    }
    if (nextState.showRoomIdOrName != this.state.showRoomIdOrName) {
      return true;
    }
    if(nextState.complainBehavior != this.state.complainBehavior){
      return true;
    }
    // 判断参会人员:人数判断
    //console.log("curr.Peers=",this.state.peers.length,"next.Peers=",nextState.peers.length);
    if (nextState.peers.length != this.state.peers.length) {
      console.log("Peers size cause meeting update");
      return true;
    }
    // 判断参会人员:按顺序（从后往前）依次判断
    for (let i = this.state.peers.length - 1; i >= 0; i--) {
      const pCurr = this.state.peers[i];
      const pNext = nextState.peers[i];
      if (pCurr.id != pNext.id || pCurr.displayName != pNext.displayName) {
        console.log("Peers order cause meeting update");
        return true;
      }
    }
    // 判断音量
    if(Object.keys(nextState.peerVolumes).length != Object.keys(this.state.peerVolumes).length){
      console.log("peerVolumes size cause meeting update");
      return true;
    }
    // 判断音量
    // console.log("typeof ",nextState.peerVolumes)
    // for(let peerId in nextState.peerVolumes){
    //   const volumeNext = nextState.peerVolumes[peerId];
    //   const volumeCurr = this.state.peerVolumes[peerId];
    //   if(volumeNext != volumeCurr){
    //     console.log("Peers volumes cause meeting update");
    //     return true;
    //   }
    // }

    if (nextState.videoSts != this.state.videoSts) {
      console.log("videoSts");
      return true;
    }
    if (nextState.audioSts != this.state.audioSts) {
      console.log("audioSts");
      return true;
    }
    if (nextState.isShowMore != this.state.isShowMore) {
      console.log("isShowMore");
      return true;
    }
    if (nextState.isShowManagePeers != this.state.isShowManagePeers) {
      console.log("isShowManagePeers");
      return true;
    }
    if (nextState.fabGroupVisible != this.state.fabGroupVisible) {
      console.log("fabGroupVisible");
      return true;
    }
    if (nextState.hasScreenShare != this.state.hasScreenShare) {
      console.log("hasScreenShare");
      return true;
    }
    if (nextState.speakerFlag != this.state.speakerFlag) {
      console.log("speakerFlag");

      return true;
    }
    if (nextState.roomBtnStatus != this.state.roomBtnStatus) {
      console.log("roomBtnStatus",nextState.roomBtnStatus);
      return true;
    }
    if (nextState.roomMyStreamStatus != this.state.roomMyStreamStatus) {
      console.log("roomMyStreamStatus");
      return true;
    }
    if (nextState.locked != this.state.locked) {
      console.log("locked");
      return true;
    }
    let nextstreamId = nextState.stream ? nextState.stream.id : '';
    let thisstreamId = this.state.stream ? this.state.stream.id : '';
    if (nextstreamId != thisstreamId) {
      console.log("nextstreamId");

      return true;
    }
    let nextfullScreeenStreamId = nextState.fullScreeenStream ? nextState.fullScreeenStream.stream.id : '';
    let thisfullScreeenStreamId = this.state.fullScreeenStream ? this.state.fullScreeenStream.stream.id : '';
    if (nextfullScreeenStreamId != thisfullScreeenStreamId) {
      console.log("nextfullScreeenStreamId");
      return true;

    }
    if (nextState.lobbyPeer && this.state.lobbyPeer && (nextState.lobbyPeer.length != this.state.lobbyPeer.length)) {
      console.log("lobbyPeer");
      return true;
    }
    if (nextState.consumerScreenStreams && this.state.consumerScreenStreams && (nextState.consumerScreenStreams.length != this.state.consumerScreenStreams.length)) {
      console.log("consumerScreenStreams");
      return true;
    }
    if (nextState.consumerVideoStreams && this.state.consumerVideoStreams && (nextState.consumerVideoStreams.length != this.state.consumerVideoStreams.length)) {
      console.log("consumerVideoStreams");
      return true;
    }

    return false;
  }

  /**
   * 仅用于安卓，作用是让通话在用户切换app到后台后仍然能够保持
   */
  async startAndroidForegroundService() {
    if (Platform.OS !== 'android') {
      //console.log('Only Android platform is supported');
      return;
    }
    if (Platform.Version >= 26) {
      const channelConfig = {
        id: 'ForegroundServiceChannel',
        name: 'Notification Channel',
        description: 'Notification Channel for Foreground Service',
        enableVibration: false,
        importance: 2
      };
      await VIForegroundService.createNotificationChannel(channelConfig);
    }
    const notificationConfig = {
      id: 3456,
      title: 'Foreground Service',
      text: 'Foreground service is running',
      icon: 'ic_notification',
      priority: 0
    };
    if (Platform.Version >= 26) {
      notificationConfig.channelId = 'ForegroundServiceChannel';
    }
    await VIForegroundService.startService(notificationConfig);
    //console.log("Android申请后台服务成功(通话保持服务)");
  }

  /**
   * 仅用于安卓，作用是让通话在用户切换app到后台后仍然能够保持
   */
  async stopAndroidForegroundService() {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      await VIForegroundService.stopService();
      //console.log("Android停止台服务成功");
    } catch (err) { }

  }

  /**
   * 进行异步资源（定时任务，正在进行的请求）的清理工作
   */
  componentWillUnmount() {
    //console.log("meeting.js->unmount");
    this.setState = () => { };
    clearInterval(this.titleTroggle);
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      // 同一个事件可以存在多个监听器
      DeviceEventEmitter.removeAllListeners("Proximity");
      DeviceEventEmitter.removeAllListeners("WiredHeadset");
      // 防止非常规手段离开会议，比如手机侧滑退出界面
      this.roomClient.close("组件卸载,自己主动退出会议");
    } catch (e) {
      console.log("meeting.js->unmount---error", e);
    }
    // 停止后台保持服务
    this.stopAndroidForegroundService();
    // 停止来电管理服务
    InCallManager.stop();
    Orientation.lockToPortrait() //竖屏
  }

  /**
   * 绑定各种资源初始化工作
   */
  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      const { peers, roomBtnStatus, fullScreeenStream, stream, roomMyStreamStatus, locked, lobbyPeer, consumerScreenStreams, consumerVideoStreams } = store.getState().room;
      const { videoSts, audioSts } = store.getState().user;
      const peerVolumes = store.getState().peerVolumes;
      //console.log("触发订阅 store.Peers",peers.length,"meets.Peers",this.state.peers.length);
      const president = peers.find((value,index)=>value.meetingNo == this.roomId);
      if(president && this.state.president.id == "president-id-wait"){
        const obj = JSON.parse(JSON.stringify(president));
        this.setState({president:obj});
      }
      const newPeers = JSON.parse(JSON.stringify(peers||[]));
      this.setState({
        roomBtnStatus,
        fullScreeenStream,
        stream,
        roomMyStreamStatus,
        locked,
        videoSts,
        audioSts,
        peerVolumes:JSON.parse(JSON.stringify(peerVolumes||{})),
        // 需要采用克隆的方式返回新的对象，否则由于js的内存结构，将一直使用的是同一个对象，会导致组件的nextState和state一直保持一样
        peers: newPeers,
        lobbyPeer: utils.object2Array(lobbyPeer),
        consumerScreenStreams: utils.object2Array(consumerScreenStreams),
        consumerVideoStreams: utils.object2Array(consumerVideoStreams)
        
      });
      
    });
    // 仅安卓需要（申请可以后台运行，方便app切换到后台后，通话可以继续保持）
    this.startAndroidForegroundService();

    // 启动来电管理器，接管音频，视频的各种管理
    if (this.state.speakerFlag) {
      //console.log("启动来电管理服务，使用扬声器");
      InCallManager.start({ media: 'video' }); // video 默认是扬声器
      InCallManager.setForceSpeakerphoneOn(true);
    } else {
      //console.log("启动来电管理服务，使用听筒");
      InCallManager.start({ media: 'audio' });// audio 默认是听筒
      InCallManager.setForceSpeakerphoneOn(false);
    }

    // 入会前检查
    http.get("/meeting/user/query", { queryType: "start_meeting_check", queryParams: JSON.stringify({ token: encodeURI(store.getState().user.token) }) }, "meeting")
      .then(res => {
        try {
          if (res && !res.success) {
            store.dispatch(notify({ type: "error", text: res.message, timeout: 10000 }));
            this.roomClient.close("涉嫌违法");
          }
        } catch (e) { }
      })
      .catch(err => {
        console.log("meeting.js 网络异常", err);
        store.dispatch(notify({ type: "error", text: "出现网络异常:" + err.message }));
        this.roomClient.close("网络异常");
      });

    this.titleTroggle = setInterval(() => {
      this.setState({ showRoomIdOrName: !this.state.showRoomIdOrName });
    }, 20 * 1000);

  }

  /**
   * 显示成员列表
   * @returns 
   */
  async showManagePeers() {
    if (!this.peersListRef.current) {
      store.dispatch(notify({ text: "会议初始化中,请稍等" }));
      return;
    }
    this.peersListRef.current.snapTo(0);
  }
  async _handleVideoScreen() {
    if (this.state.videoSts) {
      this.roomClient.disableVideo()
    } else {
      this.roomClient.updateVideoDevices()
    }
  }
  async _handleAudioScreen() {
    if (this.state.audioSts) {
      this.roomClient.pauseAudio();
    } else {
      this.roomClient.resumeAudio();
    }
  }
  async closeScreenShareDevices() {
    this.roomClient.disableScreenSharing();
    this.setState({ hasScreenShare: false })
    store.dispatch(roomAction.roomMyStreamStatus(true))
  }

  async screenShareDevices() {

    this.roomClient.screenShareDevices({ iosScreenRecorder: this.recordComponent });
    this.setState({ hasScreenShare: true });
    store.dispatch(roomAction.roomMyStreamStatus(false));
  }
  /**
   * 分情况处理退出逻辑
   * @param {*} label 
   * @returns 
   */
  async pickOption(label) {


    if (label == 'close') {
  
      this.exitBtnRef.current?.snapTo(1);
      await this.roomClient.close("自己主动离开会议");

    } else if (label == 'out') {
      
      store.dispatch(notify({ text: "会议即将关闭,感谢参与" }));
      this.exitBtnRef.current?.snapTo(1);
      await this.roomClient.closeMeeting();
      this.props.navigation.goBack();

    } else if (label == "cancel") {
      
      this.exitBtnRef.current?.snapTo(1);
      
    }
  }
  /**
   * 显示关闭按钮组
   */
  async showRoomClose() {
    if (!this.exitBtnRef.current) {
      store.dispatch(notify({ text: "会议初始化中,请稍等" }));
      return;
    }
    this.exitBtnRef.current.snapTo(0);
  }
  /**
   * 扬声器/听筒切换
   * @param {Bool} loudspeaker 
   */
  changeSpeakPhone(loudspeaker) {
    //loudspeaker；true扬声器，false，耳机
    //console.log('设置扬声器状态:', loudspeaker, "当前状态:", this.state.speakerFlag);
    try {
      InCallManager.setForceSpeakerphoneOn(loudspeaker);
      this.setState({ speakerFlag: loudspeaker });
      if(loudspeaker == false){
        store.dispatch(notify({timeout:8000, text: "已切换到耳机/听筒模式\n1.此模式下靠近听筒会触发息屏\n2.远离即可恢复正常,无需担心" }));
      }
    } catch (err) {
      console.error("设置扬声器出现异常:", err);
    }
  }

  showMore() {
    this.setState({ isShowMore: true });
  }

  /**
   * 复制pc端的链接给用用户
   */
  copyPCLink() {
    const link =
      `民商数科 柠檬会议

个人电脑入会
会议名称:${this.roomClient.roomName}
https://meeting.msokd.com/${this.roomId}

无需下载软件!
推荐使用最新版本Edge,Chrome浏览器
其他浏览器可能存在兼容性问题`;
    Clipboard.setString(link);
    store.dispatch(notify({ text: "已复制\n粘贴发送给其他参会人员.", timeout: 5000 }));
  }

  troggleLock() {
    if (this.state.locked) {
      this.roomClient.unlockRoom();
    } else {
      this.roomClient.lockRoom();
    }
  }
  render() {
    //console.log('render---',)
    return (
      <View style={[styles.root]}>
        <HookTopComponent />
        <View style={[styles.nav, {}]}>
          <View>
            <RoomStatus />
          </View>
          <Touchable onPress={() => { this.setState({ showRoomIdOrName: !this.state.showRoomIdOrName }) }} >
            <Text style={{ color: "white" }}>{this.state.showRoomIdOrName ? this.roomId : this.roomClient.roomName}</Text>
          </Touchable>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', }}>

            <Icon
              name={this.state.speakerFlag ? 'volume-up' : 'headset'}
              size={25}
              color="#fff"
              style={{ paddingRight: 15 }}
              onPress={this.changeSpeakPhone.bind(this, !this.state.speakerFlag)}
            />

            {
              this.isPresident &&
              <Icon
                name={!this.state.locked ? 'lock-open' : 'lock-outline'}
                size={25}
                color="#fff"
                style={{ paddingRight: 15 }}
                onPress={this.troggleLock.bind(this)}
              />
            }

            <Icon
              name={'power-settings-new'}
              size={25}
              color="#fff"
              onPress={this.showRoomClose.bind(this)}
            />
          </View>

        </View>

        <ScrollView style={[styles.content,]} >
          {
            !this.state.hasScreenShare && (
              <View style={[styles.contentAudio, {}]}>
                <View style={styles.meetingAdmin}>
                  {
                    this.state.president.id != "president-id-wait" && <RoomPeerPart peer={this.state.president} />
                  }
                </View>
                <ScrollView style={[styles.meetingPeersScrollview, { height: contentHeight }]}>
                  <View style={styles.meetingPeersContent}>
                    {
                      // 优先展示自己
                    }
                    {
                      this.state.peers.length>0 && 
                      <RoomPeerPart peer={this.me} style={{margin:8}}/>
                    }
                    {
                      // 其次展示当前说话的人
                    }
                    {
                      Object.keys(this.state.peerVolumes).length > 0 && Object.keys(this.state.peerVolumes).map((peerId,idx)=>{

                        const peer = this.state.peers.find((value)=>{return value.id == peerId})
                        return (
                          peer && 
                          <RoomPeerPart peer={peer} key={idx} style={{margin:8,borderWidth:1,borderColor:store.getState().setting.theme.color}}/>
                        )
                      })
                    }
                    {
                      // 展示所有其他参会者（包括当前说话的人）
                    }
                    {
                      this.state.peers.map((item, idx) => {
                        return (
                          <RoomPeerPart peer={item} key={idx} style={{margin:8}}/>
                        )
                      })
                    }

                  </View>
                </ScrollView>
              </View>
            )
          }

          {/* 自己屏幕分享 */}
          {
            this.state.hasScreenShare && (
              <View style={[styles.contentAudio, styles.screenShare]}>
                <Text style={styles.screenShareText}>屏幕共享中...</Text>
                <Touchable onPress={this.closeScreenShareDevices.bind(this)}>
                  <View style={styles.screenShareImgBox}>
                    <Image
                      style={styles.screenShareImg}
                      source={require('../../assets/images/screenShare.png')}
                    />
                    <Text style={styles.screenShareColoeText}>停止共享</Text>
                  </View>
                </Touchable>
              </View>
            )
          }
        </ScrollView>
        {
          Platform.OS === "ios" &&
          <ScreenCapturePickerView ref={(comp) => { this.recordComponent = comp }} />
        }
        <FAB
          icon={this.state.audioSts ? 'microphone' : 'microphone-off'}
          small={false}
          style={[styles.fabstyle1,]}
          color={'#767678'}
          animated={true}
          visible={this.state.roomBtnStatus}
          onPress={this._handleAudioScreen.bind(this)}
        />
        <FAB
          icon={this.state.hasScreenShare ? 'laptop' : 'laptop-off'}
          style={[styles.fabstyle2,]}
          color={'#767678'}
          animated={true}
          visible={this.state.roomBtnStatus}
          onPress={this.screenShareDevices.bind(this)}
        />
          <FAB
            icon={'account-group'}
            style={[styles.fabstyle3,]}
            color={'#767678'}
            animated={true}
            visible={this.state.roomBtnStatus}
            onPress={this.showManagePeers.bind(this)}
          />

        {
          this.state.roomBtnStatus &&
          <BottomSheet
            ref={this.peersListRef}
            snapPoints={this.isPresident ? [650, 0] : [602, 0]}
            renderHeader={() => (<BottomSheetHeader />)}
            renderContent={() => (<ManagePeers roomId={this.roomId} room={this.roomClient} />)}
            initialSnap={1}
            onOpenEnd={() => {
              this.setState({ fabGroupVisible: false });
              store.dispatch(roomAction.roomMyStreamStatus(false));
            }}
            onCloseEnd={() => {
              this.setState({ fabGroupVisible: true });
              store.dispatch(roomAction.roomMyStreamStatus(true));

            }}
            enabledInnerScrolling={true}
          />
        }
        {
          this.state.roomBtnStatus &&
          <BottomSheet
            ref={this.exitBtnRef}
            renderHeader={() => (<BottomSheetHeader />)}
            renderContent={() => (
              <View style={styles.panel}>
                <Touchable onPress={this.pickOption.bind(this, 'close')}>
                  <View style={[styles.panelButton, { backgroundColor: store.getState().setting.theme.color }]}>
                    <Text style={styles.panelButtonTitle}>离开会议</Text>
                  </View>
                </Touchable>
                <Touchable onPress={this.pickOption.bind(this, 'cancel')}>
                  <View style={[styles.panelButton, { backgroundColor: store.getState().setting.theme.color }]}>
                    <Text style={styles.panelCancelButtonTitle}>取消</Text>
                  </View>
                </Touchable>
                <View style={{ backgroundColor: "#fff", height: 30, width: "100%" }}>
                </View>
              </View>
            )}
            snapPoints={[180, 0]}
            onOpenEnd={() => {
              this.setState({ fabGroupVisible: false });
            }}
            onCloseEnd={() => {
              this.setState({ fabGroupVisible: true });
            }}
            initialSnap={1}
            enabledContentGestureInteraction={false}
            enabledHeaderGestureInteraction={true}
            enabledInnerScrolling={false}
          />
        }

        {/* 屏幕共享--查看按钮 */}
        {
          this.state.consumerScreenStreams && this.state.consumerScreenStreams.length > 0 && 
          <RoomFloatingBtnScreenShare consumerScreenStreams={this.state.consumerScreenStreams} roomClient={this.roomClient} />
        }

        {/* 视频--查看按钮 */}
        {
          this.state.consumerVideoStreams && this.state.consumerVideoStreams.length > 0 && 
          <RoomFloatingBtnVideos consumerVideoStreams={this.state.consumerVideoStreams} roomClient={this.roomClient}/>
        }

        {/* 游客展示 */}
        {
          this.state.lobbyPeer && this.state.lobbyPeer.length > 0 && <RoomFloatingBtnLobbyPeers />
        }

        {/* 最大化展示视频或者屏幕共享 */}
        {
          this.state.fullScreeenStream && 
          <RTCVideo roomClient={this.roomClient} micStatus={this.state.audioSts} stream={this.state.fullScreeenStream} style={styles.fullScreenBox} full={true} />
        }

        {/* 自己开启视频 */}
        {
          this.state.stream && this.state.roomMyStreamStatus &&
          <RTCVideoLoca stream={this.state.stream} style={styles.myStream} />
        }
      </View>
    );
  }
}
const styles = StyleSheet.create({
  myStream: {
    width: width / 4,
    height: height / 5.5,
    zIndex: 99
  },
  panel: {
    padding: 10,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5
  },
  panelButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  panelButtonLast: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 30
  },
  panelCancelButtonTitle: {
    fontSize: 15,
    color: '#ffffff',
  },
  panelButtonTitle: {
    fontSize: 15,
    color: '#fff',
  },
  panelCloseButtonTitle: {
    fontSize: 15,
    color: 'red',
  },
  fabGroupStyle: {
    paddingBottom: 100
  },
  fabstyle1: {
    backgroundColor: '#ccc',
    position:"absolute",
    bottom:50,
    left:Dimensions.get("window").width/5,
  },
  fabstyle2: {
    backgroundColor: '#ccc',
    position:"absolute",
    bottom:50,
    left:Dimensions.get("window").width/2.3,
  },
  fabstyle3: {
    backgroundColor: '#ccc',
    position:"absolute",
    bottom:50,
    right:Dimensions.get("window").width/5,
  },
  header: {
    backgroundColor: '#fff',
    shadowColor: '#000000',
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00000040',
    marginBottom: 10,
  },
  accountGroupbadgeStyle: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 9999999
  },
  fabstyleBox: {
    width: bottomNavSize,
    height: bottomNavSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent:"center",
  },
  bottom: {
    height: 60,
    width: '100%',
    paddingLeft: VIEWPADDING,
    paddingRight: VIEWPADDING,
    position: 'absolute',
    left: 0,
    bottom: 30,
    zIndex: 10,
    paddingBottom: 20,
  },
  screenShare: {
    paddingTop: 100,
  },
  screenShareImgBox: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  screenShareColoeText: {
    color: '#fff',
    fontSize: 12,
  },
  screenShareImg: {
    width: 40,
    height: 40,
  },
  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: VIEWPADDING,
    paddingRight: VIEWPADDING,
    paddingTop: 10,
    backgroundColor: '#242529',
    paddingBottom: 15,
  },
  textContent: {
    color: '#fff',
    fontSize: 16.5,
  },
  root: {
    backgroundColor: '#293129',
    position: 'relative',
    height: "100%",
    // flex: 1
  },
  meetingAdmin: {
    width: "100%",
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10
  },
  meetingPeersScrollview: {
    width: '100%',
  },
  meetingPeersContent: {
    flexWrap: "wrap",
    flexDirection: 'row',
    paddingLeft: 50,
  },
  content: {
    width: width,
    height: height,
    overflow: 'hidden',
    position: 'relative',
  },

  contentAudio: {
    marginTop: 10
  },
  screenShareText: {
    color: '#fff',
    textAlign: 'center',
    paddingTop: 100,
    fontSize: 16
  },
  fullScreenBox: {
    width: width,
    height: fullScreenBoxHeight,
    backgroundColor: '#293129',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9,
  },
  WebViewRenderHeadnav: {
    paddingTop: VIEWPADDING / 2,
    paddingBottom: VIEWPADDING / 2,
    paddingLeft: VIEWPADDING,
    paddingRight: VIEWPADDING,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  WebViewRenderHeadtext: {
    fontSize: 15,
  }
});
