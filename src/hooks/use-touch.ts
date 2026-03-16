import { useRef } from 'react';

/** 方向 */
type Direction = '' | 'vertical' | 'horizontal';

/** 最小移动距离 */
const MIN_DISTANCE = 10;

/**
 * 获取方向
 * @param x - 移动距离的 x 坐标
 * @param y - 移动距离的 y 坐标
 * @returns 方向，'' | 'vertical' | 'horizontal'
 */
function getDirection(x: number, y: number): Direction {
  if (x > y && x > MIN_DISTANCE) {
    return 'horizontal';
  }
  if (y > x && y > MIN_DISTANCE) {
    return 'vertical';
  }
  return '';
}

/**
 * 处理移动端的触摸手势检测和方向判断
 * @link 移植自vant：https://github.com/3lang3/react-vant/blob/main/packages/react-vant/src/components/hooks/use-touch.ts
 */
export default function useTouch() {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const deltaXRef = useRef(0);
  const deltaYRef = useRef(0);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const directionRef = useRef<Direction>('');
  const firstMoveRef = useRef<boolean>(null);

  const isVertical = () => directionRef.current === 'vertical';
  const isHorizontal = () => directionRef.current === 'horizontal';

  const reset = () => {
    deltaXRef.current = 0;
    deltaYRef.current = 0;
    offsetXRef.current = 0;
    offsetYRef.current = 0;
    directionRef.current = '';
    firstMoveRef.current = null;
  };

  const start = ((event: TouchEvent) => {
    reset();
    startXRef.current = event.touches[0].clientX;
    startYRef.current = event.touches[0].clientY;
  }) as EventListener;

  const move = ((event: TouchEvent) => {
    const touch = event.touches[0];
    // safari back will set clientX to negative number
    deltaXRef.current = touch.clientX < 0 ? 0 : touch.clientX - startXRef.current;
    deltaYRef.current = touch.clientY - startYRef.current;
    offsetXRef.current = Math.abs(deltaXRef.current);
    offsetYRef.current = Math.abs(deltaYRef.current);

    if (firstMoveRef.current === null) {
      firstMoveRef.current = true;
    } else {
      firstMoveRef.current = false;
    }

    if (!directionRef.current) {
      directionRef.current = getDirection(offsetXRef.current, offsetYRef.current);
    }
  }) as EventListener;

  return {
    move,
    start,
    reset,
    startX: startXRef,
    startY: startYRef,
    deltaX: deltaXRef,
    deltaY: deltaYRef,
    offsetX: offsetXRef,
    offsetY: offsetYRef,
    direction: directionRef,
    isVertical,
    isHorizontal,
    firstMove: firstMoveRef,
  };
}
