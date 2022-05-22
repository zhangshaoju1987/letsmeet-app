import React from 'react';

/**
 * 用来防止组件被卸载了，仍然调用setState的情况
 */
export default class ReactUnmountComponent extends React.Component {

    constructor(props){
        super(props);
        this._unmount = false;
    }
    setState(object){
        if(this._unmount){
            console.log("组件被卸载了，setState不应该被使用",object);
            return;
        }
        super.setState(object);
    }
}
