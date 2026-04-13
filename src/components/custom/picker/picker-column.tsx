import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import useTouch from '@/hooks/use-touch';
import { cn } from '@/lib/utils';

const MATRIX_REG = /matrix3?d?\(([^)]+)\)/;

/**
 * 列选项
 */
export type PickerColumnOption = {
  text?: ReactNode;
  value?: string | number;
  children?: PickerColumnOption[];
  disabled?: boolean;
} & Record<string, any>;

/**
 * 列属性
 */
export interface PickerColumnProps {
  /**
   * 选项数组
   */
  options: PickerColumnOption[];
  /**
   * 当前选中的值
   */
  value?: string | number;
  /**
   * 选项对象中，选项文字对应的 key
   * @default 'text'
   */
  textKey?: string;
  /**
   * 选项对象中，选项 value 对应的 key
   * @default 'value'
   */
  valueKey?: string;
  /**
   * 选项高度
   * @default 44
   */
  itemHeight?: number;
  /**
   * 可见选项个数
   * @default 5
   */
  visibleItemCount?: number;
  /**
   * 选择选项时触发
   */
  onSelect?: (option: PickerColumnOption, index: number) => void;
  /**
   * 是否只读
   * @default false
   */
  readOnly?: boolean;
  /**
   * 惯性滑动动画时长，单位 ms
   * @default 1000
   */
  swipeDuration?: number;
  /**
   * 自定义选项内容
   */
  optionRender?: (option: PickerColumnOption) => ReactNode;
  /**
   * 列索引
   */
  index?: number;
  /**
   * 自定义类名
   */
  className?: string;
}

export interface PickerColumnInstance {
  stopMomentum: () => void;
}

export interface PickerColumnComponentProps extends PickerColumnProps {
  ref?: React.Ref<PickerColumnInstance>;
}

const DEFAULT_DURATION = 200;

// 惯性滑动思路:
// 在手指离开屏幕时，如果和上一次 move 时的间隔小于 `MOMENTUM_LIMIT_TIME` 且 move
// 距离大于 `MOMENTUM_LIMIT_DISTANCE` 时，执行惯性滑动
const MOMENTUM_LIMIT_TIME = 300;
const MOMENTUM_LIMIT_DISTANCE = 15;

/**
 * 将像素值转换为数字
 */
function unitToPx(value?: string | number) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * 限制数值范围
 */
