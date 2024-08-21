import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";

const facialExpressions = {
  smile: {
    "viseme_TH": 0.05,
    "viseme_SS": 1
  },
  happy: {
    "viseme_SS": 0.10000000000000017,
    "viseme_aa": 0.22,
    "browOuterUpLeft": 0.19,
    "browOuterUpRight": 0.19999999999999984,
    "eyeWideLeft": 0.4999999999999997,
    "eyeWideRight": 0.4999999999999997,
    "mouthClose": 0.13,
    "mouthSmileLeft": 0.52,
    "mouthSmileRight": 0.51
  },
  sad: {
    "viseme_SS": 0.31,
    "viseme_aa": 0.33,
    "browDownLeft": 0.51,
    "browDownRight": 0.4999999999999997,
    "browOuterUpLeft": 0.10000000000000017,
    "browOuterUpRight": 0.10000000000000017,
    "mouthFrownLeft": 0.5999999999999992,
    "mouthFrownRight": 0.5999999999999992,
    "mouthClose": 0.2999999999999996
  },
  surprised: {
    "viseme_TH": 0.0,
    "viseme_SS": 0.0,
    "viseme_aa": 0.6,
    "browOuterUpLeft": 0.8,
    "browOuterUpRight": 0.8,
    "eyeWideLeft": 0.9,
    "eyeWideRight": 0.9,
    "mouthOpen": 0.7,
    "mouthClose": 0.0
  },
  angry: {
    "viseme_TH": 0.04736842105263158,
    "viseme_SS": 0.4000000000000007,
    "viseme_aa": 0.19999999999999984,
    "browDownLeft": 0.6999999999999992,
    "browDownRight": 0.6999999999999992,
    "browOuterUpLeft": 0.09999999999999992,
    "browOuterUpRight": 0.09999999999999992,
    "eyeWideLeft": 0.2999999999999996,
    "eyeWideRight": 0.2999999999999996,
    "mouthFrownLeft": 0.7999999999999994,
    "mouthFrownRight": 0.7999999999999994,
    "mouthClose": 0.27
  }
};

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

let setupMode = false;

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/6697b993365f0adda5f6b7e9 (1).glb");
  const { animations } = useGLTF("/models/animations.glb");
  const { message, onMessagePlayed, chat } = useChat();
  const [lipsync, setLipsync] = useState();
  const [audio, setAudio] = useState();
  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Standing");
  const [speed, setSpeed] = useState(0.7); // Animation speed state

  useEffect(() => {
    console.log(message);
    if (!message) {
      setAnimation("Standing");
      return;
    }
    setAnimation(message.animation);
    setFacialExpression(message.facialExpression);
    setLipsync(message.lipsync);
    const audio = new Audio("data:audio/mp3;base64," + message.audio);
    audio.play();
    setAudio(audio);
    audio.onended = onMessagePlayed;
    audio.onerror = (e) => console.error("Audio playback error:", e);
  }, [message]);

  useEffect(() => {
    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
      actions[animation].timeScale = speed; // Set animation speed
      return () => {
        actions[animation].fadeOut(1);
      };
    } else {
      console.error(`Animation "${animation}" not found in actions`);
    }
  }, [animation, actions, speed]); // Depend on speed as well

  useFrame((state, delta) => {
    if (mixer) mixer.update(delta * speed); // Adjust mixer update speed

    if (!setupMode) {
      Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach((key) => {
        const mapping = facialExpressions[facialExpression];
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return;
        }
        if (mapping && mapping[key]) {
          lerpMorphTarget(key, mapping[key], 0.1);
        } else {
          lerpMorphTarget(key, 0, 0.1);
        }
      });
    }

    lerpMorphTarget("eyeBlinkLeft", blink || winkLeft ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink || winkRight ? 1 : 0, 0.5);

    if (setupMode) return;

    const appliedMorphTargets = [];
    if (message && lipsync) {
      const currentAudioTime = audio.currentTime;
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          appliedMorphTargets.push(corresponding[mouthCue.value]);
          lerpMorphTarget(corresponding[mouthCue.value], 1, 0.2);
          break;
        }
      }
    }

    Object.values(corresponding).forEach((value) => {
      if (!appliedMorphTargets.includes(value)) {
        lerpMorphTarget(value, 0, 0.1);
      }
    });
  });

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[index],
          value,
          speed
        );

        if (child.name === "Wolf3D_Head" || child.name === "Wolf3D_Teeth") {
          if (!setupMode) {
            try {
              set({
                [target]: value,
              });
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    });
  };

  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");

  useControls("FacialExpressions", {
    chat: button(() => chat()),
    winkLeft: button(() => {
      setWinkLeft(true);
      setTimeout(() => setWinkLeft(false), 300);
    }),
    winkRight: button(() => {
      setWinkRight(true);
      setTimeout(() => setWinkRight(false), 300);
    }),
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    enableSetupMode: button(() => {
      setupMode = true;
    }),
    disableSetupMode: button(() => {
      setupMode = false;
    }),
    logMorphTargetValues: button(() => {
      const emotionValues = {};
      Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach((key) => {
        if (key !== "eyeBlinkLeft" && key !== "eyeBlinkRight") {
          const value =
            nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary[key]];
          if (value > 0.01) {
            emotionValues[key] = value;
          }
        }
      });
      console.log(JSON.stringify(emotionValues, null, 2));
    }),
  });

  useControls("AnimationSpeed", {
    speed: {
      value: speed,
      min: 0.1,
      max: 3,
      step: 0.1,
      onChange: (value) => setSpeed(value),
    },
  });

  const [, set] = useControls("MorphTarget", () =>
    Object.assign(
      {},
      ...Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).map((key) => ({
        [key]: {
          label: key,
          value: 0,
          min: nodes.Wolf3D_Head.morphTargetInfluences[nodes.Wolf3D_Head.morphTargetDictionary[key]],
          max: 1,
          onChange: (val) => {
            if (setupMode) {
              lerpMorphTarget(key, val, 1);
            }
          },
        },
      }))
    )
  );

  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  if (!nodes || !materials) return null;

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

useGLTF.preload('/models/6697b993365f0adda5f6b7e9 (1).glb');
useGLTF.preload("/models/animations.glb");
