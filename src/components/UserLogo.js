import React from 'react';
import { Avatar } from 'react-native-paper';
import { store } from "../store";
import utils from '../utils/utils';

export default class UserLogo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logoBoxSiz: 35,
            logoBackgroundColor: ""        
        }
        let userName = this.props.userName;
        const myUserName = store.getState().user.userName;
        
        if(!userName){
            userName = myUserName || "您好";
        }
        this.state.userName = userName || myUserName;
        this.state.logoBackgroundColor = utils.getColorByUsername(userName.substr(0, 1));
        this.props.size && (this.state.logoBoxSiz = this.props.size);

    }

    /**
     * 用来减少组件的不必要刷新，做的按需刷新
     * @param {*} nextProps 
     * @param {*} nextState 
     */
    shouldComponentUpdate(nextProps, nextState){

        if(this.state.userName == nextState.userName){
            
            return false;
        }

        console.log("UserLogo触发重新渲染更新");

        return true;
    }
    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            const {userName} = store.getState().user
            if(! this.props.userName && userName){
                this.setState({ 
                    userName,
                    logoBackgroundColor:utils.getColorByUsername(userName.substr(0, 1))
                });
            }
            
        })
    }

    componentWillUnmount() {
        this.unsubscribe();
    }
    render() {
        const size = this.state.logoBoxSiz;
        const style = this.props.style || {}
        return (
            <Avatar.Text size={size} 
                label={this.state.userName && this.state.userName.substr(0, 1)}
                color={'#fff'} 
                style={[{ backgroundColor: this.state.logoBackgroundColor },style]} />
        )
    }
}