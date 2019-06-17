// 核心
// https://cn.vuejs.org/v2/guide/render-function.html#深入数据对象
import { RootComponent, createRootFn } from './interface';
import { throwError } from './utils';

const createRoot: createRootFn = (Vue, component, data, childrenRender, { target = 'body', isAppend = true } = {}) => {
    // 组件容器
    const container = 'string' === typeof target ? document.querySelector(target) : target;
    if (!container) {
        throwError('target元素不存在');
    }

    // 什么元素都无所谓, 因为render中会重新渲染, 最终该标签会被组件标签替换
    const el = document.createElement('div');
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/insertAdjacentElement
    // 由于throw被封装, ts没办法正确推断container不为空
    container!.insertAdjacentElement(isAppend ? 'beforeend' : 'afterbegin', el);
    const root = new Vue({
        el,

        render(createElement) {
            // https://cn.vuejs.org/v2/guide/render-function.html#深入数据对象
            const vNodeData = ('props' in data) ? data : {props:data};
            return createElement(component, vNodeData, childrenRender && childrenRender(createElement));
        },
    });

    // 对外$romove方法
    const rootComponent = root.$children[0] as RootComponent;

    rootComponent.$on('hook:destroyed', () => {
        // 按照vue作者的说法$destroy中并没有做事件解绑, 而是等待系统回收内存
        // 所以$destroy因该只是做了解除数据绑定
        // https://github.com/vuejs/vue/issues/5187
        root.$destroy();
        // 删除元素
        container!.removeChild(root.$el);
    });

    rootComponent.$updateRenderData = (newProps, newChildrenRender) => {
        data.props = { ...data.props, ...newProps };
        childrenRender = newChildrenRender
        // https://cn.vuejs.org/v2/api/#vm-forceUpdate
        // 注意它仅仅影响实例本身和插入插槽内容的子组件，而不是所有子组件。
        root.$forceUpdate();
    };

    return rootComponent;
}

export default createRoot;