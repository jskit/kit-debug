/*
Tencent is pleased to support the open source community by making vConsole available.

Copyright (C) 2017 THL A29 Limited, a Tencent company. All rights reserved.

Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
http://opensource.org/licenses/MIT

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * vConsole Storage Plugin
 */

import VConsolePlugin from '../lib/plugin.js';
import tplTabbox from './tabbox.html';
import tplList from './list.html';

import * as tool from '../lib/tool.js';
import $ from '../lib/query.js';

const VCStoreApi = 'VCStoreApi';

class VConsoleApiTab extends VConsolePlugin {

  constructor(...args) {
    super(...args);

    this.$tabbox = $.render(tplTabbox, {});
    this.currentType = '';
    this.typeNameMap = {
      'api': 'Api',
      'host': 'Host'
    }
  }

  onRenderTab(callback) {
    callback(this.$tabbox);
  }

  onAddTopBar(callback) {
    let that = this;
    let types = ['Api', 'Host'];
    let btnList = [];
    for (let i = 0; i < types.length; i++) {
      btnList.push({
        name: types[i],
        data: {
          type: types[i].toLowerCase()
        },
        className: '',
        onClick: function() {
          if (!$.hasClass(this, 'vc-actived')) {
            that.currentType = this.dataset.type;
            that.renderApi();
          } else {
            return false;
          }
        }
      });
    }
    btnList[0].className = 'vc-actived';
    callback(btnList);
  }

  onAddTool(callback) {
    let that = this;
    let toolList = [{
      name: 'Reload',
      global: false,
      onClick: function(e) {
        // 刷新请求
        window.location.reload();
        // that.renderApi();
      }
    }, {
      name: 'Reset',
      global: false,
      onClick: function(e) {
        // 清除缓存
        that.clearLog();
      }
    }];
    callback(toolList);
  }

  onReady() {
    const that = this;
    that.isReady = true;

    // 绑定切换 API 事件
    $.delegate($.one('.vc-log', that.$tabbox), 'click', '.vc-table-col-value', function(e) {
      e.preventDefault();
      const target = e.target;
      const prev = target.previousElementSibling;
      const type = that.currentType || 'api';
      $.removeClass($.all('.active', e.currentTarget), 'active');
      $.addClass([target, prev], 'active');
      const envName = prev.innerText;
      const value = target.innerText;
      let store = JSON.parse(localStorage.getItem(VCStoreApi) || '{}');
      store[type] = {
        name: envName,
        value: value,
      };
      console.log(`${type} 切换为 ${envName} 环境：`);
      console.log(store);
      localStorage.setItem(VCStoreApi, JSON.stringify(store));
      if(type === 'api'){
        // 切换 api 自动刷新
        window.location.reload(true);
      } else if (type === 'host') {
        window.location.href = value;
      }
    });
  }

  onShow() {
    // show default panel
    if (this.currentType == '') {
      this.currentType = 'api';
      this.renderApi();
    }
    let store = JSON.parse(localStorage.getItem(VCStoreApi) || '{}');
    if(store && store.api && store.api.value) {
      let $list = $.all('.vc-table-col-value', $.one('.vc-log', this.$tabbox));
      for(let i=0; i<$list.length; i++) {
        let target = $list[i];
        if(target.innerText === store.api.value) {
          $.addClass([target, target.previousElementSibling], 'active');
        }
      }
    }
  }

  clearLog() {
    if (this.currentType && window.confirm) {
      let result = window.confirm('Remove all ' + this.typeNameMap[this.currentType] + '?');
      if (!result) {
        return false;
      }
    }
    let type = this.currentType;
    switch (type) {
      case 'api':
      case 'host':
        this.clearApiList(type);
        break;
      default:
        return false;
    }
    this.renderApi();
  }

  renderApi() {
    let list = [];

    let type = this.currentType;
    switch (type) {
      case 'api':
      case 'host':
        list = this.getApiList(type);
        break;
      default:
        return false;
    }

    let $log = $.one('.vc-log', this.$tabbox);
    if (list.length == 0) {
      $log.innerHTML = `<div>
<pre>
// 启用动态切换 API，需如下设置
// 全局配置 window.apiListConfig
// 切换后，使用以下方式获取当前值
// localStorage.getItem('VCStoreApi')
// 注意 storage 根据域名来存取，变更host，将导致api 配置变化问题

window.apiListConfig = {
  api: {
    dev: 'xxx',
    beta: 'xxx',
    beta1: 'xxx',
  },
  host: {
    dev: 'xxx',
    beta: 'xxx',
    beta1: 'xxx',
  },
};
</pre>
      </div>`;
    } else {
      // html encode for rendering
      for (let i=0; i<list.length; i++) {
        list[i].name = tool.htmlEncode(list[i].name);
        list[i].value = tool.htmlEncode(list[i].value);
      }
      $log.innerHTML = $.render(tplList, {list: list}, true);
    }
  }

  getApiList(type) {
    const { apiListConfig = {} } = window
    let list = [];
    let items = apiListConfig[type];
    if (!items) {
      return [];
    }
    Object.keys(items).forEach(function(item, index) {
      list.push({
        name: item,
        value: items[item],
      });
    })
    return list;
  }

  clearApiList() {
    localStorage.removeItem(VCStoreApi);
    // if (!document.cookie || !navigator.cookieEnabled) {
    //   return;
    // }

    // let list = this.getApiList();
    // for (var i=0; i<list.length; i++) {
    //   document.cookie = list[i].name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // }
    this.renderApi();
  }

  clearDmoainList() {
    if (!!window.localStorage) {
      try {
        localStorage.clear();
        this.renderApi();
      } catch (e) {
        alert('localStorage.clear() fail.');
      }
    }
  }

} // END Class

export default VConsoleApiTab;
