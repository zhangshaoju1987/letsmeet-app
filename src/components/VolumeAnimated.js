import React from 'react'
import { StyleSheet, Animated, Easing, View } from 'react-native'
import { store } from "../store";
import ReactUnmountComponent from './ReactUmountComponent';
export default class VolumeAnimated extends ReactUnmountComponent {
    constructor(props) {
        super(props);
        this.width = this.props.width || 70;  //大小
        this.state = {
            peerId: "",
            volume: '',
            leftPartVolume: new Animated.Value(this.width / 2),
            rightPartVolume: new Animated.Value(0),
        }

        this.levelLength = 10;  //等级长度

        this.maxW = 0;

        this.level = 0; //音量等级

        this.state.peerId = props.peerId

        this.isEnd = false;


    }
    animate(volume) {
        // console.log('开始动画', volume)
        if (100 + volume > 0) {
            // this.state.leftPartVolume.setValue(this.width / 2);
            // this.state.rightPartVolume.setValue(0);
            this.level = Math.round((100 + volume * 1) / this.levelLength)
            this.maxW = parseInt(this.width / 2 * this.level / this.levelLength);
            const time = 200;
            Animated.parallel([
                Animated.timing(
                    this.state.leftPartVolume,
                    {
                        toValue: this.width / 2 - this.maxW,
                        duration: time,
                        easing: Easing.bounce,
                        useNativeDriver: false
                    }
                ),
                Animated.timing(
                    this.state.rightPartVolume,
                    {
                        toValue: this.maxW,
                        duration: time,
                        easing: Easing.bounce,
                        useNativeDriver: false
                    }
                )
            ]).start(() => {
                this.state.leftPartVolume.setValue(this.width / 2);
                this.state.rightPartVolume.setValue(0);
            });
        }
    }
    componentDidMount() {
        this.unsubscribe = store.subscribe(() => {
            let volume = -100;
            try {
                volume = store.getState().peerVolumes[this.state.peerId];
                this.setState({ volume })
            } catch (e) {

            }
        })
    }

    /**
     * 用来减少组件的不必要刷新，做的按需刷新
     * @param {*} nextProps 
     * @param {*} nextState 
     */
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.volume != nextState.volume) {
            this.animate(this.state.volume)
            return true
        }
        // console.log("VolumeAnimated触发重新渲染更新");
        return false;
    }

    componentWillUnmount() {
        this._unmount = true;
        this.unsubscribe();
    }

    render() {
        const size = this.width / 2;
        return (
            <View style={styles.box}>
                <View style={[styles.line, { width: size, }]}>
                    <Animated.View style={[styles.left, { marginLeft: this.state.leftPartVolume }]}>

                    </Animated.View>
                </View>
                <View style={[styles.line, { width: size, }]}>
                    <Animated.View style={[styles.right, { width: this.state.rightPartVolume }]}>

                    </Animated.View>
                </View>
            </View>

        )
    }
}

const styles = StyleSheet.create({
    box: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    line: {
        height: 2,
        overflow: 'hidden',
        position: 'relative'
    },
    left: {
        height: 2,
        backgroundColor: '#fff',

    },
    right: {
        height: 2,
        backgroundColor: '#fff',
    }
})