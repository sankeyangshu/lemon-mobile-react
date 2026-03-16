/**
 * 成功返回函数
 * @param result 返回结果
 * @param options 配置项
 * @param options.message 消息
 * @returns result
 */
export function resultSuccess<T>(result: Record<string, T>, { message = 'success' } = {}) {
  return {
    code: 200,
    data: result,
    message,
    timestamp: Date.now(),
  };
}

export function resultError(message = 'Request failed', { code = 500, result = null } = {}) {
  return {
    code,
    data: result,
    message,
    type: 'error',
  };
}
