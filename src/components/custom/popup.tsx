import type { CSSProperties, FC, MouseEvent, ReactNode, Ref } from 'react';
import type { OverlayProps } from './overlay';
import { useEventListener } from '@reactuses/core';
import { isNotNil } from 'es-toolkit';
import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import Overlay from './overlay';
import SvgIcon from './svg-icon';

export type PopupPosition = 'top' | 'left' | 'bottom' | 'right' | 'center' | '';

export type PopupCloseIconPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PopupProps extends Omit<OverlayProps, 'closeOnOverlayClick' | 'onClick'> {
  /**
   * 自定义标题
   */
  title?: string | ReactNode;
  /**
   * 自定义描述
   */
  description?: string | ReactNode;
  /**
   * 是否显示弹出层
   */
  visible?: boolean;
  /**
   * 是否显示圆角
   * @default false
   */
  round?: boolean;
  /**
   * 是否显示关闭图标
   * @default false
   */
  closeable?: boolean;
  /**
   * 关闭图标
   */
  closeIcon?: ReactNode;
  /**
   * 弹出位置
   * @default 'center'
   */
  position?: PopupPosition;
  /**
   * 关闭图标位置
   * @default 'top-right'
   */
  closeIconPosition?: PopupCloseIconPosition;
  /**
   * 是否显示遮罩层
   * @default true
   */
  overlay?: boolean;
  /**
   * 自定义遮罩层类名
   */
  overlayClassName?: string;
  /**
   * 自定义遮罩层样式
   */
  overlayStyle?: CSSProperties;
  /**
   * 关闭时销毁 Popup 里的子元素
   * @default false
   */
  destroyOnClose?: boolean;
  /**
   * 强制渲染 Popup
   * @default false
   */
  forceRender?: boolean;
  /**
   * 是否在点击遮罩层后关闭
   * @default true
   */
  closeOnClickOverlay?: boolean;
  /**
   * 是否在页面回退时自动关闭
   * @default false
   */
  closeOnPopstate?: boolean;
  /**
   * 是否开启底部安全区适配
   * @default false
   */
  safeAreaInsetBottom?: boolean;
  /**
   * 动画类名
   */
  transition?: string;
  /**
   * 子元素
   */
  children?: ReactNode;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 样式
   */
  style?: CSSProperties;
  /**
   * 点击弹出层时触发
   */
  onClick?: (e: MouseEvent) => void;
  /**
   * 点击关闭图标时触发
   */
  onClickCloseIcon?: (e: MouseEvent) => void;
  /**
   * 点击遮罩层时触发
   */
  onClickOverlay?: (e: MouseEvent) => void;
  /**
   * 打开弹出层时触发
   */
  onOpen?: () => void;
  /**
   * 关闭弹出层触发
   */
  onClose?: () => void;
  /**
   * 打开弹出层且动画结束后触发
   */
  onOpened?: () => void;
  /**
   * 关闭弹出层且动画结束后触发
   */
  onClosed?: () => void;
  /**
   * 关闭前的回调函数，返回 false 可阻止关闭，支持返回 Promise
   */
  beforeClose?: (action: string | number) => boolean | Promise<boolean>;
  /**
   * 指定挂载的节点
   */
  teleport?: () => HTMLElement;
}

export interface PopupInstanceType {
  popupRef: React.RefObject<HTMLDivElement | null>;
}

let globalZIndex = 2000;

