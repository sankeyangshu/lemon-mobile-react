import type { FC } from 'react';
import type { Article } from '@/api/system/demo';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { isNotNil } from 'es-toolkit';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { postArticleListAPI } from '@/api/system/demo';
import NavBar from '@/components/custom/nav-bar';
import SvgIcon from '@/components/custom/svg-icon';

export const Route = createFileRoute('/example/pagination')({
  staticData: {
    title: '分页示例',
    i18nKey: 'router.pagination',
  },
  component: RouteComponent,
});

const Card: FC<{ article: Article }> = ({ article }) => {
  return (
    <div className={`
      overflow-hidden rounded-box bg-white
      dark:bg-[#1C1C1E]
    `}
    >
      {/* 封面图片 */}
      <div className="h-40 w-full">
        <img
          src={article.coverImage}
          alt={article.title}
          className="size-full object-cover"
        />
      </div>
      {/* 文章内容 */}
      <div className="box-border p-4">
        {/* 标题 */}
        <h3 className="mb-2 truncate text-base text-base-content">
          {article.title}
        </h3>
        {/* 内容摘要 */}
        <p className="mb-3 line-clamp-2 text-sm text-base-content/30">
          {article.content}
        </p>

        {/* 底部信息 */}
        <div className={`
          flex items-center justify-between border-t border-[#EBEDF0] pt-3 text-xs
          text-base-content/30
          dark:border-[#3a3a3c]
        `}
        >
          <div className="flex items-center space-x-3">
            {/* 作者 */}
            <div className="flex items-center space-x-1">
              <SvgIcon icon="heroicons:user-16-solid" className="size-3.5" />
              <span className="max-w-20 truncate">{article.author}</span>
            </div>
            {/* 浏览量 */}
            <div className="flex items-center space-x-1">
              <SvgIcon icon="heroicons:eye-16-solid" className="size-3.5" />
              <span>{article.views > 999 ? `${(article.views / 1000).toFixed(1)}k` : article.views}</span>
            </div>
            {/* 点赞数 */}
            <div className="flex items-center space-x-1">
              <SvgIcon icon="heroicons:heart-16-solid" className="size-3.5" />
              <span>{article.likes}</span>
            </div>
          </div>
          {/* 时间 */}
          <div className="flex items-center space-x-1">
            <SvgIcon icon="heroicons:clock-16-solid" className="size-3.5" />
            <span>{format(article.createTime, 'MM月dd日', { locale: zhCN })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ['articleList'],
    queryFn: async ({ pageParam }) => postArticleListAPI({ pageNum: pageParam, pageSize: 10 }),
    initialPageParam: 1, // 第一次加载时的页码
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;

      return pagination.hasNext ? pagination.pageNum + 1 : undefined;
    },
  });

  const articles = data?.pages.flatMap((page) => page.list) || [];

  // 创建滚动容器的引用
  const parentRef = useRef<HTMLDivElement>(null);

  // 配置虚拟滚动器
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? articles.length + 1 : articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 316, // 估计每个项目的高度（卡片高度 + 间距）
    overscan: 5, // 预渲染的项目数量
  });

  // 监听滚动位置，触底加载下一页
  useEffect(() => {
    const [lastItem] = rowVirtualizer.getVirtualItems().toReversed();

    if (!isNotNil(lastItem)) {
      return;
    }

    if (
      lastItem.index >= articles.length - 1
      && hasNextPage
      && !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    articles.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <>
      <NavBar
        title={t('router.pagination')}
        fixed
        placeholder
        leftArrow={(
          <SvgIcon className="text-2xl" icon="mdi:chevron-left" />
        )}
        onClickLeft={() => router.history.back()}
      />

      {status === 'success' && (
        <>
          <div
            ref={parentRef}
            className="h-[calc(100vh-60px)] overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const isLoaderRow = virtualItem.index > articles.length - 1;
                const article = articles[virtualItem.index];

                return (
                  <div
                    key={virtualItem.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {isLoaderRow
                      ? (
                          <div className="flex items-center justify-center py-8">
                            {hasNextPage
                              ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="loading loading-md loading-spinner" />
                                    <span className="text-base-content/50">{t('system.loading')}</span>
                                  </div>
                                )
                              : (
                                  <span className="text-base-content/30">{t('system.noMore')}</span>
                                )}
                          </div>
                        )
                      : (
                          <div className="px-4 pb-4">
                            <Card article={article} />
                          </div>
                        )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 后台更新提示 */}
          {isFetchingNextPage && (
            <div className={`
              fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-base-300/90 px-4 py-2
              backdrop-blur-sm
            `}
            >
              <div className="flex items-center space-x-2">
                <span className="loading loading-sm loading-spinner" />
                <span className="text-sm text-base-content/70">更新中...</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
