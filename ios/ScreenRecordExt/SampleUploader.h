#import <Foundation/Foundation.h>
#import <ReplayKit/ReplayKit.h>

NS_ASSUME_NONNULL_BEGIN

@class SocketConnection;

@interface SampleUploader : NSObject

@property (nonatomic, assign, readonly) BOOL isReady;

- (instancetype)initWithConnection:(SocketConnection *)connection;
- (void)sendSample:(CMSampleBufferRef)sampleBuffer;

@end

NS_ASSUME_NONNULL_END
