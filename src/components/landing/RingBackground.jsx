import React, { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const CENTER_DIAMETER = "calc(min(95vw, 480px) + 64px)";
const GRID_OFFSET = "calc(max(32px, (100vw - 1920px) / 2) + 3 * (min(1920px, 100vw - 64px) - 264px) / 12 + 48px - 32px)";
const SIDE_DIAMETER_BASE = `calc(${GRID_OFFSET} * 1.5 / 1.09)`;
const SIDE_DIAMETER = `calc(${SIDE_DIAMETER_BASE} * 2)`;
const SIDE_X_OFFSET = `calc(${GRID_OFFSET} * 0.5)`;
const SIDE_ITEM_WIDTH = `calc(${SIDE_DIAMETER_BASE} * 0.32)`;
const SIDE_ITEM_HEIGHT = `calc(${SIDE_ITEM_WIDTH} * 9 / 16)`;

export const RING_SECTION_MIN_VH = 66;

export default function RingBackground({ side, images = [] }) {
  let itemsRef = useRef([]);
  
  let isCenter = side === "center";
  let itemCount = isCenter ? 12 : 24;
  let ringDiameter = isCenter ? CENTER_DIAMETER : SIDE_DIAMETER;
  let itemWidth = isCenter ? `calc(${ringDiameter} / 2 * 0.26)` : SIDE_ITEM_WIDTH;
  let itemHeight = isCenter ? `calc(${itemWidth} * 9 / 16)` : SIDE_ITEM_HEIGHT;
  
  let angles = useMemo(() => {
    let arr = [];
    for (let i = 0; i < itemCount; i++) {
      arr.push((i / itemCount) * 360);
    }
    return arr;
  }, [itemCount]);

  useGSAP(() => {
    let validItems = itemsRef.current.filter(Boolean);
    if (validItems.length === 0) return;
    
    let fixedRotation = side === "left" ? 90 : 270;
    let translateYString = `translateY(calc(${ringDiameter} / -2))`;
    
    let updatePositions = (orbitOffset) => {
      for (let n = 0; n < validItems.length; n++) {
        let currentAngle = angles[n] + orbitOffset;
        let counterRotation = isCenter ? -currentAngle : -fixedRotation;
        validItems[n].style.transform = `rotate(${currentAngle}deg) ${translateYString} rotate(${counterRotation}deg)`;
      }
    };
    
    updatePositions(0);
    
    let mm = gsap.matchMedia();
    
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      let tweenObj = { orbit: 0 };
      gsap.to(tweenObj, {
        orbit: 360,
        duration: 90,
        ease: "none",
        repeat: -1,
        onUpdate: () => updatePositions(tweenObj.orbit)
      });
    });
    
    return () => mm.revert();
  }, {
    dependencies: [side, angles, isCenter, ringDiameter]
  });

  let wrapperStyle = isCenter ? {
    width: ringDiameter,
    height: ringDiameter,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)"
  } : {
    width: ringDiameter,
    height: ringDiameter,
    left: side === "left" ? 0 : "auto",
    right: side === "right" ? 0 : "auto",
    top: "50%",
    transform: side === "left" 
      ? `translate(calc(-50% - ${SIDE_X_OFFSET}), -50%)` 
      : `translate(calc(50% + ${SIDE_X_OFFSET}), -50%)`
  };

  let displayClass = isCenter ? "block sm:hidden" : "hidden sm:block";
  let opacityClass = isCenter ? "opacity-40" : "";

  return (
    <div
      className={`pointer-events-none absolute ${displayClass} ${opacityClass}`}
      style={wrapperStyle}
      aria-hidden="true"
    >
      <div className="relative h-full w-full">
        {angles.map((angle, index) => {
          let imgSrc = images[index % Math.max(images.length, 1)];
          let initCounterRotation = isCenter ? -angle : (side === "left" ? -90 : -270);
          
          return (
            <div
              key={index}
              ref={(el) => { itemsRef.current[index] = el; }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: itemWidth,
                height: itemHeight,
                marginLeft: `calc(${itemWidth} / -2)`,
                marginTop: `calc(${itemHeight} / -2)`,
                transform: `rotate(${angle}deg) translateY(calc(${ringDiameter} / -2)) rotate(${initCounterRotation}deg)`
              }}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  decoding="async"
                  className="block object-cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="block h-full w-full bg-foreground/[0.06]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
