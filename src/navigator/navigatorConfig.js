/**
 * * mode:页面切换模式：左右是card(相当于ios中的push效果)，上下是modal(相当于ios中的modal效果)
        * card:普通app常用的左右切换
        * modal:上下切换
    * headerMode:导航栏的显示模式：screen：有渐变透明效果，float:无透明效果，none:隐藏导航
        * float:无透明效果，默认
        * screen:有渐变透明效果，如微信QQ的一样
        * none:隐藏导航栏
    * headerBackTitleVisible: 提供合理的默认值以确定后退按钮标题是否可见，但如果要覆盖它，则可以使用true或false 在此选项中
        * fade-in-place:标题组件交叉淡入淡出而不移动，类似于ios的Twitter,Instagram和Facebook应用程序。这是默认值
        * uikit:ios的默认行为的近似值。headerTransitionPreset:指定在启用headerMode:float时header应如何从一个屏幕转换到另一个屏幕
    * cardStyle:样式 (ios上页面切换会有白色渐变蒙层，想去掉则可以这样设置，cardStyle:{opacity:null},切换页面时的页面边框也在这里可以设置)
    * onTransitionStart:页面切换开始时的回调函数（我们可以在这里注册一些通知，告知我们切换的状态，方便后面处理页面切换事件）
    * onTransitionEnd:页面切换结束时的回调函数
 */
export default {
    mode: "card",
    headerMode: 'none',
}