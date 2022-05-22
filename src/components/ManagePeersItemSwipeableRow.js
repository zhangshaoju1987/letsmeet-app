import React, { Component } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as userAction from "../actions/userAction";
import { store } from "../store";
import { notify } from "../actions/requestActions";

export default class ManagePeersItemSwipeableRow extends Component {

  constructor(props) {
    super(props);
    this.state = {
      item: {}
    }

    this.props.item && (this.state.item = this.props.item);

  }
  renderRightAction = (text, color, x, progress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    const pressHandler = () => {
      this.close();
      //console.log("选择的元素" + this.state.item);
      switch (text) {
        case '踢出': {
          this.outRoom()
          break;
        }
        case '添加联系人':{
          this.addContract();
          break;
        }
        default:
          store.dispatch(notify({ text: "操作：" + text + " 功能还未开发,敬请期待!" }));   
      }
      
    };
    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton
          style={[styles.rightAction, { backgroundColor: color }]}
          onPress={pressHandler}>
          <Text style={styles.actionText}>{text}</Text>
        </RectButton>
      </Animated.View>
    );
  };
  renderRightActions = progress => (
    <View
      style={{
        width: 200,
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      }}>
      {this.renderRightAction('添加联系人', '#ffab00', 128, progress)}
      {this.renderRightAction('踢出', this.props.room._hasPermission('', 'PRESENTER') ? '#dd2c00' : '#C8C7CD', 64, progress)}
    </View>
  );
  updateRef = ref => {
    this._swipeableRow = ref;
  };
  close = () => {
    this._swipeableRow.close();
  };
  /**
   * 添加联系人
   */
  addContract(){
    const item = this.state.item;
    if(item.isMe){
      store.dispatch(notify({ type:"error",text: "不应该将自己加入联系人",timeout:3000 }));
      return ;
    }
    const contract = {displayName:item.displayName,mobile:item.mobile,label:"朋友",remark:item.displayName,meetingNo:item.meetingNo};
    store.dispatch(userAction.addContract(contract));
    //console.log( "添加联系人",this.state.item);
    store.dispatch(notify({ text: "成功添加 "+item.displayName+" 到联系人"+"\n注意：我们不搜集任何用户信息，通讯录只在本地存储，不会上传到服务器",timeout:5000 }));
  }
  outRoom() {
    if (!this.props.room._hasPermission('', 'PRESENTER')) {
      return
    }
    let id = this.state.item.id;
    this.props.room.kickPeer(id)

  }
  render() {
    const { children } = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={35}
        renderRightActions={this.renderRightActions}>
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  leftAction: {
    flex: 1,
    backgroundColor: '#497AFC',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});