import { i18n } from '@/locales';

const BUILD_TIME_META_REG = /<meta name="buildTime" content="(.*)">/;

/**
 * Setup application version notification
 * @descCN 设置应用版本更新通知
 */
export function setupAppVersionNotification() {
  const canAutoUpdateApp = import.meta.env.VITE_AUTOMATICALLY_DETECT_UPDATE && import.meta.env.PROD;

  if (!canAutoUpdateApp)
    return;

  let isShow = false;

  document.addEventListener('visibilitychange', () => {
    void (async () => {
      const preConditions = [!isShow, document.visibilityState === 'visible', !import.meta.env.DEV];

      if (!preConditions.every(Boolean))
        return;

      const buildTime = await getHtmlBuildTime();

      if (buildTime === BUILD_TIME)
        return;

      isShow = true;
      showUpdateNotification();
    })();
  });

  /**
   * Show update notification using DaisyUI modal
   * @descCN 使用 DaisyUI modal 显示更新通知
   */
  function showUpdateNotification() {
    const modalId = 'lemon_app_update_modal';

    // 创建 dialog 元素
    const dialog = document.createElement('dialog');
    dialog.id = modalId;
    dialog.className = 'modal';

    // 使用 innerHTML 创建模态框内容
    dialog.innerHTML = `
      <div class="modal-box">
        <h3 class="text-lg font-bold">${i18n.t('system.updateTitle')}</h3>
        <p class="py-4">${i18n.t('system.updateContent')}</p>
        <div class="modal-action">
          <button class="btn" type="button" data-action="cancel">
            ${i18n.t('system.updateCancel')}
          </button>
          <button class="btn btn-primary" type="button" data-action="confirm">
            ${i18n.t('system.updateConfirm')}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button">close</button>
      </form>
    `;

    // 添加到 body
    document.body.appendChild(dialog);

    // 绑定按钮事件
    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    const confirmBtn = dialog.querySelector('[data-action="confirm"]');
    const backdrop = dialog.querySelector('.modal-backdrop button');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeNotification);
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        location.reload();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeNotification);
    }

    // 显示模态框
    setTimeout(() => {
      dialog.showModal();
      // 移除第一个按钮的焦点，避免显示外边框
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);

    /**
     * Close notification
     * @descCN 关闭通知
     */
    function closeNotification() {
      dialog.close();
      setTimeout(() => {
        dialog.remove();
        isShow = false;
      }, 300);
    }
  }
}

/**
 * Get HTML build time from meta tag
 * @descCN 从 meta 标签获取 HTML 构建时间
 * @returns Build time string
 */
async function getHtmlBuildTime() {
  try {
    const res = await fetch(`/index.html?time=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    const html = await res.text();
    const match = html.match(BUILD_TIME_META_REG);
    const buildTime = match?.[1];

    return buildTime ?? '';
  } catch {
    return '';
  }
}
