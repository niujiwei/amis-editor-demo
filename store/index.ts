import {types, getEnv, applySnapshot, getSnapshot} from 'mobx-state-tree';
import {PageStore} from './Page';
import {when, reaction} from 'mobx';
import axios from 'axios';
import {toast} from 'amis';

let appInfo = JSON.parse(window.localStorage.getItem('app') || '{}');
let backContextPath = appInfo.backContextPath;
axios.defaults.baseURL = backContextPath;
let pagIndex = 1;
export const MainStore = types
  .model('MainStore', {
    pages: types.optional(types.array(PageStore), [
      {
        id: `${pagIndex}`,
        path: 'hello-world',
        label: 'Hello world',
        icon: 'fa fa-file',
        schema: {
          type: 'page',
          title: 'Hello world',
          body: '初始页面'
        }
      }
    ]),
    backPaths: types.frozen([]),
    backPages: types.frozen([]),
    theme: 'cxd',
    asideFixed: true,
    asideFolded: false,
    offScreen: false,
    addPageIsOpen: false,
    preview: false,
    isMobile: false,
    schema: types.frozen()
  })
  .views(self => ({
    get fetcher() {
      return getEnv(self).fetcher;
    },
    get notify() {
      return getEnv(self).notify;
    },
    get alert() {
      return getEnv(self).alert;
    },
    get copy() {
      return getEnv(self).copy;
    }
  }))
  .actions(self => {
    function toggleAsideFolded() {
      self.asideFolded = !self.asideFolded;
    }

    function toggleAsideFixed() {
      self.asideFixed = !self.asideFixed;
    }

    function toggleOffScreen() {
      self.offScreen = !self.offScreen;
    }

    function setAddPageIsOpen(isOpened: boolean) {
      self.addPageIsOpen = isOpened;
    }

    function initPages(data: any) {
      self.backPages = data;
    }

    function addPage(data: {id: string, label: string; path: string; icon?: string; schema?: any}) {
      self.pages.push(
        PageStore.create({
          ...data,
          // id: `${++pagIndex}`
          id: data.id
        })
      );
    }

    function removePageAt(index: number) {
      self.pages.splice(index, 1);
    }

    function updatePageSchemaAt(index: number) {

      let page = self.pages[index];
      page.updateSchema(self.schema);
      // console.info("保存",page,JSON.stringify(page.schema) )
      axios.post('/backend/magic_amis_page/update', {
        id: page.id,
        label: page.label,
        path: page.path,
        schema: JSON.stringify(page.schema)
      }).then((data) => {
        if(data.data==0){
          return toast.error('保存失败', '提示');
        }
        toast.success('保存成功', '提示');
      }).catch((res) => {
        toast.error('保存失败', '提示');
        console.error(res);

      });

    }

    function updateSchema(value: any) {
      console.info('更新', value);
      self.schema = value;
    }

    function setPreview(value: boolean) {
      self.preview = value;
    }

    function setIsMobile(value: boolean) {
      self.isMobile = value;
    }

    return {
      toggleAsideFolded,
      toggleAsideFixed,
      toggleOffScreen,
      setAddPageIsOpen,
      addPage,
      removePageAt,
      updatePageSchemaAt,
      updateSchema,
      setPreview,
      setIsMobile,
      initPages,
      afterCreate() {
        (async function() {

          let data = await axios.get('/backend/magic_amis_page/search_menu_tree');
          let menuInfo = data.data.data;
          let pathResult = await axios.get('/backend/magic_amis_page/search_all_path');
          let path = pathResult.data.data;
          let pageData: any[] = [];

          const paths = path.map(item => {
            let info = {
              label: item.title,
              icon: item.icon || '',
              path: `/${item.href}`,
              id: item.id
            };
            if (item.id == '100-00007') {
              console.info('1007', item.pageContent);
            }

            pageData.push(PageStore.create({
              ...info,
              schema: JSON.parse(item.pageContent)
            }));
            return `/${item.href}`;
          });

          applySnapshot(self, {...self, ...{backPages: menuInfo, backPaths: paths, pages: pageData}});
          // applySnapshot(self,menuInfo);


          // store.initPages();
        })();


        // // persist store
        // if (typeof window !== 'undefined' && window.localStorage) {
        //     const storeData = window.localStorage.getItem('store');
        //     console.info(JSON.parse(storeData));
        //     if (storeData) applySnapshot(self, JSON.parse(storeData));
        //     reaction(
        //         () => getSnapshot(self),
        //         json => {
        //             console.log(json);
        //             window.localStorage.setItem('store', JSON.stringify(json));
        //         }
        //     );
        // }
      }
    };
  });

export type IMainStore = typeof MainStore.Type;
