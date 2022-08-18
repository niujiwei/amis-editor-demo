import {schema2component} from './AMISRenderer';

export default schema2component(
  {
    type: 'dialog',
    title: '新增页面',
    body: {
      type: 'form',
      controls: [
        {
          id: "u:d17ec8a6dbb9",
          name: "menuId",
          type: "tree-select",
          label: "所属菜单",
          source: "/backend/sys_menu/v1/search_all_tree",
          labelField: "title",
          valueField: "id"
        }
      ]
    }
  },
  ({onConfirm, pages, ...rest}: any) => {
    return {
      ...rest,
      data: {
        pages
      },
      onConfirm: (values: Array<any>) => onConfirm && onConfirm(values[0])
    };
  }
);
