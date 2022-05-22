import React from 'react';
import { StyleSheet, Text, } from 'react-native';
import { store } from "../store";
import * as roomAction from '../actions/roomAction';



export default class RoomTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomTime: '00:00:00'
        }
    }

    componentWillUnmount() {
        console.log('componentWillUnmount.RoomTime')
        this.unsubscribe();
    }
    shouldComponentUpdate(nextProps, nextState) {
        if ((nextState.roomTime != this.state.roomTime)) {
            return true;
        }
        return false
    }

    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            const { time } = store.getState().room;
            this.setState({
                roomTime: time,
            })
        })
    }


    streamControlAnimate() {

    }

    render() {
        return (
            <Text style={styles.textContent}>{this.state.roomTime}</Text>
        );
    }
}

const styles = StyleSheet.create({
    textContent: {
        color: '#fff',
        fontSize: 15,
        marginTop:5
    }
})