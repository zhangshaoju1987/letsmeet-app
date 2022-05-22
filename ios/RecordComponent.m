//
//  RecordComponent.m
//
//  Created by zhangshaoju on 2021/2/20.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RecordComponent,RCTViewManager)

/**
 解除警告
 it overrides init but doesn't implement ``requiresMainQueueSetup`.
 In a future release React Native will default to initializing all native modules on a background thread unless explocitly opted-out of
 */
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
