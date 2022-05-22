//
//  RecordComponent.swift
//
//  Created by zhangshaoju on 2021/2/20.
//

import Foundation
import ReplayKit

// objc 注解的作用：对oc文件可见
@objc(RecordComponent)
class RecordComponent:RCTViewManager{
  
  override func view() -> UIView! {
    print("RCTViewManager====================");
    if #available(iOS 12.0, *){
      let pickerView = RPSystemBroadcastPickerView(
        frame:CGRect(x:0,y:0,width:50,height:50)
      )
      pickerView.translatesAutoresizingMaskIntoConstraints = false;
      pickerView.showsMicrophoneButton = false;// 不显示麦克风按钮，默认不使用麦克风
      pickerView.preferredExtension = "com.mssk.Meet.ScreenRecordExt";// 只显示我们自己的app
      if let button = pickerView.subviews.first as? UIButton{
        button.imageView?.tintColor = UIColor.red
      }
      
      return pickerView;
    }else{
      let label = UILabel();
      label.text = "屏幕录制不支持";
      return label;
    }
  }
}
