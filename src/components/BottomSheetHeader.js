import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native';

/**
 * 通用的BottomSheet头部
 */
export default class BottomSheetHeader extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        
			return (
				<View style={styles.header}>
                    <View style={styles.panelHeader}>
                        <View style={styles.panelHandle} />
                    </View>
                </View>
			);
    }
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#fff',
        shadowColor: '#000000',
        paddingTop: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    panelHeader: {
        alignItems: 'center',
    },
    panelHandle: {
        width: 40,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00000040',
        marginBottom: 10,
    }
})