import React from 'react';
import { StyleSheet, Image, ScrollView, View, Text, } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { Button, List } from 'react-native-paper';
import { VIEWPADDING } from '../../configs/index';

import { store } from "../../store";
import { notify } from "../../actions/requestActions";
import * as settingsActions from "../../actions/settingsActions";

import HeadNav from '../../components/HeadNav'


export default class Setting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            phone: "",
            userName: "",
            meetingNo: ''
        }

    }
    componentWillUnmount() {
        
    }

    componentDidMount() {

    }

    render() {

        return (

            <View style={styles.main}>
                <HeadNav title='设置' leftPrass={() => this.props.navigation.navigate('User')} />
                <List.AccordionGroup>
                    <List.Accordion title="主题色" id="1">
                        <List.Item title="Item 1" />
                    </List.Accordion>
                   
                </List.AccordionGroup>
            </View >
        )
    }

}
const styles = StyleSheet.create({
    main: {
        backgroundColor: '#fff'
    },
})
