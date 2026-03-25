const TAB_LIST = [
  {
    text: "油耗曲线",
    pagePath: "/pkg-curve/index",
    iconPath: "/static/icons/curve.png",
    selectedIconPath: "/static/icons/curve-active.png"
  },
  {
    text: "油耗列表",
    pagePath: "/pkg-records/index",
    iconPath: "/static/icons/record.png",
    selectedIconPath: "/static/icons/record-active.png"
  },
  {
    text: "加油",
    pagePath: "/pkg-refuel/index",
    isCenter: true
  },
  {
    text: "保养记录",
    pagePath: "/pkg-maintenance/index",
    iconPath: "/static/icons/record.png",
    selectedIconPath: "/static/icons/record-active.png"
  },
  {
    text: "我的",
    pagePath: "/pkg-mine/index",
    iconPath: "/static/icons/bike.png",
    selectedIconPath: "/static/icons/bike-active.png"
  }
];

const CREATE_PAGE_PATH = "/subpkg-action/create/index";

Component({
  data: {
    selected: 0,
    list: TAB_LIST,
    isNavigating: false
  },
  lifetimes: {
    attached() {
      this.updateSelected();
    }
  },
  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },
  methods: {
    lockNavigation() {
      if (this.data.isNavigating) {
        return false;
      }
      this.setData({ isNavigating: true });
      return true;
    },
    releaseNavigationLock(immediate) {
      const delay = immediate ? 0 : 260;
      setTimeout(() => {
        if (!this.data.isNavigating) {
          return;
        }
        this.setData({ isNavigating: false });
      }, delay);
    },
    updateSelectedByPath(path) {
      const route = `/${String(path || "").replace(/^\//, "")}`;
      const currentIndex = this.data.list.findIndex((item) => item.pagePath === route);
      if (currentIndex >= 0 && currentIndex !== this.data.selected) {
        this.setData({ selected: currentIndex });
      }
    },
    updateSelected() {
      const pages = getCurrentPages();
      if (!pages.length) {
        return;
      }
      const current = pages[pages.length - 1] || {};
      this.updateSelectedByPath(current.route || "");
    },
    switchTab(event) {
      const dataset = event && event.currentTarget ? event.currentTarget.dataset : {};
      const index = Number(dataset.index);
      const path = dataset.path;
      const center = dataset.center === true || dataset.center === "true";
      if (!path || Number.isNaN(index)) {
        return;
      }
      if (center) {
        if (!this.lockNavigation()) {
          return;
        }
        wx.navigateTo({
          url: CREATE_PAGE_PATH,
          success: () => {
            this.releaseNavigationLock();
          },
          fail: () => {
            this.releaseNavigationLock(true);
          }
        });
        return;
      }
      if (index === this.data.selected) {
        return;
      }
      if (!this.lockNavigation()) {
        return;
      }
      this.setData({ selected: index });
      wx.switchTab({
        url: path,
        success: () => {
          this.releaseNavigationLock();
        },
        fail: () => {
          this.updateSelected();
          this.releaseNavigationLock(true);
        }
      });
    }
  }
});
