export const setUserLoginSts = (login) => ({
    type: 'SET_USER_LOGINSTS',
    payload: { login }

});
export const setUserInfo = (userInfo) => ({
    type: 'SET_USER_INFO',
    payload: { userInfo }

});
export const setUserPhone = (phone) => ({
    type: 'SET_USER_PHONE',
    payload: { phone }

});
export const setUserName = (userName) => ({
    type: 'SET_USER_NAME',
    payload: { userName }

});
export const setUserLogo = (userLogo) => ({
    type: 'SET_USER_LOGO',
    payload: { userLogo }

});
export const setUserToken = (token) => ({
    type: 'SET_USER_TOKEN',
    payload: { token }

});
export const setUserMeetingNo = (meetingNo) => ({
    type: 'SET_USER_MEETINGNO',
    payload: { meetingNo }

});

export const setUserLogoBackgroundColor = (color) => ({
    type: 'SET_USER_LOGO_BACKGROUND_COLOR',
    payload: { color }

});

export const setAudioStatus = (sts) => ({
    type: 'SET_AUDIO_STS',
    payload: { sts }

});
export const setVideoStatus = (sts) => ({
    type: 'SET_VIDEO_STS',
    payload: { sts }

});

export const setCurrentPage= (name) => ({
    type: 'SET_CURRENT_PAGE',
    payload: { name }

});

export const setUserId= (userId) => ({
    type: 'SET_USER_ID',
    payload: { userId }

});

export const setIsVip= (isVip) => ({
    type: 'SET_IS_Vip',
    payload: { isVip }

});

export const setVipInfo= (vipInfo) => ({
    type: 'SET_Vip_INFO',
    payload: { vipInfo }

});
export const setCurrentUserType= (currentUserType) => ({
    type: 'SET_CURRENT_USER_TYPE',
    payload: { currentUserType }

});

/**
 * 添加一个联系人
 * @param {Object} contract 联系人信息
 * @returns 
 */
 export const addContract = (contract) => ({
    type: 'ADD_CONTRACT',
    payload: {contract}

});

/**
 * 根据手机号删除联系人
 * @param {Object} contract 联系人信息
 * @returns 
 */
 export const removeContractByMobile = (mobile) => ({
    type: 'REMOVE_CONTRACT_BY_MOBILE',
    payload: {mobile}

});

/**
 * 清空通讯录
 * @param {Object}
 * @returns 
 */
 export const clearAllContracts = () => ({
    type: 'CLEAR_ALL_CONTRACTS',
    payload: {}

});







