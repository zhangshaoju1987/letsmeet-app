import store from "../store";

const initialState = {
    login: false,
    phone: "",
    userName: "",
    userLogo: "",
    token: "",
    meetingNo: "",
    logoBackgroundColor: "",
    audioSts: true,
    videoSts: false,
    currentPage: 'Home',
    userId: '',
    isVip: false,
    vipInfo: null,
    currentUserType:'',
    userInfo:{},
    contracts:{} // 通讯录
}

const user = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_USER_LOGINSTS': {
            const { login } = action.payload;

            return { ...state, login };
        }
        case 'SET_USER_INFO':{
            const { userInfo } = action.payload;
            
            return { ...state, userInfo };
        }
        case 'SET_USER_PHONE': {
            const { phone } = action.payload;

            return { ...state, phone };
        }
        case 'SET_USER_NAME': {
            const { userName } = action.payload;

            return { ...state, userName };
        }
        case 'SET_USER_LOGO': {
            const { userLogo } = action.payload;

            return { ...state, userLogo };
        }
        case 'SET_USER_TOKEN': {
            const { token } = action.payload;

            return { ...state, token };
        }
        case 'SET_USER_MEETINGNO': {
            const { meetingNo } = action.payload;

            return { ...state, meetingNo };
        }
        case 'SET_USER_LOGO_BACKGROUND_COLOR': {
            const { color } = action.payload;

            return { ...state, logoBackgroundColor: color };
        }
        case 'SET_AUDIO_STS': {
            const { sts } = action.payload;

            return { ...state, audioSts: sts };
        }
        case 'SET_VIDEO_STS': {
            const { sts } = action.payload;

            return { ...state, videoSts: sts };
        }
        case 'SET_CURRENT_PAGE': {
            const { name } = action.payload;

            return { ...state, currentPage: name };
        }
        case 'SET_USER_ID': {
            const { userId } = action.payload;

            return { ...state, userId };
        }
        case 'SET_IS_Vip': {
            const { isVip } = action.payload;

            return { ...state, isVip };
        }
        case 'SET_Vip_INFO': {
            const { vipInfo } = action.payload;

            return { ...state, vipInfo };
        }
        case 'SET_CURRENT_USER_TYPE':{
            
            const { currentUserType } = action.payload;

            return { ...state, currentUserType };
        }
        case 'ADD_CONTRACT':{
            
            const { contract } = action.payload;
            console.log("添加联系人到store",contract);
            const userid = "_"+contract.mobile;
            if(!state.contracts){
                state.contracts = {};
            }
            state.contracts[userid] = contract; // 如果之前存在，将被覆盖
            return { ...state };
        }
        case 'REMOVE_CONTRACT_BY_MOBILE':{
            const { mobile } = action.payload;
            if(!mobile){
                return {...state};
            }
            const key = "_"+ mobile;
            let {contracts} = state;
            if(contracts && contracts[key]){
                delete contracts[key];
            }
            return { ...state, contracts };
        }
        case 'CLEAR_ALL_CONTRACTS':{
            
            let {contracts} = state;
            for(var x in contracts){
                delete contracts[x];
            }
            return { ...state, contracts:{} };
        }
        
        default:
            return state;
    }
}

export default user;