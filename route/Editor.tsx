import React from 'react';
import {Editor, ShortcutKey} from 'amis-editor';
import {inject, observer} from 'mobx-react';
import {RouteComponentProps} from 'react-router-dom';
import {toast} from 'amis';
import {Icon} from '../icons/index';
import {IMainStore} from '../store';
import '../editor/DisabledEditorPlugin'; // 用于隐藏一些不需要的Editor预置组件
import '../renderer/MyRenderer';
import '../editor/MyRenderer';

let currentIndex = -1;

let host = `${window.location.protocol}//${window.location.host}`;
let iframeUrl = '/editor.html';

// 如果在 gh-pages 里面
if (/^\/amis-editor-demo/.test(window.location.pathname)) {
  host += '/amis-editor';
  iframeUrl = '/amis-editor-demo' + iframeUrl;
}

const schemaUrl = `${host}/schema.json`;

// @ts-ignore
__uri('amis/schema.json');

export default inject('store')(
  observer(function ({
    store,
    location,
    history,
    match
  }: {store: IMainStore} & RouteComponentProps<{id: string}>) {
    const index: number = parseInt(match.params.id, 10);
    console.log(store.pages[index])
    console.log(index, currentIndex);
    if (index !== currentIndex) {
      currentIndex = index;
      store.updateSchema(store.pages[index].schema);
    }
    console.log(store.schema)

    function save() {
      store.updatePageSchemaAt(index);

    }

    function exit() {
      history.push(`/${store.pages[index].path}`);
    }

    return (
      <div className='Editor-Demo'>
        <div className='Editor-header'>
          <div className='Editor-title'>amis 可视化编辑器</div>
          <div className='Editor-view-mode-group-container'>
            <div className='Editor-view-mode-group'>
              <div
                className={`Editor-view-mode-btn ${
                  !store.isMobile ? 'is-active' : ''
                }`}
                onClick={() => {
                  store.setIsMobile(false);
                }}
              >
                <Icon icon='pc-preview' title='PC模式' />
              </div>
              <div
                className={`Editor-view-mode-btn ${
                  store.isMobile ? 'is-active' : ''
                }`}
                onClick={() => {
                  store.setIsMobile(true);
                }}
              >
                <Icon icon='h5-preview' title='移动模式' />
              </div>
            </div>
          </div>

          <div className='Editor-header-actions'>
            <ShortcutKey />
            <div className={`header-action-btn margin-left-space ${
              store.preview ? 'primary' : ''
            }`} onClick={save}>
              保存
            </div>
            <div
              className={`header-action-btn margin-left-space ${
                store.preview ? 'primary' : ''
              }`}
              onClick={() => {
                store.setPreview(!store.preview);
              }}
            >
              {store.preview ? '编辑' : '预览'}
            </div>
            {!store.preview && (
              <div className={`header-action-btn exit-btn`} onClick={exit}>
                退出
              </div>
            )}
          </div>
        </div>
        <div className='Editor-inner'>
          <Editor
            theme={'cxd'}
            preview={store.preview}
            isMobile={store.isMobile}
            value={store.schema}
            onChange={(value: any) => store.updateSchema(value)}
            onPreview={() => {
              store.setPreview(true);
            }}
            onSave={save}
            className='is-fixed'
            $schemaUrl={schemaUrl}
            iframeUrl={iframeUrl}
            showCustomRenderersPanel={true}
            amisEnv={{
              fetcher: store.fetcher,
              notify: store.notify,
              alert: store.alert,
              copy: store.copy
            }}
          />
        </div>
      </div>
    );
  })
);
