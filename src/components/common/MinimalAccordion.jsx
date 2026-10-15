'use client';

import React, { useCallback, useId, useRef } from 'react';
import { gsap, useGSAP, CustomEase, SplitText } from '@/libs/utils/vendor';

if (!CustomEase.get('annnimate')) {
  CustomEase.create('annnimate', 'M0,0 C0.3,0.9 0.1,1 1,1');
}

if (!CustomEase.get('annnimateInOut')) {
  CustomEase.create('annnimateInOut', 'M0,0 C0.7,0 0.16,1 1,1');
}

const DEFAULT_ACCORDION_ITEMS = [
  {
    question: 'What makes the racket frames different?',
    answer:
      'Each frame is laid up from raw carbon in a mould we designed ourselves, then hand-finished before a string is ever pulled through it. The result holds its stiffness after years on hard courts, not just out of the box.',
  },
  {
    question: 'How are the trainers built for hard courts?',
    answer:
      'A dual-density outsole absorbs lateral load without collapsing under a full sprint stop. Every pair runs through eight thousand simulated cuts before it ships.',
  },
  {
    question: 'Do you build for left-handed players?',
    answer:
      'Every grip and frame balance mirrors on request at no extra cost. Tell us at checkout and we build it left from the first layer.',
  },
  {
    question: 'What is the warranty on frame cracking?',
    answer:
      'Two years against structural failure under normal play, no fine print about string tension or court surface. Send a photo, we send a replacement.',
  },
  {
    question: 'Can teams order custom paint jobs?',
    answer:
      'Squads of six or more can specify colourway, grip weight, and string pattern as one order. Turnaround runs three weeks from a confirmed spec.',
  },
];

/* --- MinimalAccordion --- */

