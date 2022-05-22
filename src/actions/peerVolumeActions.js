export const setPeerVolume = (peerId, volume) =>
	({
		type    : 'SET_PEER_VOLUME',
		payload : { peerId, volume }
	});
	// 清空音量信息,一般用户会议关闭和初始化时候
	export const clearPeerVolume = () =>
	({
		type    : 'CLEAR_PEER_VOLUME',
		payload : ""
	});

	// 删除用户的音量信息，一般用于用户静音了
	export const deletePeerVolume =(peerId) =>
	({
		type:"DELETE_PEER_VOLUME",
		payload:{peerId}
	})