function range(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

/**
 * 获取元素的 translateY 值
 */
function getElementTranslateY(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const transform = style.transform;

  // 如果没有 transform，返回 0
  if (!transform || transform === 'none') {
    return 0;
  }

  // 解析 matrix 或 matrix3d
  const values = transform.match(MATRIX_REG)?.[1].split(', ');
  if (!values) {
    return 0;
  }

  // matrix3d 有 16 个值，translateY 是第 14 个（索引 13）
  // matrix 有 6 个值，translateY 是第 6 个（索引 5）
  const translateY = values.length === 16 ? values[13] : values[5];
  return Number(translateY) || 0;
}

function PickerColumn(props: PickerColumnComponentProps) {
  const { ref, ...restProps } = props;
  const {
    valueKey = 'value',
    textKey = 'text',
    itemHeight: _itemHeight = 44,
    visibleItemCount = 5,
    value,
    readOnly = false,
    swipeDuration = 1000,
    optionRender,
    index = 0,
    className,
    onSelect = () => {},
  } = restProps;

  const itemHeight = unitToPx(_itemHeight);
  const options = restProps.options;

  const wrapperRef = useRef<HTMLUListElement>(null);
  const movingRef = useRef(false);
  const startOffsetRef = useRef(0);
  const transitionEndTriggerRef = useRef<(() => void) | null>(null);
  const touchStartTimeRef = useRef(0);
  const momentumOffsetRef = useRef(0);

  const [offset, setOffset] = useState(0);
  const [duration, setDuration] = useState(0);

  const touch = useTouch();

  // 基准偏移量：让第一项对齐到选中框中心
  const baseOffset = (itemHeight * (visibleItemCount - 1)) / 2;

  // 调整索引，跳过禁用项
  const adjustIndex = (targetIndex: number) => {
    const adjustedIndex = range(targetIndex, 0, options.length);

    for (let i = adjustedIndex; i < options.length; i += 1) {
      const option = options[i];
      if (option !== undefined && option.disabled !== true) {
        return i;
      }
    }

    for (let i = adjustedIndex - 1; i >= 0; i -= 1) {
      const option = options[i];
      if (option !== undefined && option.disabled !== true) {
        return i;
      }
    }

    return null;
  };

  // 触发选择事件
  const handleSelect = (val: PickerColumnOption) => {
    onSelect(val, index);
  };

  // 设置索引
  const setIndex = (targetIndex: number) => {
    const adjustedIndex = adjustIndex(targetIndex) ?? 0;
    const newOffset = -adjustedIndex * itemHeight;

    const trigger = () => {
      if (options[adjustedIndex]?.[valueKey] !== value) {
        handleSelect(options[adjustedIndex]);
      }
    };

    // trigger the change event after transitionend when moving
    if (movingRef.current && newOffset !== offset) {
      transitionEndTriggerRef.current = trigger;
    } else {
      trigger();
    }

    setOffset(newOffset);
  };

  // 动画设置偏移量
  const animate = (targetIndex: number) => {
    const adjustedIndex = adjustIndex(targetIndex) ?? 0;
    const newOffset = -adjustedIndex * itemHeight;
    setOffset(newOffset);
    setDuration(0);
  };

  // 初始化选中项
  useEffect(() => {
    if (options.length === 0) {
      if (value !== undefined) {
        handleSelect({} as PickerColumnOption);
      }
    } else {
      let targetIndex = options.findIndex((item) => item[valueKey] === value);

      if (targetIndex < 0) {
        targetIndex = 0;
        const firstOption = options[0];
        if (firstOption !== undefined) {
          handleSelect(firstOption);
        }
      }

      animate(targetIndex);
    }
  }, [value, JSON.stringify(options)]);

  // 点击选项
  const onClickItem = (clickIndex: number) => {
    if (movingRef.current || readOnly) {
      return;
    }

    transitionEndTriggerRef.current = null;
    setDuration(DEFAULT_DURATION);
    setIndex(clickIndex);
  };

  // 根据偏移量获取索引
  const getIndexByOffset = (offset: number) =>
    range(Math.round(-offset / itemHeight), 0, options.length - 1);

  // 惯性滚动
  const momentum = (distance: number, _duration: number, currentOffset: number) => {
    const speed = Math.abs(distance / _duration);
    const finalDistance = currentOffset + (speed / 0.003) * (distance < 0 ? -1 : 1);

    const finalIndex = getIndexByOffset(finalDistance);

    setDuration(+swipeDuration);
    setIndex(finalIndex);
  };

  // 停止惯性滚动
  const stopMomentum = () => {
    movingRef.current = false;
    setDuration(0);

    if (transitionEndTriggerRef.current) {
      transitionEndTriggerRef.current();
      transitionEndTriggerRef.current = null;
    }
  };

  // 触摸开始
  const onTouchStart = (event: ReactTouchEvent) => {
    if (readOnly) {
      return;
    }

    touch.start(event.nativeEvent);

    let currentOffset = offset;

    if (movingRef.current && wrapperRef.current) {
      const translateY = getElementTranslateY(wrapperRef.current);
      currentOffset = Math.min(0, translateY - baseOffset);
      startOffsetRef.current = currentOffset;
    } else {
      startOffsetRef.current = currentOffset;
    }

    setDuration(0);
    setOffset(currentOffset);
    touchStartTimeRef.current = Date.now();
    momentumOffsetRef.current = startOffsetRef.current;
    transitionEndTriggerRef.current = null;
  };

  // 触摸移动
  const onTouchMove = (event: ReactTouchEvent) => {
    if (readOnly) {
      return;
    }

    touch.move(event.nativeEvent);

    if (touch.isVertical()) {
      movingRef.current = true;
    }

    const newOffset = range(
      startOffsetRef.current + touch.deltaY.current,
      -(options.length * itemHeight),
      itemHeight,
    );

    setOffset(newOffset);
    setDuration(0);

    const now = Date.now();
    if (now - touchStartTimeRef.current > MOMENTUM_LIMIT_TIME) {
      touchStartTimeRef.current = now;
      momentumOffsetRef.current = newOffset;
    }
  };

  // 触摸结束
  const onTouchEnd = () => {
    if (readOnly || !movingRef.current) {
      return;
    }

    // 在事件处理器中调用 Date.now() 是安全的
    const distance = offset - momentumOffsetRef.current;
    const elapsedTime = Date.now() - touchStartTimeRef.current;

    const allowMomentum
      = elapsedTime < MOMENTUM_LIMIT_TIME
        && Math.abs(distance) > MOMENTUM_LIMIT_DISTANCE;

    if (allowMomentum) {
      momentum(distance, elapsedTime, offset);
      return;
    }

    const finalIndex = getIndexByOffset(offset);
    setDuration(DEFAULT_DURATION);
    setIndex(finalIndex);

    // compatible with desktop scenario
    // use setTimeout to skip the click event triggered after touchstart
    setTimeout(() => {
      movingRef.current = false;
    }, 0);
  };

  // 渲染选项
  const renderOptions = () => {
    return options.map((option, optionIndex: number) => {
      const disabled = Boolean(option.disabled);
      const isSelected = option[valueKey] === value;

      const data = {
        role: 'button' as const,
        style: {
          height: `${itemHeight}px`,
        },
        tabIndex: disabled ? -1 : 0,
        className: cn(
          `
            flex cursor-pointer items-center justify-center px-1 text-base text-gray-500
            transition-colors
            dark:text-gray-400
          `,
          {
            'cursor-not-allowed opacity-30': disabled,
            'font-semibold text-gray-900! dark:text-gray-50!': isSelected,
          },
        ),
        onClick: () => {
          onClickItem(optionIndex);
        },
      };

      const optionText = option[textKey] as ReactNode;
      const childData = {
        className: cn('w-full truncate text-center'),
        children: optionText,
      };

      return (
        <li {...data} key={optionIndex}>
          {optionRender ? optionRender(option) : <div {...childData} />}
        </li>
      );
    });
  };

  // 暴露实例方法
  useImperativeHandle(ref, () => ({
    stopMomentum,
  }));

  return (
    <div
      className={cn(`
        relative flex-1 cursor-grab overflow-hidden
        active:cursor-grabbing
      `, className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <ul
        ref={wrapperRef}
        className="will-change-transform"
        style={{
          transform: `translate3d(0, ${offset + baseOffset}px, 0)`,
          transitionDuration: `${duration}ms`,
          transitionProperty: duration ? 'all' : 'none',
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.68, 1)',
        }}
        onTransitionEnd={stopMomentum}
      >
        {renderOptions()}
      </ul>
    </div>
  );
}

export default PickerColumn;
