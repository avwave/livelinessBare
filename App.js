/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useCallback, useRef, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Dimensions,
  View,
  Text,
  Image,
  StatusBar,
  Button,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {useDebouncedCallback} from 'use-debounce/lib';

const {width: winWidth, height: winHeight} = Dimensions.get('window');

let liveliness = [
  {step: 'left', success: false},
  {step: 'right', success: false},
  {step: 'smile', success: false},
  {step: 'ahead', success: false},
];

const App = () => {
  const cameraRef = useRef(null);

  const [cameraType, setCameraType] = useState(RNCamera.Constants.Type.front);
  const [isCapture, setIsCapture] = useState(false);

  const [faceYaw, setFaceYaw] = useState(0);
  const [smileProb, setSmileProb] = useState(0);
  const [currentFace, setCurrentFace] = useState(0);

  const [currentStep, setCurrentStep] = useState(0);
  const [isLively, setIsLively] = useState(false);

  const [photo, setPhoto] = useState(false);

  const takePhoto = async () => {
    setTimeout(async () => {
      const savedPhoto = await cameraRef.current.takePictureAsync({
        base64: true,
      });
      setPhoto(savedPhoto);
    }, 1);
  };

  const doHandleFaceDetected = async ({faces}) => {
    const cStep = currentStep;
    const face = faces.length ? faces[0] : false;
    if (!isCapture) {
      return;
    }
    if (!face) {
      return;
    }

    const lively = liveliness.every((lStep) => lStep.success === true);
    setIsLively(lively);
    if (lively) {
      setIsCapture(false);
      await takePhoto();
      return;
    }

    setFaceYaw(face.yawAngle);
    setCurrentFace(face.faceID);
    setSmileProb(face.smilingProbability);

    let successStep = false;
    switch (liveliness[cStep].step) {
      case 'smile':
        if (face.smilingProbability > 0.5) {
          successStep = true;
        }
        break;
      default:
        if (challengeDirection(face.yawAngle) === liveliness[cStep].step) {
          successStep = true;
        }
        break;
    }

    if (successStep) {
      liveliness[cStep].success = true;
      if (cStep + 1 < liveliness.length) {
        setCurrentStep(cStep + 1);
      }
    }
  };

  const startCapture = () => {
    setIsCapture(true);
  };

  const challengeDirection = (yaw) => {
    if (yaw > -40 && yaw < -10) {
      return 'right';
    } else if (yaw > 10 && yaw < 40) {
      return 'left';
    } else if (yaw > -10 || yaw < 10) {
      return 'ahead';
    } else {
      return 'INVALID DIRECTION';
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View style={styles.container}>
          {photo ? (
            <Image
              source={{uri: `data:image/jpg;base64,${photo.base64}`}}
              style={{width: winWidth, height: winWidth}}
            />
          ) : (
            <RNCamera
              ref={cameraRef}
              ratio="1:1"
              style={styles.camera}
              type={cameraType}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to use your camera',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
              onFacesDetected={doHandleFaceDetected}
              faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
              faceDetectionLandmarks={
                RNCamera.Constants.FaceDetection.Landmarks.none
              }
              faceDetectionClassifications={
                RNCamera.Constants.FaceDetection.Classifications.all
              }>
              <View style={styles.promptContainer}>
                <View style={styles.prompts}>
                  {isCapture ? (
                    <Text style={styles.textPrompt}>
                      {liveliness[currentStep].step}
                    </Text>
                  ) : (
                    <Button onPress={startCapture} title="Start Capture" />
                  )}
                </View>
              </View>
            </RNCamera>
          )}
          <View>
            <Text>faceID: {currentFace}</Text>
            <Text>yaw: {faceYaw}</Text>
            <Text>facing: {challengeDirection(faceYaw)}</Text>
            <Text>smile: {smileProb}</Text>
            <Text>smiling: {smileProb > 0.5 ? 'Yes' : 'No'}</Text>
            <Text>---</Text>
            {liveliness.map((lStep) => (
              <Text key={lStep.step}>
                step {lStep.step}:{lStep.success ? 'True' : 'False'}
              </Text>
            ))}
            {isLively ? <Text>MOCK: Sending image to rekognition</Text> : <></>}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    aspectRatio: 1,
    width: winWidth,
    height: winWidth,
    position: 'relative',
  },
  promptContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
  },
  prompts: {
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
  },
  textPrompt: {
    fontSize: 40,
    textAlign: 'center',
    color: 'white',
  },
});

export default App;
