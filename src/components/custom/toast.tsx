import type { CSSProperties, Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { isNotNil } from 'es-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cn } from '@/lib/utils';
import Popup from './popup';
import SvgIcon from './svg-icon';

type ToastType = 'loading' | 'success' | 'fail' | 'info';

type ToastPosition = 'top' | 'middle' | 'bottom';

type LoadingType = 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';

interface ToastProps {
  /** 提示类型 */
  type?: ToastType;
  /** 文本内容，支持通过\n换行 */
  message?: number | string | ReactNode;
  /** 展示时长(ms)，值为 0 时，toast 不会消失 */
  duration?: number;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 图标大小，如 20px 2em，默认单位为 px */
  iconSize?: number | string;
  /** 加载图标类型, 可选值为 spinner */
  loadingType?: LoadingType;
  /** 是否显示背景遮罩层 */
  overlay?: boolean;
  /** 自定义遮罩层类名 */
  overlayClass?: string;
  /** 自定义遮罩层样式 */
  overlayStyle?: CSSProperties;
  /** 是否禁止背景点击 */
  forbidClick?: boolean;
  /** 是否在点击遮罩层后关闭 */
  closeOnClickOverlay?: boolean;
  /** 是否在点击后关闭 */
  closeOnClick?: boolean;
  /** 位置，可选值为 top middle bottom */
  position?: ToastPosition;
  /** 动画时长，单位ms */
  transitionDuration?: number;
  /** 轻提示弹出时的的父容器 */
  teleport?: () => HTMLElement;
  /** 自定义类名 */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
  /** 关闭时的回调函数 */
  onClose?: () => void;
  /** 完全展示后的回调函数 */
  onOpened?: () => void;
  /** 完全关闭后的回调函数 */
  onClosed?: () => void;
}

export type ToastOptions = Omit<ToastProps, 'type'> | string;

interface TempToastProps {
  initialProps: ToastProps;
  container: HTMLElement;
  root: ReturnType<typeof createRoot>;
  updateRef: ToastReturnType;
  onClose?: () => void;
}

export interface ToastReturnType {
  /** 动态更新方法 */
  config: Dispatch<SetStateAction<ToastProps>>;
  /** 清除单例toast */
  clear: () => void;
}

export interface ToastInstance {
  (opts: ToastProps | string): ToastReturnType;
  /** 文本提示 */
  info: (opts: ToastOptions) => ToastReturnType;
  /** 展示加载提示 */
  loading: (opts: ToastOptions) => ToastReturnType;
  /** 展示成功提示 */
  success: (opts: ToastOptions) => ToastReturnType;
  /** 展示失败提示 */
  fail: (opts: ToastOptions) => ToastReturnType;
  /** 关闭提示 */
  clear: () => void;
}

const BaseToast: FC<ToastProps & { visible?: boolean }> = (props) => {
  const {
    visible = false,
    type = 'info',
    message,
    icon,
    iconSize = '36px',
    loadingType = 'spinner',
    overlay = false,
    overlayClass,
    overlayStyle,
    forbidClick = false,
    closeOnClickOverlay = false,
    closeOnClick = false,
    position = 'middle',
    transitionDuration = 300,
    className,
    style,
    onClose,
    onOpened,
    onClosed,
    teleport,
  } = props;

  // 点击事件
  const handleClick = () => {
    if (closeOnClick) {
      onClose?.();
    }
  };

  // 禁止点击样式控制
  useEffect(() => {
    if (!visible) {
      document.body.classList.remove('pointer-events-none');
      return;
    }

    if (visible && forbidClick) {
      document.body.classList.add('pointer-events-none');
    }

    return () => {
      document.body.classList.remove('pointer-events-none');
    };
  }, [visible, forbidClick]);

  // 渲染图标
  const renderIcon = () => {
    // 如果有自定义图标，直接返回自定义图标
    if (isNotNil(icon)) {
      return <div className="mb-2 text-4xl" style={{ fontSize: iconSize }}>{icon}</div>;
    }

    // 根据类型返回内置图标
    if (type === 'success') {
      return <SvgIcon icon="mdi:check" className="mb-2 text-4xl" style={{ fontSize: iconSize }} />;
    }

    if (type === 'fail') {
      return <SvgIcon icon="mdi:close" className="mb-2 text-4xl" style={{ fontSize: iconSize }} />;
    }

    if (type === 'loading') {
      const loadingClasses: Record<LoadingType, string> = {
        spinner: 'loading-spinner',
        dots: 'loading-dots',
        ring: 'loading-ring',
        ball: 'loading-ball',
        bars: 'loading-bars',
        infinity: 'loading-infinity',
      };
      return (
        <span
          className={cn(
            'loading mb-2 loading-sm',
            loadingClasses[loadingType],
          )}
          style={{ fontSize: iconSize }}
        />
      );
    }

    return null;
  };

  // 渲染消息内容
  const renderMessage = () => {
    if (isNotNil(message) && message !== '') {
      return <>{message}</>;
    }
    return null;
  };

  // 判断是否有图标
  const hasIcon = isNotNil(icon) || type !== 'info';

  // 获取位置映射
  const positionMap: Record<ToastPosition, 'top' | 'center' | 'bottom'> = {
    top: 'top',
    middle: 'center',
    bottom: 'bottom',
  };

  return (
    <Popup
      visible={visible}
      position={positionMap[position]}
      overlay={overlay}
      overlayClassName={overlayClass}
      overlayStyle={overlayStyle}
      closeOnClickOverlay={closeOnClickOverlay}
      lockScroll={true}
      duration={transitionDuration}
      transition={cn('animate-in fade-in', { 'animate-out fade-out': !visible })}
      teleport={teleport}
      onClick={handleClick}
      onClose={onClose}
      onOpened={onOpened}
      onClosed={onClosed}
      className={cn(
        `
          pointer-events-auto box-content flex flex-col items-center justify-center
          bg-[rgba(0,0,0,0.7)] text-center wrap-break-word whitespace-pre-wrap text-white
        `,
        {
          // 有图标时的样式
          'min-h-22 w-22 max-w-[70vw] rounded-lg p-4 text-sm/5': hasIcon,
          // 纯文本时的样式
          'max-w-[70vw] min-w-24 rounded-lg px-3 py-2 text-sm/5': !hasIcon,
        },
        className,
      )}
      style={style}
    >
      {renderIcon()}
      {renderMessage()}
    </Popup>
  );
};

// 默认配置
const defaultOptions: ToastProps = {
  message: '',
  className: '',
  type: 'info',
  position: 'middle',
  forbidClick: false,
  duration: 2000,
  transitionDuration: 300,
  teleport: function teleportFunc() {
    return document.body;
  },
};

const toastArray: (() => void)[] = [];

// 同步的销毁
function syncClear() {
  let fn = toastArray.pop();
  while (fn) {
    fn();
    fn = toastArray.pop();
  }
}

// 针对 toast 还没弹出来就立刻销毁的情况，将销毁放到下一个 event loop 中，避免销毁失败。
function nextTickClear() {
  setTimeout(syncClear);
}

// 解析参数
function parseOptions(message: ToastProps | string): ToastProps {
  if (typeof message === 'object') {
    return message;
  }
  return { message };
}

const TempToast: FC<TempToastProps> = ({ initialProps, container, root, updateRef, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ToastProps>({ ...initialProps });
  const timerRef = { current: 0 };

  // clearDOM after animation
  const internalOnClosed = useCallback(() => {
    if (state.forbidClick) {
      document.body.classList.remove('pointer-events-none');
    }
    setVisible(false);
    const animationDuration = state.transitionDuration ?? defaultOptions.transitionDuration ?? 300;
    window.setTimeout(() => {
      root.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, animationDuration);
  }, [state.forbidClick, state.transitionDuration, root, container]);

  // close with animation
  const destroy = useCallback(() => {
    setVisible(false);
    if (onClose)
      onClose();
  }, [onClose]);

  updateRef.clear = internalOnClosed;

  updateRef.config = useCallback(
    (nextState) => {
      setState((prev) => {
        if (typeof nextState === 'function') {
          return { ...prev, ...nextState(prev) };
        }
        return { ...prev, ...nextState };
      });
    },
    [],
  );

  useEffect(() => {
    setVisible(true);
    syncClear();
    toastArray.push(internalOnClosed);

    const duration = state.duration ?? 0;
    if (duration > 0) {
      timerRef.current = window.setTimeout(destroy, duration);
    }

    return () => {
      if (timerRef.current !== 0) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <BaseToast
      {...state}
      visible={visible}
      teleport={() => container}
      onClose={destroy}
      onClosed={internalOnClosed}
    />
  );
};

// 可返回用于销毁此弹窗的方法
function ToastFunc(p: ToastProps | string): ToastReturnType {
  const props = { ...defaultOptions, ...parseOptions(p) };

  const update: ToastReturnType = {
    config: () => {},
    clear: () => null,
  };

  const { onClose, teleport } = props;
  const container = document.createElement('div');
  const bodyContainer = teleport?.() || document.body;
  bodyContainer.appendChild(container);
  const root = createRoot(container);

  root.render(
    <TempToast
      initialProps={props}
      container={container}
      root={root}
      updateRef={update}
      onClose={onClose}
    />,
  );

  return update;
}

function createMethod(type: ToastType) {
  return (options: ToastOptions) =>
    ToastFunc({
      ...parseOptions(options),
      type,
    });
}

// 创建快捷方法
const info = createMethod('info');
const loading = createMethod('loading');
const success = createMethod('success');
const fail = createMethod('fail');

const Toast = Object.assign(ToastFunc, {
  info,
  loading,
  success,
  fail,
  clear: nextTickClear,
}) as ToastInstance;

export default Toast;
