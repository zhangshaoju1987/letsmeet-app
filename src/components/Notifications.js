import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Snackbar from 'react-native-snackbar';
import * as notificationActions from '../actions/notificationActions';


class Notifications extends Component
{
	displayed = [];

	lastShowTime = -1;
	storeDisplayed = (id) =>
	{
		this.displayed = [ ...this.displayed, id ];
	};

	shouldComponentUpdate({ notifications: newNotifications = [] })
	{
		const { notifications: currentNotifications } = this.props;

		let notExists = false;

		for (let i = 0; i < newNotifications.length; i += 1)
		{
			if (notExists) continue;

			notExists = notExists ||
				!currentNotifications.filter(({ id }) => newNotifications[i].id === id).length;
		}

		return notExists;
	}

	componentDidUpdate()
	{
		const { notifications = [] } = this.props;
		
		notifications.forEach((notification) =>
		{
			// 忽略已经展示的
			if (this.displayed.includes(notification.id)) return;
			
			// 展示
			//console.log("展示消息：",notification.id);
			const theme = {};
			if(notification.type === 'error'){
				theme.backgroundColor = '#F8BC31'
			}

			// 确保是字符串(保护性措施)
			let text = notification.text;
			if( text && typeof text === "object"){
				console.error("检测到非法对象类型数据（说明调用存在问题）："+text);
				text = JSON.stringify(text);
				
			}
			// 最多只显示64个字符，防止字符太多导致UI异常展示(保护性措施)
			let maxLen = 64;
			if(text && text.length > maxLen){
				text = text.substr(0,maxLen);
			}

			const now = new Date().getTime();
			const elipsed = now - this.lastShowTime;
			const interval = 1500;// 1.5s内不重复展示，防止意外情况导致的高频Notification(保护性措施)
			//console.log("elipsed=",elipsed+",interval=",interval,"now=",now,"lastShowTime=",this.lastShowTime);
			//if(this.lastShowTime === -1 || elipsed > interval){
				Snackbar.show({
					text,
					duration: notification.timeout,
					textColor: notification.textColor || '#fff',
					backgroundColor: notification.backgroundColor || theme.backgroundColor || '#1A1915',
					numberOfLines:5,
					action: {
						text: '知道了',
						textColor: '#fff',
						onPress: () => { /* Do something. */ },
					  },
				});
				this.lastShowTime = now; // 重置上一次展示的时间
			//}
			

			// 保存到已展示
			this.storeDisplayed(notification.id);
			// 从store移除
			//console.log("删除消息：",notification.id);
			this.props.removeNotification(notification.id);
		});
	}

	render()
	{
		return null;
	}
}

Notifications.propTypes =
{
	notifications      : PropTypes.array.isRequired,
	removeNotification : PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
	({
		notifications : state.notifications
	});

const mapDispatchToProps = (dispatch) =>
	({
		removeNotification : (notificationId) =>
			dispatch(notificationActions.removeNotification({ notificationId }))
	});

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.notifications === next.notifications
			);
		}
	}
)(Notifications);