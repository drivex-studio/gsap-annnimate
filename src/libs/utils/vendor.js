import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  Draggable,
  InertiaPlugin,
  MotionPathPlugin,
  CustomEase
)

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  Draggable,
  InertiaPlugin,
  MotionPathPlugin,
  CustomEase
}