const Popup: FC<PopupProps & { ref?: Ref<PopupInstanceType> }> = (props) => {
  const {
    ref,
    visible = false,
    zIndex: propsZIndex,
    duration = 300,
    lockScroll = true,
    round = false,
    closeable = false,
    closeIcon = <SvgIcon icon="mdi:close" className="size-5" />,
    position = 'center',
    closeIconPosition = 'top-right',
    overlay = true,
    overlayClassName,
    overlayStyle,
    destroyOnClose: _destroyOnClose = false,
    forceRender = false,
    closeOnClickOverlay = true,
    closeOnPopstate = false,
    safeAreaInsetBottom = false,
    transition,
    title,
    description,
    children,
    className,
    style,
    onClick,
    onOpen,
    onClose,
    onClickOverlay,
    onClickCloseIcon,
    onOpened,
    onClosed,
    beforeClose,
    teleport = () => document.body,
  } = props;

  const openedRef = useRef(false);
  const zIndexRef = useRef<number>(propsZIndex ?? globalZIndex);
  const popupRef = useRef<HTMLDivElement>(null);
  const [innerVisible, setInnerVisible] = useState(visible);
  const [shouldRender, setShouldRender] = useState(visible);

  const popupStyle = {
    'zIndex': zIndexRef.current,
    '--tw-duration': `${duration}ms`,
    ...style,
  };

  // 打开弹窗
  const open = () => {
    if (propsZIndex !== undefined) {
      zIndexRef.current = propsZIndex;
    } else {
      zIndexRef.current = globalZIndex++;
    }

    openedRef.current = true;
    onOpen?.();
  };

  // 关闭弹窗
  const close = async () => {
    if (beforeClose) {
      try {
        const result = await beforeClose('close');
        if (!result)
          return;
      } catch {
        return;
      }
    }

    openedRef.current = false;
    onClose?.();
  };

  // 点击遮罩层
  const handleClickOverlay = (event: MouseEvent) => {
    onClickOverlay?.(event);

    if (closeOnClickOverlay) {
      void close();
    }
  };

  // 渲染遮罩层
  const renderOverlay = () => {
    if (overlay) {
      return (
        <Overlay
          visible={visible}
          className={overlayClassName}
          style={overlayStyle}
          zIndex={zIndexRef.current}
          duration={duration}
          lockScroll={lockScroll}
          onClick={handleClickOverlay}
        />
      );
    }

    return null;
  };

  // 点击关闭图标
  const handleClickCloseIcon = (e: MouseEvent) => {
    onClickCloseIcon?.(e);
    void close();
  };

  // 渲染关闭图标
  const renderCloseIcon = () => {
    if (closeable) {
      return (
        <div
          className={cn(
            `
              absolute z-10 cursor-pointer text-[#c8c9cc]
              active:text-[#969799]
            `,
            {
              'top-4 left-4': closeIconPosition === 'top-left',
              'top-4 right-4': closeIconPosition === 'top-right',
              'bottom-4 left-4': closeIconPosition === 'bottom-left',
              'right-4 bottom-4': closeIconPosition === 'bottom-right',
            },
          )}
          onClick={handleClickCloseIcon}
        >
          {closeIcon}
        </div>
      );
    }

    return null;
  };

  // 渲染标题
  const renderTitle = () => {
    if (isNotNil(title)) {
      return <div className="mx-3 my-5 text-center text-base/4 font-medium">{title}</div>;
    }

    return null;
  };

  // 渲染描述
  const renderDescription = () => {
    if (isNotNil(description)) {
      return <div className="mx-5 text-sm text-[#969799]">{description}</div>;
    }

    return null;
  };

  // 获取动画类名
  const getAnimationClasses = () => {
    // 如果提供了自定义 transition，直接返回
    if (transition !== undefined) {
      return transition;
    }

    const baseClasses: string[] = [];

    if (visible) {
      // 进入动画
      baseClasses.push('animate-in');

      if (position === 'center') {
        baseClasses.push('fade-in', 'zoom-in');
      } else if (position === 'top') {
        baseClasses.push('fade-in', 'slide-in-from-top');
      } else if (position === 'bottom') {
        baseClasses.push('fade-in', 'slide-in-from-bottom');
      } else if (position === 'left') {
        baseClasses.push('fade-in', 'slide-in-from-left');
      } else if (position === 'right') {
        baseClasses.push('fade-in', 'slide-in-from-right');
      }
    } else {
      // 退出动画
      baseClasses.push('animate-out');

      if (position === 'center') {
        baseClasses.push('fade-out', 'zoom-out');
      } else if (position === 'top') {
        baseClasses.push('fade-out', 'slide-out-to-top');
      } else if (position === 'bottom') {
        baseClasses.push('fade-out', 'slide-out-to-bottom');
      } else if (position === 'left') {
        baseClasses.push('fade-out', 'slide-out-to-left');
      } else if (position === 'right') {
        baseClasses.push('fade-out', 'slide-out-to-right');
      }
    }

    return baseClasses.join(' ');
  };

  // 渲染弹窗内容
  const renderPopup = () => {
    if (!shouldRender && !forceRender) {
      return null;
    }

    return (
      <div
        ref={popupRef}
        style={{
          ...popupStyle,
          visibility: !innerVisible && !visible ? 'hidden' : 'visible',
        }}
        className={cn(
          `
            fixed max-h-full overflow-y-auto bg-white
            dark:bg-[#1C1C1E]
          `,
          {
            'rounded-2xl': round && position === 'center',
            'rounded-b-2xl': round && position === 'top',
            'rounded-t-2xl': round && position === 'bottom',
            'rounded-r-2xl': round && position === 'left',
            'rounded-l-2xl': round && position === 'right',
            'top-1/2 left-1/2 -translate-1/2': position === 'center',
            'top-0 left-0 w-full': position === 'top',
            'bottom-0 left-0 w-full': position === 'bottom',
            'bottom-0 left-0 h-full': position === 'left',
            'right-0 bottom-0 h-full': position === 'right',
            'pb-safe': safeAreaInsetBottom,
          },
          getAnimationClasses(),
          className,
        )}
        onClick={onClick}
        onAnimationEnd={(e) => {
          // 只处理当前元素的动画结束事件，避免子元素的动画事件冒泡
          if (e.target === popupRef.current) {
            if (innerVisible) {
              onOpened?.();
            } else {
              // 延迟一帧再移除 DOM，确保动画完全结束
              requestAnimationFrame(() => {
                setShouldRender(false);
                onClosed?.();
              });
            }
          }
        }}
      >
        {renderTitle()}
        {renderDescription()}
        {children}
        {renderCloseIcon()}
      </div>
    );
  };

  // 监听页面回退
  useEventListener('popstate', () => {
    if (closeOnPopstate) {
      void close();
    }
  });

  // 监听 visible 变化
  useLayoutEffect(() => {
    if (visible) {
      setShouldRender(true);
      // 延迟一帧让 DOM 先渲染
      requestAnimationFrame(() => {
        setInnerVisible(true);
      });
      open();
    } else {
      setInnerVisible(false);
    }
  }, [visible]);

  // 暴露实例方法
  useImperativeHandle(ref, () => ({
    popupRef,
  }));

  // 渲染到指定容器
  const container = teleport();
  return createPortal(
    <>
      {renderOverlay()}
      {renderPopup()}
    </>,
    container,
  );
};

export default Popup;
