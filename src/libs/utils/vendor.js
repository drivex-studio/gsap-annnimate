import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

gsap.registerPlugin(
   useGSAP,
   ScrambleTextPlugin
 )
export { gsap, useGSAP, ScrambleTextPlugin }