import type { CSSProperties, ReactNode } from 'react';
import type { PickerColumnInstance, PickerColumnOption } from './picker-column';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import Popup from '../popup';
import PickerColumn from './picker-column';

/**
 * Picker 选项配置
 */
export interface PickerProps {
  /**
   * 对象数组，配置每一列显示的数据
   */
  columns?: PickerColumnOption[] | PickerColumnOption[][];
  /**
   * 顶部栏标题
   */
  title?: ReactNode;
  /**
   * 确认按钮文字
   * @default '确认'
   */
  confirmButtonText?: ReactNode;
  /**
   * 取消按钮文字
   * @default '取消'
   */
  cancelButtonText?: ReactNode;
  /**
   * 是否显示顶部栏
   * @default true
   */
  toolbar?: boolean;
  /**
   * 是否显示加载状态
   * @default false
   */
  loading?: boolean;
  /**
   * 选项高度，支持 rem/vh 等单位
   * @default 44
   */
  itemHeight?: number;
  /**
   * 可见选项个数
   * @default 6
   */
  visibleItemCount?: number;
  /**
   * 惯性滚动时长，单位 ms
   * @default 1000
   */
  swipeDuration?: number;
  /**
   * 选项对象中，文字对应的 key
   * @default 'text'
   */
  columnsFieldNames?: {
    text?: string;
    value?: string;
    children?: string;
  };
  /**
   * 是否显示弹出层
   */
  visible?: boolean;
  /**
   * 是否只读状态
   * @default false
   */
  readOnly?: boolean;
  /**
   * 单列选择时，默认选中项的索引
   */
  defaultIndex?: number;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 样式
   */
  style?: CSSProperties;
  /**
   * 点击完成按钮时触发
   */
  onConfirm?: (selectedValues: PickerColumnOption | PickerColumnOption[], selectedIndexes: number | number[]) => void;
  /**
   * 点击取消按钮时触发
   */
  onCancel?: () => void;
  /**
   * 选项改变时触发
   */
  onChange?: (selectedValues: PickerColumnOption | PickerColumnOption[], selectedIndexes: number | number[], columnIndex: number) => void;
  /**
   * 关闭弹出层时触发
   */
  onClose?: () => void;
  /**
   * 自定义选项内容
   */
  optionRender?: (option: PickerColumnOption) => ReactNode;
  /**
   * 子元素（用于自定义内容）
   */
  children?: ReactNode;
}

export interface PickerInstance {
  /**
   * 停止惯性滚动
   */
  stopMomentum: () => void;
}

