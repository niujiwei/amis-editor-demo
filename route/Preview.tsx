import React from 'react';
import {observer, inject} from 'mobx-react';
import {IMainStore} from '../store';
import {Button, AsideNav, Layout, confirm} from 'amis';
import {RouteComponentProps, matchPath, Switch, Route} from 'react-router';
import {Link, Redirect} from 'react-router-dom';
import NotFound from './NotFound';
import AMISRenderer from '../component/AMISRenderer';
import AddPageModal from '../component/AddPageModal';
import axios from 'axios';
import {PageStore} from '../store/Page';

// let appInfo = JSON.parse(window.localStorage.getItem('app'));
let appInfo = JSON.parse(window.localStorage.getItem('app')||"{}");
let backContextPath = appInfo.backContextPath;
console.info(backContextPath)
axios.defaults.baseURL = backContextPath;

function isActive(link: any, location: any) {
  const ret = matchPath(location.pathname, {
    path: link ? link.replace(/\?.*$/, '') : '',
    exact: true,
    strict: true
  });

  return !!ret;
}

export default inject('store')(
  observer(function({store, location, history}: {store: IMainStore} & RouteComponentProps) {

    function renderHeader() {
      return (
        <div>
          <div className={`a-Layout-headerBar`}>
            <div className='hidden-xs p-t-sm pull-right'>
              <Button size='sm' className='m-r-xs' level='success' disabled disabledTip='Todo...'>
                全部导出
              </Button>
              <Button size='sm' level='info' onClick={() => store.setAddPageIsOpen(true)}>
                新增页面
              </Button>
            </div>
          </div>
        </div>
      );
    }

    /**
     * 查询
     */
    function renderAside() {
      // axios.get('/backend/sys_menu/v1/search_all_tree').then((res)=>{
      //     console.info(res);
      // });
      // console.log(store.pages);

      const paths = store.backPaths;
      return (
        <AsideNav
          key={store.asideFolded ? 'folded-aside' : 'aside'}
          navigations={store.backPages}
          renderLink={({link, toggleExpand, classnames: cx, depth}: any) => {
            if (link.hidden) {
              return null;
            }
            let children = [];

            if (link.children) {
              children.push(
                <span
                  key='expand-toggle'
                  className={cx('AsideNav-itemArrow')}
                  onClick={e => toggleExpand(link, e)}
                ></span>
              );
            }

            link.badge &&
            children.push(
              <b key='badge' className={cx(`AsideNav-itemBadge`, link.badgeClassName || 'bg-info')}>
                {link.badge}
              </b>
            );

            if (link.icon) {
              children.push(<i key='icon' className={cx(`AsideNav-itemIcon`, link.icon)} />);
            } else if (store.asideFolded && depth === 1) {
              children.push(
                <i
                  key='icon'
                  className={cx(`AsideNav-itemIcon`, link.children ? 'fa fa-folder' : 'fa fa-info')}
                />
              );
            }

            if(link.path!=null&&link.path!="#") {
              link.active ||
              children.push(
                <i
                  key='delete'
                  data-tooltip='删除'
                  data-position='bottom'
                  className={'navbtn fa fa-times'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    confirm('确认要删除').then(confirmed => {
                      confirmed && store.removePageAt(paths.indexOf( `/${link.path}`));
                    });
                  }}
                />
              );
              children.push(
                <i
                  key='edit'
                  data-tooltip='编辑'
                  data-position='bottom'
                  className={'navbtn fa fa-pencil'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    history.push(`/edit/${paths.indexOf( `/${link.path}`)}`);
                  }}
                />
              );
            }

            children.push(
              <span key='label' className={cx('AsideNav-itemLabel')}>
                                {link.label}
                            </span>
            );
            return link.path ? (
              link.active ? (
                <a>{children}</a>
              ) : (
                <Link  to={link.path[0] === '/' ? link.path : `/${link.path}`}   >{children}</Link>
              )
            ) : (
              <a
                onClick={
                  link.onClick ? link.onClick : link.children ? () => toggleExpand(link) : undefined
                }
              >
                {children}
              </a>
            );
          }}
          isActive={(link: any) =>
            isActive(link.path && link.path[0] === '/' ? link.path : `/${link.path}`, location)

          }
        />
      );
    }

    /**
     * 新增菜单回调
     * @param value
     */
    async function handleConfirm(value: {label: string; icon: string; path: string; menuId: string}) {
      let menuResult = await axios.get('/backend/sys_menu/v1/search_by_id?menuId=' + value.menuId);
      let menuInfo: {id: string, title: string, icon: string, href: string} = menuResult.data.data;
      let info = {
        label: menuInfo.title,
        icon: menuInfo.icon || '',
        path: menuInfo.href,
        id: menuInfo.id
      };
      let amisPageResult = await axios.get('/backend/magic_amis_page/search_by_id?id=' + value.menuId);
      let amisPageInfo = amisPageResult.data.data;

      store.addPage({
        ...info,
        schema: JSON.parse(amisPageInfo.pageContent)
      });
      store.setAddPageIsOpen(false);
    }

    return (
      <Layout
        aside={renderAside()}
        header={renderHeader()}
        folded={store.asideFolded}
        offScreen={store.offScreen}
      >
        <Switch>
          {store.pages.map(item => {
              return ( <Route
                  key={item.id}
                  path={`${item.path}`}
                  render={() => <AMISRenderer schema={item.schema} />}
                />
              )
            }

          )}
          <Route component={NotFound} />
        </Switch>
        <AddPageModal
          show={store.addPageIsOpen}
          onClose={() => store.setAddPageIsOpen(false)}
          onConfirm={handleConfirm}
          pages={store.pages.concat()}
        />
      </Layout>
    );
  })
);
