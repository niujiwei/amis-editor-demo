import React from 'react';
import {Provider} from 'mobx-react';
import {toast, alert, confirm} from 'amis';
import axios from 'axios';
import {MainStore} from './store/index';
import RootRoute from './route/index';
import copy from 'copy-to-clipboard';

export default function(): JSX.Element {
  const store = ((window as any).store = MainStore.create(
    {},
    {
      fetcher: ({url, method, data, config}: any) => {

        let appInfo = JSON.parse(window.localStorage.getItem('app'));
        let backContextPath = appInfo.backContextPath;
        let successErrCode = appInfo.successErrCode;
        url = url.startsWith('/') ? url : '/' + url;
        console.info(url);
        config = config || {};
        config.headers = config.headers || {};
        config.withCredentials = true;
        console.info(url);
        if (method !== 'post' && method !== 'put' && method !== 'patch') {
          if (data) {
            config.params = data;
          }
          return (axios as any)[method](url, config).then(function (res) {
            var data = res.data;
            return {
              data: {
                "status":  (data.errcode === successErrCode) ? 0 : (data.errcode===0?-1:data.errcode),
                "msg": data.errmsg,
                "data": data.data // 不能为空
              }
            }
          });
        } else if (data && data instanceof FormData) {
          // config.headers = config.headers || {};
          // config.headers['Content-Type'] = 'multipart/form-data';
        } else if (
          data &&
          typeof data !== 'string' &&
          !(data instanceof Blob) &&
          !(data instanceof ArrayBuffer)
        ) {
          data = JSON.stringify(data);
          config.headers['Content-Type'] = 'application/json';
        }

        return (axios as any)[method](url, data, config).then(function(res: any) {
          console.info('请求结果{}', res);
          var data = res.data;
          return {
            data: {//处理返回结果
              'status': (data.errcode === successErrCode) ? 0 : (data.errcode === 0 ? -1 : data.errcode),
              'msg': data.errmsg,
              'data': data.data // 不能为空
            }
          };
        }).catch(function(res: any) {
          console.info('异常响应结果', res);
        });
      },
      isCancel: (e: any) => axios.isCancel(e),
      notify: (type: 'success' | 'error' | 'info', msg: string) => {
        toast[type]
          ? toast[type](msg, type === 'error' ? '系统错误' : '系统消息')
          : console.warn('[Notify]', type, msg);
        console.log('[notify]', type, msg);
      },
      alert,
      confirm,
      copy: (contents: string, options: any = {}) => {
        const ret = copy(contents, options);
        ret && (!options || options.shutup !== true) && toast.info('内容已拷贝到剪切板');
        return ret;
      }
    }
  ));

  return (
    <Provider store={store}>
      <RootRoute store={store} />
    </Provider>
  );
}
