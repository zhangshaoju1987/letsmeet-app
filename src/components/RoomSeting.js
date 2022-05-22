import React from 'react';
import { StyleSheet,Text, View } from 'react-native';


export default class RoomSeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: {}
        }

    }

    componentWillUnmount() {
        //console.log("MeetingItem.js->unmount");
    }
    render() {
        
        return (
            <View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
   
})