//
//  SiriShortcutsManager.m
//  VoiceFit
//
//  Objective-C bridge for Siri Shortcuts Manager
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SiriShortcutsManager, NSObject)

RCT_EXTERN_METHOD(donateLogSetShortcut:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(donateCompleteSetShortcut:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(donateSkipRestShortcut:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(handleShortcut:(NSString *)activityType
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end