export default function MinimalAccordion({
  className = '',
  items = DEFAULT_ACCORDION_ITEMS,
  duration = 0.8,
  ease = 'elastic.out(1,0.82)',
  goo = 9,
  multiple = false,
  startOpen = 0,
  stagger = 0.05,
}) {
  const instanceId = useId().replace(/:/g, '');
  const filterPrefix = `macc-goo-${instanceId}`;

  const stageRef = useRef(null);
  const rowRefs = useRef([]);
  const gooRefs = useRef([]);
  const gooTriggerRefs = useRef([]);
  const gooPanelRefs = useRef([]);
  const triggerCrispRefs = useRef([]);
  const panelCrispRefs = useRef([]);
  const triggerRefs = useRef([]);
  const panelRefs = useRef([]);
  const panelInnerRefs = useRef([]);
  const answerRefs = useRef([]);
  const iconRefs = useRef([]);
  const blurFilterRefs = useRef([]);
  const itemStatesRef = useRef([]);

  const closeEase = ease.indexOf('elastic') === 0 ? 'annnimate' : ease;

  const durationRef = useRef(duration);
  const easeRef = useRef(ease);
  const closeEaseRef = useRef(closeEase);
  const gooRef = useRef(goo);
  const multipleRef = useRef(multiple);
  const staggerRef = useRef(stagger);

  durationRef.current = duration;
  easeRef.current = ease;
  closeEaseRef.current = closeEase;
  gooRef.current = goo;
  multipleRef.current = multiple;
  staggerRef.current = stagger;

  rowRefs.current = [];
  gooRefs.current = [];
  gooTriggerRefs.current = [];
  gooPanelRefs.current = [];
  triggerCrispRefs.current = [];
  panelCrispRefs.current = [];
  triggerRefs.current = [];
  panelRefs.current = [];
  panelInnerRefs.current = [];
  answerRefs.current = [];
  iconRefs.current = [];
  blurFilterRefs.current = [];

  const measureItem = useCallback((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      state.triggerH = triggerRefs.current[index]?.offsetHeight || 0;
      state.innerH = panelInnerRefs.current[index]?.offsetHeight || 0;
      state.rowW = rowRefs.current[index]?.offsetWidth || 0;
    }
  }, []);

  const syncTriggerShape = useCallback((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      gsap.set(
        [gooTriggerRefs.current[index], triggerCrispRefs.current[index]],
        {
          height: state.triggerH,
          borderRadius: state.triggerH / 2,
        },
      );
    }
  }, []);

  const syncClosedPanelShape = useCallback((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      gsap.set([gooPanelRefs.current[index], panelCrispRefs.current[index]], {
        x: 4,
        y: 4,
        width: state.rowW - 8,
        height: state.triggerH - 8,
        force3D: true,
      });
    }
  }, []);

  const setItemAria = useCallback((index, isOpen) => {
    const triggerEl = triggerRefs.current[index];
    const panelEl = panelRefs.current[index];

    if (triggerEl && panelEl) {
      triggerEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      panelEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

      if (isOpen) {
        panelEl.removeAttribute('inert');
      } else {
        panelEl.setAttribute('inert', '');
      }
    }
  }, []);

  const toggleGooFilter = useCallback(
    (index, isEnabled) => {
      const gooEl = gooRefs.current[index];
      if (gooEl) {
        gooEl.style.filter = isEnabled
          ? `url(#${filterPrefix}-${index})`
          : 'none';
      }
    },
    [filterPrefix],
  );

  const updateBlurStdDeviation = useCallback((index) => {
    const blurEl = blurFilterRefs.current[index];
    const state = itemStatesRef.current[index];

    if (blurEl && state) {
      blurEl.setAttribute('stdDeviation', String(state.gooProxy.std));
    }
  }, []);

  const killItemTweens = useCallback((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      if (state.tl) {
        state.tl.kill();
        state.tl = null;
      }

      gsap.killTweensOf([
        gooPanelRefs.current[index],
        panelCrispRefs.current[index],
        panelRefs.current[index],
        rowRefs.current[index],
        iconRefs.current[index],
        state.gooProxy,
        answerRefs.current[index],
      ]);
    }
  }, []);

  const resetAnswerSplit = useCallback((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      if (state.answerTl) {
        state.answerTl.kill();
        state.answerTl = null;
      }
      if (state.split && state.split.revert) {
        state.split.revert();
        state.split = null;
      }

      gsap.set(answerRefs.current[index], {
        autoAlpha: 0,
      });
    }
  }, []);

  const animateAnswerIn = useCallback(
    (index) => {
      const state = itemStatesRef.current[index];
      const answerEl = answerRefs.current[index];

      if (!state || !answerEl) {
        return;
      }

      const runSplit = () => {
        resetAnswerSplit(index);
        gsap.set(answerEl, {
          autoAlpha: 1,
        });

        state.split = SplitText.create(answerEl, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'macc_answer_line',
          onSplit: (splitInstance) => {
            gsap.set(splitInstance.lines, {
              yPercent: 100,
              y: 0,
              force3D: true,
            });

            state.answerTl = gsap.timeline();
            state.answerTl.to(splitInstance.lines, {
              yPercent: 0,
              y: 0,
              duration: 0.6,
              stagger: staggerRef.current,
              ease: 'annnimate',
              force3D: true,
            });
          },
        });
      };

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(runSplit);
      } else {
        runSplit();
      }
    },
    [resetAnswerSplit],
  );

  const openItem = useCallback(
    (index) => {
      const state = itemStatesRef.current[index];
      if (!state) {
        return;
      }

      state.isOpen = true;
      measureItem(index);
      setItemAria(index, true);
      killItemTweens(index);

      const expandedHeight = 10 + state.innerH + 16;

      toggleGooFilter(index, true);
      state.gooProxy.std = gooRef.current;
      updateBlurStdDeviation(index);

      const tl = gsap.timeline({
        defaults: {
          force3D: true,
        },
      });

      state.tl = tl;

      tl.to(
        [gooPanelRefs.current[index], panelCrispRefs.current[index]],
        {
          x: 0,
          y: state.triggerH + 10,
          width: state.rowW,
          height: state.innerH,
          duration: durationRef.current,
          ease: easeRef.current,
        },
        0,
      )
        .to(
          panelRefs.current[index],
          {
            height: expandedHeight,
            duration: durationRef.current,
            ease: easeRef.current,
          },
          0,
        )
        .to(
          rowRefs.current[index],
          {
            marginTop: 16,
            duration: durationRef.current,
            ease: easeRef.current,
          },
          0,
        )
        .to(
          iconRefs.current[index],
          {
            rotation: 135,
            duration: 0.5,
            ease: 'annnimateInOut',
          },
          0,
        )
        .to(
          state.gooProxy,
          {
            std: 0,
            duration: 0.25 * durationRef.current,
            ease: 'power1.in',
            onUpdate: () => updateBlurStdDeviation(index),
            onComplete: () => toggleGooFilter(index, false),
          },
          0.4 * durationRef.current,
        )
        .call(() => animateAnswerIn(index), null, 0.32 * durationRef.current);
    },
    [
      measureItem,
      setItemAria,
      killItemTweens,
      toggleGooFilter,
      updateBlurStdDeviation,
      animateAnswerIn,
    ],
  );

  const closeItem = useCallback(
    (index) => {
      const state = itemStatesRef.current[index];
      if (!state) {
        return;
      }

      state.isOpen = false;
      setItemAria(index, false);
      killItemTweens(index);

      const closeDuration = 0.65 * durationRef.current;
      toggleGooFilter(index, true);

      const tl = gsap.timeline({
        defaults: {
          force3D: true,
        },
      });

      state.tl = tl;

      tl.to(
        state.gooProxy,
        {
          std: gooRef.current,
          duration: 0.3 * closeDuration,
          ease: 'power1.in',
          onUpdate: () => updateBlurStdDeviation(index),
        },
        0,
      )
        .to(
          [gooPanelRefs.current[index], panelCrispRefs.current[index]],
          {
            x: 4,
            y: 4,
            width: state.rowW - 8,
            height: state.triggerH - 8,
            duration: closeDuration,
            ease: closeEaseRef.current,
          },
          0,
        )
        .to(
          panelRefs.current[index],
          {
            height: 0,
            duration: closeDuration,
            ease: closeEaseRef.current,
          },
          0,
        )
        .to(
          rowRefs.current[index],
          {
            marginTop: 0,
            duration: closeDuration,
            ease: closeEaseRef.current,
          },
          0,
        )
        .to(
          iconRefs.current[index],
          {
            rotation: 0,
            duration: 0.5,
            ease: 'annnimateInOut',
          },
          0,
        )
        .to(
          answerRefs.current[index],
          {
            autoAlpha: 0,
            duration: 0.15,
            ease: 'power2.out',
          },
          0,
        )
        .to(
          state.gooProxy,
          {
            std: 0,
            duration: 0.3 * closeDuration,
            ease: 'power1.out',
            onUpdate: () => updateBlurStdDeviation(index),
            onComplete: () => {
              toggleGooFilter(index, false);
              resetAnswerSplit(index);
            },
          },
          0.7 * closeDuration,
        );
    },
    [
      setItemAria,
      killItemTweens,
      toggleGooFilter,
      updateBlurStdDeviation,
      resetAnswerSplit,
    ],
  );

  const moveFocus = useCallback(
    (index, direction) => {
      const total = items.length;
      if (total) {
        triggerRefs.current[(index + direction + total) % total]?.focus();
      }
    },
    [items.length],
  );

  const handleKeyDown = useCallback(
    (event, index) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        moveFocus(index, 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        moveFocus(index, -1);
      }
    },
    [moveFocus],
  );

  const { contextSafe } = useGSAP(
    () => {
      itemStatesRef.current = items.map(() => ({
        isOpen: false,
        triggerH: 0,
        innerH: 0,
        rowW: 0,
        split: null,
        answerTl: null,
        tl: null,
        gooProxy: {
          std: 0,
        },
      }));

      const initialOpenIndex = startOpen == null ? -1 : startOpen;

      items.forEach((item, index) => {
        measureItem(index);
        syncTriggerShape(index);
        syncClosedPanelShape(index);
        toggleGooFilter(index, false);

        gsap.set(answerRefs.current[index], {
          autoAlpha: 0,
        });

        const state = itemStatesRef.current[index];
        const isInitiallyOpen = index === initialOpenIndex;

        state.isOpen = isInitiallyOpen;
        setItemAria(index, isInitiallyOpen);

        if (isInitiallyOpen) {
          gsap.set(
            [gooPanelRefs.current[index], panelCrispRefs.current[index]],
            {
              x: 0,
              y: state.triggerH + 10,
              width: state.rowW,
              height: state.innerH,
            },
          );
          gsap.set(panelRefs.current[index], {
            height: 10 + state.innerH + 16,
          });
          gsap.set(rowRefs.current[index], {
            marginTop: 16,
          });
          gsap.set(iconRefs.current[index], {
            rotation: 135,
          });
          animateAnswerIn(index);
        }
      });

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.globalTimeline.timeScale(20);
      });

      let resizeTimer = null;

      function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          items.forEach((item, index) => {
            const state = itemStatesRef.current[index];
            if (state) {
              measureItem(index);
              syncTriggerShape(index);

              if (state.isOpen) {
                gsap.set(
                  [gooPanelRefs.current[index], panelCrispRefs.current[index]],
                  {
                    x: 0,
                    y: state.triggerH + 10,
                    width: state.rowW,
                    height: state.innerH,
                  },
                );
                gsap.set(panelRefs.current[index], {
                  height: 10 + state.innerH + 16,
                });
                gsap.set(rowRefs.current[index], {
                  marginTop: 16,
                });
              } else {
                syncClosedPanelShape(index);
                gsap.set(rowRefs.current[index], {
                  marginTop: 0,
                });
              }
            }
          });
        }, 150);
      }

      function handleVisibilityChange() {
        if (document.hidden) {
          gsap.globalTimeline.pause();
        } else {
          gsap.globalTimeline.resume();
        }
      }

      window.addEventListener('resize', handleResize);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
        mm.revert();
        itemStatesRef.current.forEach((state) => {
          if (state?.tl) {
            state.tl.kill();
          }
          if (state?.answerTl) {
            state.answerTl.kill();
          }
          if (state?.split?.revert) {
            state.split.revert();
          }
        });
      };
    },
    {
      scope: stageRef,
      dependencies: [items.length, startOpen],
    },
  );

  const handleToggleItem = contextSafe((index) => {
    const state = itemStatesRef.current[index];
    if (state) {
      if (state.isOpen) {
        closeItem(index);
        return;
      }

      if (!multipleRef.current) {
        itemStatesRef.current.forEach((otherState, otherIndex) => {
          if (otherIndex !== index && otherState && otherState.isOpen) {
            closeItem(otherIndex);
          }
        });
      }

      openItem(index);
    }
  });

  return (
    <div className={`macc_wrap${className ? ` ${className}` : ''}`}>
      <div
        ref={stageRef}
        className="macc_stage"
        data-anm-morphing-accordion={true}
      >
        <svg
          className="macc_filter_svg"
          width="0"
          height="0"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {items.map((item, index) => (
              <filter
                key={index}
                id={`${filterPrefix}-${index}`}
                colorInterpolationFilters="sRGB"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  ref={(el) => {
                    if (el) {
                      blurFilterRefs.current[index] = el;
                    }
                  }}
                  in="SourceGraphic"
                  stdDeviation="0"
                  result="macc_blur"
                />
                <feColorMatrix
                  in="macc_blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                  result="macc_goo"
                />
              </filter>
            ))}
          </defs>
        </svg>

        <div className="macc_list">
          {items.map((item, index) => {
            const triggerId = `ga-trigger-${instanceId}-${index}`;
            const panelId = `ga-panel-${instanceId}-${index}`;

            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) {
                    rowRefs.current[index] = el;
                  }
                }}
                className="macc_row"
                data-anm-macc-row={true}
              >
                <div
                  ref={(el) => {
                    if (el) {
                      gooRefs.current[index] = el;
                    }
                  }}
                  className="macc_goo"
                  data-anm-macc-goo={true}
                  aria-hidden="true"
                >
                  <div
                    ref={(el) => {
                      if (el) {
                        gooTriggerRefs.current[index] = el;
                      }
                    }}
                    className="macc_goo_trigger"
                  />
                  <div
                    ref={(el) => {
                      if (el) {
                        gooPanelRefs.current[index] = el;
                      }
                    }}
                    className="macc_goo_panel"
                  />
                </div>

                <button
                  ref={(el) => {
                    if (el) {
                      triggerRefs.current[index] = el;
                    }
                  }}
                  className="macc_trigger"
                  type="button"
                  data-anm-macc-trigger={true}
                  id={triggerId}
                  aria-controls={panelId}
                  aria-expanded="false"
                  onClick={() => handleToggleItem(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <span className="macc_index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="macc_question">{item.question}</span>
                  <svg
                    ref={(el) => {
                      if (el) {
                        iconRefs.current[index] = el;
                      }
                    }}
                    className="macc_icon"
                    data-anm-macc-icon={true}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 1V15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M1 8H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div
                  ref={(el) => {
                    if (el) {
                      triggerCrispRefs.current[index] = el;
                    }
                  }}
                  className="macc_trigger_crisp"
                  aria-hidden="true"
                />

                <div
                  ref={(el) => {
                    if (el) {
                      panelCrispRefs.current[index] = el;
                    }
                  }}
                  className="macc_panel_crisp"
                  aria-hidden="true"
                />

                <div
                  ref={(el) => {
                    if (el) {
                      panelRefs.current[index] = el;
                    }
                  }}
                  className="macc_panel"
                  data-anm-macc-panel={true}
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden="true"
                >
                  <div
                    ref={(el) => {
                      if (el) {
                        panelInnerRefs.current[index] = el;
                      }
                    }}
                    className="macc_panel_inner"
                  >
                    <p
                      ref={(el) => {
                        if (el) {
                          answerRefs.current[index] = el;
                        }
                      }}
                      className="macc_answer"
                      data-anm-macc-answer={true}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
