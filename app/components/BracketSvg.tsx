import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type BracketMatch = {
  id: string | number;
  aName: string;
  bName: string;
  aScore?: number | null;
  bScore?: number | null;
  winner: 'A' | 'B' | null;
};

export type BracketSvgRound = {
  key: string; // stable key (round id)
  matches: BracketMatch[];
};

type Props = {
  rounds: BracketSvgRound[];
  /** Optional initial zoom. 1 = full size. */
  initialScale?: number;
};

type NodeBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cy: number;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const BracketSvg: React.FC<Props> = ({ rounds, initialScale = 0.9 }) => {
  const layout = useMemo(() => {
    // Tuned for iPhone-sized screens; scales fine to 256 via pinch/zoom.
    const NODE_W = 240;
    const NODE_H = 64;
    const ROW_H = NODE_H / 2;
    const GAP_Y = 22;
    const COL_GAP = 120;
    const PAD_L = 24;
    const PAD_T = 24;

    const round0Count = rounds[0]?.matches?.length ?? 0;
    const step0 = NODE_H + GAP_Y;

    const boxes = new Map<string, NodeBox>();
    let maxRight = 0;
    let maxBottom = 0;

    rounds.forEach((round, rIdx) => {
      const x = PAD_L + rIdx * (NODE_W + COL_GAP);
      const spacing = step0 * Math.pow(2, rIdx);
      const offset = (spacing - step0) / 2;

      round.matches.forEach((m, i) => {
        const top = PAD_T + i * spacing + offset;
        const left = x;
        const right = x + NODE_W;
        const bottom = top + NODE_H;
        const cy = top + NODE_H / 2;
        const key = `${rIdx}:${i}`;
        boxes.set(key, { left, right, top, bottom, cy });
        maxRight = Math.max(maxRight, right);
        maxBottom = Math.max(maxBottom, bottom);
      });
    });

    // Canvas sizing: enough space for all rounds and the largest round (round 1) vertically.
    // For very large brackets, height becomes large (by design); pan/zoom handles it.
    const canvasW = maxRight + PAD_L;
    // If rounds are sparse, still give a bit of breathing room.
    const minCanvasH = PAD_T + round0Count * step0 + PAD_T;
    const canvasH = Math.max(maxBottom + PAD_T, minCanvasH);

    return {
      NODE_W,
      NODE_H,
      ROW_H,
      PAD_L,
      PAD_T,
      COL_GAP,
      boxes,
      canvasW,
      canvasH,
    };
  }, [rounds]);

  // --------- Pan / Zoom (gesture-handler + reanimated) ----------
  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    },
    onActive: (e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    },
  });

  const pinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      savedScale.value = scale.value;
    },
    onActive: (e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.35, 2.25);
    },
    onEnd: () => {
      // small settle to avoid jitter
      scale.value = withTiming(clamp(scale.value, 0.35, 2.25), { duration: 120 });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: scale.value },
      ],
    };
  });

  // Fit-ish initial placement: center horizontally a bit on first render
  const window = Dimensions.get('window');
  const initialFrameW = Math.max(1, window.width - 32);
  const initialFrameH = Math.max(1, window.height / 2);
  // Not perfect fit, but provides a nicer starting position.
  const initialOffsetX = Math.min(0, (initialFrameW - layout.canvasW * initialScale) / 2);
  const initialOffsetY = Math.min(0, (initialFrameH - layout.canvasH * initialScale) / 6);

  // NOTE: these set only on first render; user can always reset by leaving/re-entering screen.
  if (tx.value === 0 && ty.value === 0) {
    tx.value = initialOffsetX;
    ty.value = initialOffsetY;
  }

  const renderNode = (m: BracketMatch, rIdx: number, i: number) => {
    const b = layout.boxes.get(`${rIdx}:${i}`);
    if (!b) return null;
    const x = b.left;
    const y = b.top;
    const aWin = m.winner === 'A';
    const bWin = m.winner === 'B';

    const padX = 12;
    const scoreX = x + layout.NODE_W - 12;

    // very small truncation for long names
    const trunc = (s: string) => (s.length > 22 ? `${s.slice(0, 20)}…` : s);

    return (
      <G key={`node-${rIdx}-${i}`}>
        <Rect
          x={x}
          y={y}
          width={layout.NODE_W}
          height={layout.NODE_H}
          rx={12}
          ry={12}
          fill="#FFFFFF"
          stroke="rgba(15,23,42,0.14)"
          strokeWidth={1}
        />

        {aWin ? (
          <Rect
            x={x}
            y={y}
            width={layout.NODE_W}
            height={layout.ROW_H}
            rx={12}
            ry={12}
            fill="#E8F5E9"
          />
        ) : null}
        {bWin ? (
          <Rect
            x={x}
            y={y + layout.ROW_H}
            width={layout.NODE_W}
            height={layout.ROW_H}
            rx={12}
            ry={12}
            fill="#E8F5E9"
          />
        ) : null}

        <Line
          x1={x}
          y1={y + layout.ROW_H}
          x2={x + layout.NODE_W}
          y2={y + layout.ROW_H}
          stroke="rgba(15,23,42,0.10)"
          strokeWidth={1}
        />

        <SvgText
          x={x + padX}
          y={y + layout.ROW_H / 2}
          fontSize={12}
          fill="#0F172A"
          fontWeight={aWin ? '800' : '600'}
          alignmentBaseline="middle"
        >
          {trunc(m.aName)}
        </SvgText>
        <SvgText
          x={x + padX}
          y={y + layout.ROW_H + layout.ROW_H / 2}
          fontSize={12}
          fill="#0F172A"
          fontWeight={bWin ? '800' : '600'}
          alignmentBaseline="middle"
        >
          {trunc(m.bName)}
        </SvgText>

        <SvgText
          x={scoreX}
          y={y + layout.ROW_H / 2}
          fontSize={12}
          fill="#1B365D"
          fontWeight="800"
          alignmentBaseline="middle"
          textAnchor="end"
        >
          {m.aScore != null ? String(m.aScore) : ''}
        </SvgText>
        <SvgText
          x={scoreX}
          y={y + layout.ROW_H + layout.ROW_H / 2}
          fontSize={12}
          fill="#1B365D"
          fontWeight="800"
          alignmentBaseline="middle"
          textAnchor="end"
        >
          {m.bScore != null ? String(m.bScore) : ''}
        </SvgText>
      </G>
    );
  };

  const renderLinks = () => {
    const paths: React.ReactNode[] = [];
    for (let r = 0; r < rounds.length - 1; r++) {
      const prev = rounds[r];
      const next = rounds[r + 1];
      for (let i = 0; i < next.matches.length; i++) {
        const aIdx = i * 2;
        const bIdx = i * 2 + 1;
        const to = layout.boxes.get(`${r + 1}:${i}`);
        if (!to) continue;

        const add = (fromIdx: number) => {
          const from = layout.boxes.get(`${r}:${fromIdx}`);
          if (!from) return;
          const x1 = from.right;
          const y1 = from.cy;
          const x4 = to.left;
          const y4 = to.cy;
          const midX = x1 + (x4 - x1) * 0.45;
          const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y4}, ${x4} ${y4}`;
          paths.push(
            <Path
              key={`link-${r}-${fromIdx}-to-${r + 1}-${i}`}
              d={d}
              stroke="rgba(27,54,93,0.55)"
              strokeWidth={2}
              fill="none"
            />
          );
        };

        if (aIdx < prev.matches.length) add(aIdx);
        if (bIdx < prev.matches.length) add(bIdx);
      }
    }
    return <G>{paths}</G>;
  };

  return (
    <View style={styles.frame}>
      <PinchGestureHandler onGestureEvent={pinchHandler as any}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <PanGestureHandler onGestureEvent={panHandler as any}>
            <Animated.View style={[styles.panZoomSurface, animatedStyle]}>
              <Svg width={layout.canvasW} height={layout.canvasH}>
                {renderLinks()}
                {rounds.map((round, rIdx) =>
                  round.matches.map((m, i) => renderNode(m, rIdx, i))
                )}
              </Svg>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    height: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  panZoomSurface: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});


