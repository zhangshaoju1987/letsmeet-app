export const setMyStream = (stream) => ({
    type: 'SET_MY_STREAM',
    payload: { stream }

});
export const setRoomIsOpenVideo = (isOpenVideo) => ({
    type: 'SET_ROOM_IS_OPEN_VIDEO',
    payload: { isOpenVideo }

});

export const setRoomIsOpenAudio = (isOpneAudio) => ({
    type: 'SET_ROOM_IS_OPEN_AUDIO',
    payload: { isOpneAudio }

});

export const addPeer = (peer) => ({
    type: 'ADD_PEER',
    payload: peer

});
export const clearPeer = () => ({
    type: 'CLEAR_PEER',
    payload: ''

});

export const setRoomActiveSpeaker = (peerid, volume) => ({
    type: 'SET_ACTIVE_SPEAKERS',
    payload: { peerid, volume }
})

export const removerPeerById = (id) => ({
    type: 'REMOVE_PEER_BY_ID',
    payload: id
})

export const addConsumerVideoStream = (consumerId, consumer) => ({
    type: 'ADD_CONSUMER_VIDEO_STREAM',
    payload: { consumerId, consumer }
})
export const removeConsumerVideoStream = (consumerId) => ({
    type: 'REMOVE_CONSUMER_VIDEO_STREAM',
    payload: { consumerId }
})

export const removeAllConsumerVideoStream = () => ({
    type: 'REMOVE_ALL_CONSUMER_VIDEO_STREAM',
    payload: { }
})

export const resetPeer = (peers) => ({
    type: 'RESET_PEERS',
    payload: { peers }
})

export const setMuteAll = (value) => ({
    type: 'SET_MUTEALL',
    payload: value
})

export const setRoleMap = (roleMap) => ({
    type: 'SET_ROLE_MAP',
    payload: { roleMap }
})

export const setRole = (roleId, peerId) => ({
    type: 'SET_ROLE',
    payload: { roleId, peerId }

});

export const setRoomTime = (time) => ({
    type: 'SET_ROOT_TIME',
    payload: { time }
});
/**
 * 添加一个参会记录
 * @param {Object} roomHistory 
 * @returns 
 */
export const addRoomHistory = (roomHistory) => ({
    type: 'ADD_ROOM_HISTORY',
    payload: roomHistory

});
/**
 * 移除一个参会记录
 * @param {String} roomId 
 * @returns 
 */
export const removeRoomHistory = (roomId) => ({
    type: 'REMOVE_ROOM_HISTORY',
    payload: roomId
})

/**
 * 添加一个参会记录
 * @param {Object} roomHistory 
 * @returns 
 */
 export const addMeetingSubject = (subject) => ({
    type: 'ADD_MEETING_SUBJECT',
    payload: subject

});
/**
 * 添加一个常规参会记录
 * @param {Object} roomHistory 
 * @returns 
 */
 export const addMeetingNormalSubject = (subject) => ({
    type: 'ADD_MEETINGNORMAL_SUBJECT',
    payload: subject

});

/**
 * 添加一个周期参会记录
 * @param {Object} roomHistory 
 * @returns 
 */
 export const addMeetingCyclitySubject = (subject) => ({
    type: 'ADD_MEETINGCYCLITY_SUBJECT',
    payload: subject

});
/**
 * 移除一个参会记录
 * @param {String} roomId 
 * @returns 
 */
export const removeMeetingSubject = (subject) => ({
    type: 'REMOVE_MEETING_SUBJECT',
    payload: subject
})
export const removeMeetingNormalSubject = (subject) => ({
    type: 'REMOVE_MEETINGNORMAL_SUBJECT',
    payload: subject
})
export const removeMeetingCyclitySubject = (subject) => ({
    type: 'REMOVE_MEETINGCYCLITY_SUBJECT',
    payload: subject
})
export const addProducerScores = (producerId, score) => ({
    type: 'ADD_PRODUCER_SCORES',
    payload: { producerId, score }
})
export const removeProducerScores = (producerId) => ({
    type: 'REMOVE_PRODUCER_SCORES',
    payload: { producerId }
})

export const addConsumerAudioStream = (consumerId, consumer) => ({
    type: 'ADD_CONSUMER_AUDIO_STREAM',
    payload: { consumerId, consumer }
})
export const removeConsumerAudioStream = (consumerId) => ({
    type: 'REMOVE_CONSUMER_AUDIO_STREAM',
    payload: { consumerId }
})
/**
 * 移除所有的音频流（一般用在开启会议或者退出会议时）
 * @returns 
 */
export const removeAllConsumerAudioStream = () => ({
    type: 'REMOVE_ALL_CONSUMER_AUDIO_STREAM',
    payload: { }
})
export const addConsumerScreenStream = (consumerId, consumer) => ({
    type: 'ADD_CONSUMER_SCREEN_STREAM',
    payload: { consumerId, consumer }
})
export const removeConsumerScreenStream = (consumerId) => ({
    type: 'REMOVE_CONSUMER_SCREEN_STREAM',
    payload: { consumerId }
})

/**
 * 移除所有的屏幕分享视频流（一般用在开启会议或者退出会议时）
 * @returns 
 */
export const removeAllConsumerScreenStream = () => ({
    type: 'REMOVE_ALL_CONSUMER_SCREEN_STREAM',
    payload: { }
})

export const setFullScreenStream = (stream) => ({
    type: 'SET_FULL_SCREEN_STREAM',
    payload: { stream }
});
export const removeFullScreenStream = () => ({
    type: 'REMOVE_FULL_SCREEN_STREAM',
    payload: {}
});

export const roomBtnStatus = (status) => ({
    type: 'ROOM_BTN_STATUS',
    payload: { status }
});

export const roomMyStreamStatus = (status) => ({
    type: 'ROOM_MY_STREAM_STATUS',
    payload: { status }
});

export const setConsumerStatus = (consumerId, type, originator, value) => ({
    type: 'SET_CONSUMER_STS',
    payload: { consumerId, type, originator, value }
});

export const setRoomUnLocked = () => ({
    type: 'ROOM_SET_UN_LOCKED',
    payload: {}
});
export const setRoomLocked = () => ({
    type: 'ROOM_SET_LOCKED',
    payload: {}
});
export const setWhiteboardShareServer = (url) => ({
    type: 'SET_WHITE_BOARD_SHARE_SERVER',
    payload: { url }
});
export const addLobbyPeer = (displayName, peerId) => ({
    type: 'ADD_LOBBY_PEER',
    payload: { displayName, peerId }
});
export const removeLobbyPeer = (peerId) => ({
    type: 'REMOVE_LOBBY_PEER',
    payload: { peerId }
});
export const removeAllLobbyPeer = () => ({
    type: 'REMOVE_ALL_LOBBY_PEER',
    payload: { }
});
export const addLobbyPeers = (peers) => ({
    type: 'ADD_LOBBY_PEERS',
    payload: { peers }
});
export const setRecordingStatus = (value) => ({
    type: 'SET_RECORDING_STATUS',
    payload: { value }
});
export const setRoomStatus = (value) => ({
    type: 'SET_ROOM_STATUS',
    payload: { value }
});