function Picker(props: PickerProps & { ref?: React.Ref<PickerInstance> }) {
  const { t } = useTranslation();

  const {
    ref,
    columns = [],
    title,
    confirmButtonText = t('system.confirm'),
    cancelButtonText = t('system.cancel'),
    toolbar = true,
    loading = false,
    itemHeight = 44,
    visibleItemCount = 6,
    swipeDuration = 1000,
    columnsFieldNames = {},
    visible = false,
    readOnly = false,
    defaultIndex = 0,
    className,
    style,
    onConfirm,
    onCancel,
    onChange,
    onClose,
    optionRender,
    children,
  } = props;

  const {
    text: textKey = 'text',
    value: valueKey = 'value',
  } = columnsFieldNames;

  const columnRef = useRef<(PickerColumnInstance | null)[]>([]);

  // 格式化列数据
  // React Compiler 会自动优化
  const formattedColumns = Array.isArray(columns[0]) ? columns : [columns];

  // 初始化选中值 - React Compiler 会优化这些状态
  const getInitialValues = () => {
    return formattedColumns.map((column, index) => {
      const col = column as PickerColumnOption[];
      const initialIndex = index === 0 ? defaultIndex : 0;
      const option = col[initialIndex];
      return option !== undefined ? option : {};
    });
  };

  const getInitialIndexes = () => {
    return formattedColumns.map((_, index) => (index === 0 ? defaultIndex : 0));
  };

  const [selectedValues, setSelectedValues] = useState<PickerColumnOption[]>(getInitialValues);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(getInitialIndexes);

  // 选项改变
  const handleSelect = (option: PickerColumnOption, columnIndex: number) => {
    const newSelectedValues = [...selectedValues];
    const newSelectedIndexes = [...selectedIndexes];

    const column = formattedColumns[columnIndex] as PickerColumnOption[];
    const optionIndex = column.findIndex((item) => item[valueKey] === option[valueKey]);

    newSelectedValues[columnIndex] = option;
    newSelectedIndexes[columnIndex] = optionIndex;

    setSelectedValues(newSelectedValues);
    setSelectedIndexes(newSelectedIndexes);

    onChange?.(
      formattedColumns.length === 1 ? newSelectedValues[0] : newSelectedValues,
      formattedColumns.length === 1 ? newSelectedIndexes[0] : newSelectedIndexes,
      columnIndex,
    );
  };

  // 确认
  const handleConfirm = () => {
    onConfirm?.(
      formattedColumns.length === 1 ? selectedValues[0] : selectedValues,
      formattedColumns.length === 1 ? selectedIndexes[0] : selectedIndexes,
    );
    if (onClose) {
      onClose();
    }
  };

  // 取消
  const handleCancel = () => {
    onCancel?.();
    if (onClose) {
      onClose();
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    onClose?.();
  };

  // 停止惯性滚动
  const stopMomentum = () => {
    columnRef.current.forEach((col) => {
      col?.stopMomentum();
    });
  };

  // 暴露实例方法
  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        stopMomentum,
      };
    }
  }, [ref]);

  // 渲染工具栏
  const renderToolbar = () => {
    if (toolbar === false) {
      return null;
    }

    return (
      <div className={`
        flex items-center justify-between bg-white px-4
        dark:bg-[#1C1C1E]
      `}
      >
        <button
          type="button"
          className={`
            h-11 px-4 text-sm text-[#707070]
            active:opacity-70
            dark:text-[#969799]
          `}
          onClick={handleCancel}
        >
          {cancelButtonText}
        </button>

        {title !== undefined && (
          <div className="flex-1 text-center text-base font-medium text-base-content">
            {title}
          </div>
        )}

        <button
          type="button"
          className={`
            h-11 px-4 text-sm text-primary
            active:opacity-70
          `}
          onClick={handleConfirm}
        >
          {confirmButtonText}
        </button>
      </div>
    );
  };

  // 渲染列
  const renderColumns = () => {
    return (
      <div className="flex h-full">
        {formattedColumns.map((column, columnIndex) => (
          <PickerColumn
            key={columnIndex}
            ref={(el) => {
              columnRef.current[columnIndex] = el;
            }}
            options={column as PickerColumnOption[]}
            value={selectedValues[columnIndex]?.[valueKey] as string | number | undefined}
            textKey={textKey}
            valueKey={valueKey}
            itemHeight={itemHeight}
            visibleItemCount={visibleItemCount}
            swipeDuration={swipeDuration}
            readOnly={readOnly}
            index={columnIndex}
            onSelect={handleSelect}
            optionRender={optionRender}
          />
        ))}
      </div>
    );
  };

  // 渲染加载状态
  const renderLoading = () => {
    if (loading === false) {
      return null;
    }

    return (
      <div className={`
        absolute inset-0 z-20 flex items-center justify-center bg-white/80
        dark:bg-[#1C1C1E]/80
      `}
      >
        <div className={`
          size-8 animate-spin rounded-full border-2 border-primary border-t-transparent
        `}
        />
      </div>
    );
  };

  const pickerHeight = itemHeight * visibleItemCount;

  return (
    <Popup
      visible={visible}
      position="bottom"
      round
      onClose={handleClose}
      closeOnClickOverlay={onClose !== undefined}
      safeAreaInsetBottom
    >
      <div
        className={cn(`
          relative bg-white
          dark:bg-[#1C1C1E]
        `, className)}
        style={style}
      >
        {renderToolbar()}

        <div
          className="relative overflow-hidden"
          style={{
            height: `${pickerHeight}px`,
          }}
        >
          {children !== undefined ? children : renderColumns()}

          {/* 选中框 */}
          <div
            className={`
              pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 border-y
              border-[#EBEDF0]
              dark:border-[#3a3a3c]
            `}
            style={{
              height: `${itemHeight}px`,
            }}
          />

          {renderLoading()}
        </div>
      </div>
    </Popup>
  );
}

export default Picker;
