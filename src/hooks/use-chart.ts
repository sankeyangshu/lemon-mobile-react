import type { EChartsCoreOption, EChartsInitOpts, SetOptionOpts } from 'echarts';
import type { RefObject } from 'react';
import { useDebounceFn, useElementSize } from '@reactuses/core';
import { useEffect, useRef, useState } from 'react';
import { echarts } from '@/plugins';
import { DARK_MODE_MEDIA_QUERY, useTheme } from '@/provider/theme';

interface ConfigProps {
  /**
   * ECharts init
   * @descCN ECharts 初始化函数的基本配置项
   * @see {@link https://echarts.apache.org/zh/api.html#echarts.init}
   */
  echartsInitOpts?: EChartsInitOpts;
  /**
   * Whether to enable transition animation
   * @descCN 是否开启过渡动画
   * @default true
   */
  animation?: boolean;
  /**
   * Transition animation duration (ms)
   * @descCN 过渡动画持续时间（毫秒）
   * @default 300
   */
  animationDuration?: number;
  /**
   * Whether to auto resize
   * @descCN 是否自动调整大小
   * @default true
   */
  autoResize?: boolean;
  /**
   * Resize debounce wait time (ms)
   * @descCN 调整大小的防抖等待时间（毫秒）
   * @default 300
   */
  resizeDebounceWait?: number;
}

/**
 * ECharts hook for React
 * @descCN React ECharts 图表 Hook
 * @param domRef - Chart container ref
 * @param config - Chart configuration
 */
export function useECharts(domRef: RefObject<HTMLDivElement | null>, config: ConfigProps = {}) {
  const {
    echartsInitOpts,
    animation = true,
    animationDuration = 300,
    autoResize = true,
    resizeDebounceWait = 300,
  } = config;

  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia(DARK_MODE_MEDIA_QUERY).matches);

  /**
   * Chart instance
   * @descCN 图表实例
   */
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  /**
   * Chart options
   * @descCN 图表配置项
   */
  const [chartOptions, setChartOptions] = useState<EChartsCoreOption | null>(null);

  /**
   * Toggle loading state
   * @descCN 切换加载状态
   * @param show - Whether to show loading
   */
  function toggleLoading(show: boolean) {
    if (!chartInstanceRef.current)
      return;
    if (show) {
      const textColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
      const maskColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.85)';
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();

      chartInstanceRef.current.showLoading('default', {
        color: primaryColor,
        textColor,
        fontSize: 16,
        maskColor,
      });
    } else {
      chartInstanceRef.current.hideLoading();
    }
  }

  /**
   * Initialize chart
   * @descCN 初始化图表
   */
  function initChart() {
    const dom = domRef.current;
    if (!dom || echarts.getInstanceByDom(dom))
      return;

    const chartTheme = isDark ? 'dark' : 'light';

    chartInstanceRef.current = echarts.init(dom, chartTheme, echartsInitOpts);

    toggleLoading(true);
  }

  /**
   * Destroy chart
   * @descCN 销毁图表实例
   */
  function destroy() {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }
  }

  /**
   * Render chart with options
   * @descCN 使用配置项渲染图表
   * @param options - Chart options
   * @param opts - SetOption configuration
   */
  function renderChart(options: EChartsCoreOption, opts: SetOptionOpts = { notMerge: true }) {
    if (!chartInstanceRef.current)
      return;

    const finalOptions = { ...options, backgroundColor: 'transparent' };
    chartInstanceRef.current.setOption(finalOptions, opts);
    setChartOptions(finalOptions);
    toggleLoading(false);
  }

  /**
   * Update chart options
   * @descCN 更新图表配置（合并模式）
   * @param options - Partial chart options to update
   */
  function updateOptions(options: Partial<EChartsCoreOption>) {
    if (!chartInstanceRef.current || !chartOptions)
      return;

    const updatedOptions = { ...chartOptions, ...options };
    renderChart(updatedOptions, { notMerge: false });
  }

  /**
   * Set chart options directly
   * @descCN 直接设置图表配置
   * @param options - Chart options
   */
  function setOptions(options: EChartsCoreOption) {
    chartInstanceRef.current?.setOption(options);
  }

  /**
   * Resize chart
   * @descCN 调整图表尺寸
   */
  function resize() {
    if (!chartInstanceRef.current)
      return;

    chartInstanceRef.current.resize({
      animation: {
        duration: animation ? animationDuration : 0,
      },
    });
  }

  /**
   * Debounced resize handler
   * @descCN 防抖处理的 resize 函数
   */
  const { run: resizeDebounceHandler } = useDebounceFn(resize, resizeDebounceWait) as { run: () => void };

  /**
   * Reset chart
   * @descCN 重置图表（清空图表数据）
   */
  function resetChart() {
    if (!chartInstanceRef.current)
      return;
    chartInstanceRef.current.clear();
  }

  /**
   * Get chart instance
   * @descCN 获取图表实例
   * @returns Chart instance or null
   */
  function getChartInstance() {
    return chartInstanceRef.current;
  }

  // Monitor theme changes and reinitialize chart automatically (监听主题变化，自动重新初始化图表)
  useEffect(() => {
    function handleThemeChange() {
      if (!chartInstanceRef.current)
        return;

      // Destroy old chart (销毁旧图表)
      destroy();

      // Initialize new chart (初始化新图表)
      initChart();

      // Render chart with previous options (使用之前的配置项渲染图表)
      if (chartOptions) {
        renderChart(chartOptions);
      }
    }

    handleThemeChange();
  }, [currentTheme]);

  // Monitor container size changes (监听容器尺寸变化，自动调整图表尺寸)
  const [sizeWidth, sizeHeight] = useElementSize(domRef);
  useEffect(() => {
    if (autoResize) {
      resizeDebounceHandler();
    }
  }, [sizeWidth, sizeHeight, autoResize]);

  // Initialize chart on mount and destroy on unmount (组件挂载时初始化图表，组件卸载时销毁图表)
  useEffect(() => {
    initChart();
    return () => {
      destroy();
    };
  }, []);

  return {
    getChartInstance,
    renderChart,
    updateOptions,
    setOptions,
    resetChart,
    toggleLoading,
  };
}
