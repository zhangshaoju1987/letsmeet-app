import React, { Component } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { store } from "../store";
import { notify } from "../actions/requestActions";
import * as userAction from "../actions/userAction";


export default class ContractItemSwipeableRow extends Component {

  /**
   * 删除联系人
   * @param {Object} contract
   */
  doRemoveContract(contract){
    store.dispatch(userAction.removeContractByMobile(contract.mobile));
    store.dispatch(notify({text:"移除成功"}));
  }
  /**
   * 拨打电话
   * @param {Object} contract 
   */
  doDial(contract){
    if(!contract.mobile){
      store.dispatch(notify({"text":"该联系人缺失手机号",type:"error"}));
      return;
    }
  }


  renderRightAction = (text, color, x, progress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    const pressHandler = () => {
      this.close();
      console.log("Swipeable列表元素："+ this.props.item.mobile);
      if(text === "移除"){
        this.doRemoveContract(this.props.item);
        return;
      }
      if(text === "通话"){
        this.doDial(this.props.item);
        return
      }
      store.dispatch(notify({text:"操作："+text+" 功能还未开发"}));
    };
    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={pressHandler}>
          <Text style={styles.actionText}>{text}</Text>
        </RectButton>
      </Animated.View>
    );
  };
  renderRightActions = progress => (
    <View
      style={{
        width: 192,
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      }}>
      {this.renderRightAction('通话', '#ffab00', 128, progress)}
      {this.renderRightAction('移除', '#dd2c00', 64, progress)}
    </View>
  );
  updateRef = ref => {
    this._swipeableRow = ref;
  };
  close = () => {
    this._swipeableRow.close();
  };
  render() {
    const { children } = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={30}
        rightThreshold={40}
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