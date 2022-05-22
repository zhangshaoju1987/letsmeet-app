import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import UserLogo from '../components/UserLogo';
import VolumeAnimated from '../components/VolumeAnimated';

const { width } = Dimensions.get('window');
const logoBoxSiz = parseInt(width / 5);
export default class RoomPeerPart extends React.Component {
	constructor(props) {
		super(props);
	}
	componentWillUnmount() {
		this.setState = () => {};
	}
	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.peer.displayName != this.props.peer.displayName) {
			return true;
		}
		if (nextProps.peer.id != this.props.peer.id) {
			return true;
		}
		return false;
	}
	render() {
		return (
			<View style={[styles.logoBox,this.props.style||{}]}>
				<View>
					<View style={styles.logoBoxImgBox}>
						<UserLogo size={42} userName={this.props.peer.displayName || "暂无"} />
					</View>
					<Text style={styles.logoBoxText}>{this.props.peer.displayName || "暂无"}</Text>
					{
						// 由于音频波形图展示cpu消耗太大,暂时注释掉,等后期有更好的方案
						// <VolumeAnimated peerId={this.props.peer.id} width={logoBoxSiz} />
					}
				</View>
			</View>

		);
	}
}

const styles = StyleSheet.create({

	logoBox: {
		width: logoBoxSiz,
		height: logoBoxSiz,
		textAlign: 'center',
		paddingBottom: 8,
		paddingTop: 8,
		position: 'relative',
		overflow: 'hidden',
	},
	logoBoxImgBox: {
		width: '100%',
		alignItems: 'center',
	},

	logoBoxText: {
		textAlign: 'center',
		color: '#fff',
		marginTop: 8,
		fontSize: 12
	}
});