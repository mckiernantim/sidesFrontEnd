function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"], {
  /***/
  "./$$_lazy_route_resource lazy recursive":
  /*!******************************************************!*\
    !*** ./$$_lazy_route_resource lazy namespace object ***!
    \******************************************************/

  /*! no static exports found */

  /***/
  function $$_lazy_route_resourceLazyRecursive(module, exports) {
    function webpackEmptyAsyncContext(req) {
      // Here Promise.resolve().then() is used instead of new Promise() to prevent
      // uncaught exception popping up in devtools
      return Promise.resolve().then(function () {
        var e = new Error("Cannot find module '" + req + "'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
      });
    }

    webpackEmptyAsyncContext.keys = function () {
      return [];
    };

    webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
    module.exports = webpackEmptyAsyncContext;
    webpackEmptyAsyncContext.id = "./$$_lazy_route_resource lazy recursive";
    /***/
  },

  /***/
  "./src/app/app-routing.module.ts":
  /*!***************************************!*\
    !*** ./src/app/app-routing.module.ts ***!
    \***************************************/

  /*! exports provided: AppRoutingModule */

  /***/
  function srcAppAppRoutingModuleTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "AppRoutingModule", function () {
      return AppRoutingModule;
    });
    /* harmony import */


    var _complete_complete_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! ./complete/complete.component */
    "./src/app/complete/complete.component.ts");
    /* harmony import */


    var _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ./dashboard/dashboard.component */
    "./src/app/dashboard/dashboard.component.ts");
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _upload_upload_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! ./upload/upload.component */
    "./src/app/upload/upload.component.ts");

    var routes = [{
      path: 'download',
      component: _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_1__["DashboardComponent"]
    }, {
      path: 'complete',
      component: _complete_complete_component__WEBPACK_IMPORTED_MODULE_0__["CompleteComponent"]
    }, {
      path: '',
      component: _upload_upload_component__WEBPACK_IMPORTED_MODULE_4__["UploadComponent"]
    }];

    var AppRoutingModule = function AppRoutingModule() {
      _classCallCheck(this, AppRoutingModule);
    };

    AppRoutingModule.ɵmod = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineNgModule"]({
      type: AppRoutingModule
    });
    AppRoutingModule.ɵinj = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjector"]({
      factory: function AppRoutingModule_Factory(t) {
        return new (t || AppRoutingModule)();
      },
      imports: [[_angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"].forRoot(routes)], _angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"]]
    });

    (function () {
      (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppRoutingModule, {
        imports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"]],
        exports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"]]
      });
    })();
    /*@__PURE__*/


    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](AppRoutingModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"],
        args: [{
          imports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"].forRoot(routes)],
          exports: [_angular_router__WEBPACK_IMPORTED_MODULE_3__["RouterModule"]]
        }]
      }], null, null);
    })();
    /***/

  },

  /***/
  "./src/app/app.component.ts":
  /*!**********************************!*\
    !*** ./src/app/app.component.ts ***!
    \**********************************/

  /*! exports provided: AppComponent */

  /***/
  function srcAppAppComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "AppComponent", function () {
      return AppComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _nav_nav_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ./nav/nav.component */
    "./src/app/nav/nav.component.ts");

    var AppComponent = function AppComponent() {
      _classCallCheck(this, AppComponent);

      this.title = 'sideWays';
    };

    AppComponent.ɵfac = function AppComponent_Factory(t) {
      return new (t || AppComponent)();
    };

    AppComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: AppComponent,
      selectors: [["app-root"]],
      decls: 1,
      vars: 0,
      template: function AppComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "app-nav");
        }
      },
      directives: [_nav_nav_component__WEBPACK_IMPORTED_MODULE_1__["NavComponent"]],
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2FwcC5jb21wb25lbnQuY3NzIn0= */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](AppComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-root',
          templateUrl: './app.component.html',
          styleUrls: ['./app.component.css']
        }]
      }], null, null);
    })();
    /***/

  },

  /***/
  "./src/app/app.module.ts":
  /*!*******************************!*\
    !*** ./src/app/app.module.ts ***!
    \*******************************/

  /*! exports provided: AppModule */

  /***/
  function srcAppAppModuleTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "AppModule", function () {
      return AppModule;
    });
    /* harmony import */


    var _angular_common_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/common/http */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/http.js");
    /* harmony import */


    var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! @angular/platform-browser */
    "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/platform-browser.js");
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _app_routing_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! ./app-routing.module */
    "./src/app/app-routing.module.ts");
    /* harmony import */


    var _app_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! ./app.component */
    "./src/app/app.component.ts");
    /* harmony import */


    var _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
    /*! ./upload/upload.component */
    "./src/app/upload/upload.component.ts");
    /* harmony import */


    var _dashboard_left_dashboard_left_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
    /*! ./dashboard-left/dashboard-left.component */
    "./src/app/dashboard-left/dashboard-left.component.ts");
    /* harmony import */


    var _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
    /*! ./dashboard-right/dashboard-right.component */
    "./src/app/dashboard-right/dashboard-right.component.ts");
    /* harmony import */


    var _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! ./dashboard/dashboard.component */
    "./src/app/dashboard/dashboard.component.ts");
    /* harmony import */


    var _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
    /*! ./navbar/navbar.component */
    "./src/app/navbar/navbar.component.ts");
    /* harmony import */


    var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(
    /*! @angular/platform-browser/animations */
    "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/animations.js");
    /* harmony import */


    var _nav_nav_component__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(
    /*! ./nav/nav.component */
    "./src/app/nav/nav.component.ts");
    /* harmony import */


    var _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(
    /*! @angular/cdk/layout */
    "./node_modules/@angular/cdk/__ivy_ngcc__/fesm2015/layout.js");
    /* harmony import */


    var _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(
    /*! @angular/material/toolbar */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/toolbar.js");
    /* harmony import */


    var _angular_material_button__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(
    /*! @angular/material/button */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/button.js");
    /* harmony import */


    var _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(
    /*! @angular/material/sidenav */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sidenav.js");
    /* harmony import */


    var _angular_material_icon__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(
    /*! @angular/material/icon */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/icon.js");
    /* harmony import */


    var _angular_material_list__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(
    /*! @angular/material/list */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/list.js");
    /* harmony import */


    var _angular_material_input__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(
    /*! @angular/material/input */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/input.js");
    /* harmony import */


    var _script_script_component__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(
    /*! ./script/script.component */
    "./src/app/script/script.component.ts");
    /* harmony import */


    var _angular_material_table__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(
    /*! @angular/material/table */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/table.js");
    /* harmony import */


    var _angular_material_paginator__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(
    /*! @angular/material/paginator */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/paginator.js");
    /* harmony import */


    var _angular_material_sort__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(
    /*! @angular/material/sort */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sort.js");
    /* harmony import */


    var _angular_forms__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(
    /*! @angular/forms */
    "./node_modules/@angular/forms/__ivy_ngcc__/fesm2015/forms.js");
    /* harmony import */


    var _complete_complete_component__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(
    /*! ./complete/complete.component */
    "./src/app/complete/complete.component.ts");
    /* harmony import */


    var _issue_issue_component__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(
    /*! ./issue/issue.component */
    "./src/app/issue/issue.component.ts");
    /* harmony import */


    var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(
    /*! @angular/material/dialog */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/dialog.js");

    var AppModule = function AppModule() {
      _classCallCheck(this, AppModule);
    };

    AppModule.ɵmod = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineNgModule"]({
      type: AppModule,
      bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]]
    });
    AppModule.ɵinj = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjector"]({
      factory: function AppModule_Factory(t) {
        return new (t || AppModule)();
      },
      providers: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["DatePipe"]],
      imports: [[_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_11__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_13__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_14__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_15__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_16__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_17__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_18__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_19__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_21__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_22__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_23__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_27__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_24__["FormsModule"]]]
    });

    (function () {
      (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppModule, {
        declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_left_dashboard_left_component__WEBPACK_IMPORTED_MODULE_7__["DashboardLeftComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_8__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_9__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_10__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_12__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_20__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_25__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_26__["IssueComponent"]],
        imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_11__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_13__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_14__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_15__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_16__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_17__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_18__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_19__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_21__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_22__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_23__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_27__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_24__["FormsModule"]]
      });
    })();
    /*@__PURE__*/


    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](AppModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"],
        args: [{
          declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_left_dashboard_left_component__WEBPACK_IMPORTED_MODULE_7__["DashboardLeftComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_8__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_9__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_10__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_12__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_20__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_25__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_26__["IssueComponent"]],
          imports: [_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_11__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_13__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_14__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_15__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_16__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_17__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_18__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_19__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_21__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_22__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_23__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_27__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_24__["FormsModule"]],
          providers: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["DatePipe"]],
          entryComponents: [_issue_issue_component__WEBPACK_IMPORTED_MODULE_26__["IssueComponent"]],
          bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]]
        }]
      }], null, null);
    })();
    /***/

  },

  /***/
  "./src/app/complete/complete.component.ts":
  /*!************************************************!*\
    !*** ./src/app/complete/complete.component.ts ***!
    \************************************************/

  /*! exports provided: CompleteComponent */

  /***/
  function srcAppCompleteCompleteComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "CompleteComponent", function () {
      return CompleteComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ./../upload.service */
    "./src/app/upload.service.ts");

    var CompleteComponent = /*#__PURE__*/function () {
      function CompleteComponent(upload) {
        _classCallCheck(this, CompleteComponent);

        this.upload = upload;
        this.name = localStorage.getItem("name");
      }

      _createClass(CompleteComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          this.downloadPDF();
        }
      }, {
        key: "downloadPDF",
        value: function downloadPDF() {
          this.upload.getPDF(this.name).subscribe(function (data) {
            var url = window.URL.createObjectURL(data);
            window.open(url);
          });
        }
      }]);

      return CompleteComponent;
    }();

    CompleteComponent.ɵfac = function CompleteComponent_Factory(t) {
      return new (t || CompleteComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]));
    };

    CompleteComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: CompleteComponent,
      selectors: [["app-complete"]],
      decls: 8,
      vars: 0,
      consts: [[3, "click"]],
      template: function CompleteComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Thanks for using Cheap Sides ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, " we've got a lot more in the pipe so stay tuned");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "button", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function CompleteComponent_Template_button_click_6_listener() {
            return ctx.downloadPDF();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7, "Download PDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBsZXRlL2NvbXBsZXRlLmNvbXBvbmVudC5jc3MifQ== */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](CompleteComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-complete',
          templateUrl: './complete.component.html',
          styleUrls: ['./complete.component.css']
        }]
      }], function () {
        return [{
          type: _upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/dashboard-left/dashboard-left.component.ts":
  /*!************************************************************!*\
    !*** ./src/app/dashboard-left/dashboard-left.component.ts ***!
    \************************************************************/

  /*! exports provided: DashboardLeftComponent */

  /***/
  function srcAppDashboardLeftDashboardLeftComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "DashboardLeftComponent", function () {
      return DashboardLeftComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var DashboardLeftComponent = /*#__PURE__*/function () {
      function DashboardLeftComponent() {
        _classCallCheck(this, DashboardLeftComponent);
      }

      _createClass(DashboardLeftComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }]);

      return DashboardLeftComponent;
    }();

    DashboardLeftComponent.ɵfac = function DashboardLeftComponent_Factory(t) {
      return new (t || DashboardLeftComponent)();
    };

    DashboardLeftComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DashboardLeftComponent,
      selectors: [["app-dashboard-left"]],
      decls: 0,
      vars: 0,
      template: function DashboardLeftComponent_Template(rf, ctx) {},
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2Rhc2hib2FyZC1sZWZ0L2Rhc2hib2FyZC1sZWZ0LmNvbXBvbmVudC5jc3MifQ== */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](DashboardLeftComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-dashboard-left',
          templateUrl: './dashboard-left.component.html',
          styleUrls: ['./dashboard-left.component.css']
        }]
      }], function () {
        return [];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/dashboard-right/dashboard-right.component.ts":
  /*!**************************************************************!*\
    !*** ./src/app/dashboard-right/dashboard-right.component.ts ***!
    \**************************************************************/

  /*! exports provided: DashboardRightComponent */

  /***/
  function srcAppDashboardRightDashboardRightComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "DashboardRightComponent", function () {
      return DashboardRightComponent;
    });
    /* harmony import */


    var _issue_issue_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! ./../issue/issue.component */
    "./src/app/issue/issue.component.ts");
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/material/paginator */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/paginator.js");
    /* harmony import */


    var _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/material/sort */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sort.js");
    /* harmony import */


    var _angular_material_table__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! @angular/material/table */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/table.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! ./../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
    /*! @angular/material/dialog */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/dialog.js");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! @angular/material/form-field */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/form-field.js");
    /* harmony import */


    var _angular_material_input__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
    /*! @angular/material/input */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/input.js");

    function DashboardRightComponent_li_8_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "li");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "pre");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r15 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate3"]("", scene_r15.sceneNumber, "     ", scene_r15.text, "     ", scene_r15.sceneNumber, "");
      }
    }

    function DashboardRightComponent_th_20_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Scene Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_21_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r16 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r16.sceneNumber, " ");
      }
    }

    function DashboardRightComponent_th_23_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Page Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_24_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r18 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r18.pageNumber, " ");
      }
    }

    function DashboardRightComponent_th_26_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Title ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_27_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r20 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r20.text, " ");
      }
    }

    function DashboardRightComponent_th_29_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Text ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_30_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r21 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r21.preview, " ");
      }
    }

    function DashboardRightComponent_th_32_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Select ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_33_Template(rf, ctx) {
      if (rf & 1) {
        var _r25 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "input", 22);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("change", function DashboardRightComponent_td_33_Template_input_change_1_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r25);

          var scene_r22 = ctx.$implicit;

          var ctx_r24 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

          return ctx_r24.toggleSelected($event, scene_r22);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var i_r23 = ctx.index;

        var ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpropertyInterpolate"]("name", i_r23 + 1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("disabled", ctx_r11.active === false ? "disabled" : null);
      }
    }

    function DashboardRightComponent_tr_34_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 23);
      }
    }

    function DashboardRightComponent_tr_35_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 24);
      }
    }

    function DashboardRightComponent_tr_36_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "tr", 25);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "td", 26);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        var _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵreference"](16);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("No data matching the filter \"", _r1.value, "\"");
      }
    }

    var _c0 = function _c0() {
      return [10, 25, 100];
    };

    var DashboardRightComponent = /*#__PURE__*/function () {
      function DashboardRightComponent(upload, router, dialog, datePipe) {
        _classCallCheck(this, DashboardRightComponent);

        this.upload = upload;
        this.router = router;
        this.dialog = dialog;
        this.datePipe = datePipe;
        this.displayedColumns = ['number', "page number", 'text', "preview", "select"];
        this.dataReady = false;
        this.initialSelection = [];
        this.active = true;
        this.script = localStorage.getItem("name");
      }

      _createClass(DashboardRightComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          var _this = this;

          this.date = Date.now();
          this.selected = [];
          this.pages = [];
          this.active = true;
          this.scriptProblems = [];
          this.modalData = [];
          this.scriptData = this.upload.lineArr;
          this.scenes = this.scriptData.filter(function (line) {
            return line.category === "scene-header";
          });

          for (var i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i + 1]) {
              var last = this.scenes[i + 1].index;
              this.scenes[i].lastLine = this.scriptData[this.scenes[i + 1].index - 1].index;
              this.scenes[i].lastPage = this.scriptData[this.scenes[i].lastLine].pageNumber;
              this.scenes[i].firstLine = this.scriptData[this.scenes[i].index - 1].index;
              this.scenes[i].preview = this.getPreview(i);
            }

            this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatTableDataSource"](this.scenes);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }

          this.scriptProblems = this.upload.issues;
          this.scriptProblems.forEach(function (line) {
            line.text = _this.lookBack(line);
          });
          this.dataReady = true;
          var probsArr = [];
          this.scriptProblems.forEach(function (line) {
            var ind = line.index;
            var scene = _this.scriptData[ind].sceneIndex;

            var problem = _this.scenes.map(function (scene) {
              return scene.sceneIndex;
            }).indexOf(scene); // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LOINE


            probsArr.push(problem); // filter through script problems and then go to scenes and add problem flags for each index at proper location
          });
          probsArr = _toConsumableArray(new Set(probsArr));

          var _loop = function _loop(_i) {
            _this.scenes[probsArr[_i]].problems = _this.scriptProblems.filter(function (line) {
              return line.sceneNumber === probsArr[_i];
            });
          };

          for (var _i = 0; _i < probsArr.length; _i++) {
            _loop(_i);
          }

          console.log(this.scenes);
          console.log(this.scriptProblems);
          console.log(this.scriptData);
        } // lets get lookback tighter  - should be able to refrence lastCharacterIndex

      }, {
        key: "lookBack",
        value: function lookBack(line) {
          var newText = "";
          newText = this.scriptData[line.lastCharIndex].text;
          var ind = line.index;

          for (var i = line.lastCharIndex + 1; i < ind + 1; i++) {
            newText = newText + "\n" + this.scriptData[i].text;

            if (this.scriptData[i].category === ("more" || false || false) || this.scriptData[i].subCategory === "parenthetical") {// console.log("FOUND IT AHWJHWAKJEHAKWJH")
              // ind+=1
            }
          }

          return newText;
        } // create preview text for table

      }, {
        key: "getPreview",
        value: function getPreview(ind) {
          return this.scenes[ind].preview = this.scriptData[this.scenes[ind].index + 1].text + " " + this.scriptData[this.scenes[ind].index + 2].text;
        }
      }, {
        key: "getPages",
        value: function getPages(data) {
          var _this2 = this;

          var num = data[data.length - 1].pageNumber;

          var _loop2 = function _loop2(i) {
            var page = data.filter(function (line) {
              return line.pageNumber === i;
            });

            _this2.pages.push(page);

            if (i === num) {
              _this2.dataReady = true;
            }
          };

          for (var i = 2; i < num + 1; i++) {
            _loop2(i);
          }
        }
      }, {
        key: "applyFilter",
        value: function applyFilter(event) {
          var filterValue = event.target.value;
          this.dataSource.filter = filterValue.trim().toLowerCase();

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }
        }
      }, {
        key: "makeVisible",
        value: function makeVisible(sceneArr, breaks) {
          var merged = [].concat.apply([], sceneArr);
          var counter = 0;

          for (var i = 0; i < merged.length; i++) {
            if (breaks[counter] && merged[i].index > breaks[counter].first && merged[i].index <= breaks[counter].last) {
              merged[i].visible = "true";

              if (merged[i].index === breaks[counter].last) {
                console.log("increasing counter");
                counter += 1;
              }
            } else if (!breaks[counter]) {
              console.log(i);
              break;
            }
          }

          console.log(merged);
          return merged;
        }
      }, {
        key: "getPdf",
        value: function getPdf(sceneArr, name) {
          var _this3 = this;

          sceneArr = this.sortByNum(sceneArr); // need first and last lines from selected

          var fullPages = [];
          var used = [];
          var pages = [];
          var sceneBreaks = [];
          sceneArr.forEach(function (scene) {
            for (var i = scene.pageNumber; i <= scene.lastPage; i++) {
              if (!pages.includes(i)) {
                pages.push(i);
              }
            }

            var breaks = {
              first: scene.firstLine,
              last: scene.lastLine,
              scene: scene.sceneNumber,
              firstPage: scene.pageNumber
            };
            sceneBreaks.push(breaks);
          });
          pages.forEach(function (page) {
            console.log(page);

            var doc = _this3.scriptData.filter(function (scene) {
              return scene.pageNumber === page;
            });

            doc.push({
              pageNumber: page
            });
            fullPages.push(doc);
            console.log(fullPages);
          });
          console.log(sceneBreaks);

          var _final = this.makeVisible(fullPages, sceneBreaks);

          console.log(_final);
          this.upload.generatePdf(_final, name).subscribe(function (data) {
            _this3.router.navigate(["complete"]);
          });
        }
      }, {
        key: "sortByNum",
        value: function sortByNum(array) {
          return array.sort(function (a, b) {
            var x = a.sceneNumber;
            var y = b.sceneNumber;
            return x < y ? -1 : x > y ? 1 : 0;
          });
        }
      }, {
        key: "logSelected",
        value: function logSelected() {
          console.log(this.selected);
          console.log(this.scriptData);
          console.log(this.scenes);
        }
      }, {
        key: "makePages",
        value: function makePages(scenes) {
          var pageNums = scenes.map(function (scene) {
            return scene.pageNumber;
          }).sort(function (a, b) {
            return a - b;
          });
          return pageNums;
        }
      }, {
        key: "toggleSelected",
        value: function toggleSelected(event, scene) {
          !this.selected.includes(scene) ? this.selected.push(scene) : this.selected.splice(this.selected.indexOf(scene, 1));
          this.selected.length > 10 ? this.active = false : this.active = true;
        }
      }, {
        key: "openDialog",
        value: function openDialog() {
          var _this4 = this;

          this.modalData = this.scenes.filter(function (scene) {
            return scene.problems;
          }).map(function (scene) {
            return scene = scene.problems;
          }).flat();

          if (this.modalData) {
            for (var i = 0; i < this.modalData.length; i++) {
              console.log(this.modalData[i]);

              if (this.modalData[i].text) {
                this.modalData[i].text = this.modalData[i].text.split(/\n/);
              }
            }

            var dialogRef = this.dialog.open(_issue_issue_component__WEBPACK_IMPORTED_MODULE_0__["IssueComponent"], {
              width: '500px',
              data: {
                scenes: this.modalData,
                selected: this.selected
              }
            });
            dialogRef.afterClosed().subscribe(function (result) {
              console.log("Dialog result: ".concat(result));
              console.log(_this4.selected);

              _this4.getPdf(_this4.selected, _this4.script);
            });
          } else this.getPdf(this.selected, this.script);
        }
      }]);

      return DashboardRightComponent;
    }();

    DashboardRightComponent.ɵfac = function DashboardRightComponent_Factory(t) {
      return new (t || DashboardRightComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_5__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_6__["Router"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__["MatDialog"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_8__["DatePipe"]));
    };

    DashboardRightComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DashboardRightComponent,
      selectors: [["app-dashboard-right"]],
      viewQuery: function DashboardRightComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstaticViewQuery"](_angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__["MatPaginator"], true);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstaticViewQuery"](_angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSort"], true);
        }

        if (rf & 2) {
          var _t;

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵloadQuery"]()) && (ctx.paginator = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵloadQuery"]()) && (ctx.sort = _t.first);
        }
      },
      decls: 38,
      vars: 11,
      consts: [[1, "main-container"], [1, "controls-container"], [4, "ngFor", "ngForOf"], [3, "click"], [2, "width", "100%"], ["matInput", "", "placeholder", "Ex. Mia", 3, "keyup"], ["input", ""], [1, "mat-elevation-z8"], ["mat-table", "", "matSort", "", 3, "dataSource"], ["matColumnDef", "number"], ["mat-header-cell", "", "mat-sort-header", "", 4, "matHeaderCellDef"], ["mat-cell", "", 4, "matCellDef"], ["matColumnDef", "page number"], ["matColumnDef", "text"], ["matColumnDef", "preview"], ["matColumnDef", "select"], ["mat-header-row", "", 4, "matHeaderRowDef"], ["mat-row", "", 4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], [3, "pageSizeOptions"], ["mat-header-cell", "", "mat-sort-header", ""], ["mat-cell", ""], ["type", "checkbox", 3, "name", "change"], ["mat-header-row", ""], ["mat-row", ""], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"]],
      template: function DashboardRightComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "h2");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](6, "date");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](7, "ul");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](8, DashboardRightComponent_li_8_Template, 3, 3, "li", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](9, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](10, "button", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DashboardRightComponent_Template_button_click_10_listener() {
            return ctx.openDialog();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](11, "getPDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](12, "mat-form-field", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](13, "mat-label");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](14, "Filter");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](15, "input", 5, 6);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("keyup", function DashboardRightComponent_Template_input_keyup_15_listener($event) {
            return ctx.applyFilter($event);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](17, "div", 7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](18, "table", 8);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](19, 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](20, DashboardRightComponent_th_20_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](21, DashboardRightComponent_td_21_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](22, 12);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](23, DashboardRightComponent_th_23_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](24, DashboardRightComponent_td_24_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](25, 13);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](26, DashboardRightComponent_th_26_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](27, DashboardRightComponent_td_27_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](28, 14);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](29, DashboardRightComponent_th_29_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](30, DashboardRightComponent_td_30_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](31, 15);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](32, DashboardRightComponent_th_32_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](33, DashboardRightComponent_td_33_Template, 2, 2, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](34, DashboardRightComponent_tr_34_Template, 1, 0, "tr", 16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](35, DashboardRightComponent_tr_35_Template, 1, 0, "tr", 17);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](36, DashboardRightComponent_tr_36_Template, 3, 1, "tr", 18);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](37, "mat-paginator", 19);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" Project: ", ctx.script, "");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind2"](6, 7, ctx.date, "shortDate"), " scenes:");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx.selected);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("dataSource", ctx.dataSource);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matHeaderRowDef", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matRowDefColumns", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("pageSizeOptions", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpureFunction0"](10, _c0));
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_8__["NgForOf"], _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__["MatFormField"], _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__["MatLabel"], _angular_material_input__WEBPACK_IMPORTED_MODULE_10__["MatInput"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatTable"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSort"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatColumnDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRowDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRowDef"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__["MatPaginator"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCell"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSortHeader"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCell"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRow"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRow"]],
      pipes: [_angular_common__WEBPACK_IMPORTED_MODULE_8__["DatePipe"]],
      styles: ["li[_ngcontent-%COMP%]{\n    list-style-type: none;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvZGFzaGJvYXJkLXJpZ2h0L2Rhc2hib2FyZC1yaWdodC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0kscUJBQXFCO0FBQ3pCIiwiZmlsZSI6InNyYy9hcHAvZGFzaGJvYXJkLXJpZ2h0L2Rhc2hib2FyZC1yaWdodC5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsibGl7XG4gICAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xufSJdfQ== */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵsetClassMetadata"](DashboardRightComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"],
        args: [{
          selector: 'app-dashboard-right',
          templateUrl: './dashboard-right.component.html',
          styleUrls: ['./dashboard-right.component.css']
        }]
      }], function () {
        return [{
          type: _upload_service__WEBPACK_IMPORTED_MODULE_5__["UploadService"]
        }, {
          type: _angular_router__WEBPACK_IMPORTED_MODULE_6__["Router"]
        }, {
          type: _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__["MatDialog"]
        }, {
          type: _angular_common__WEBPACK_IMPORTED_MODULE_8__["DatePipe"]
        }];
      }, {
        paginator: [{
          type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["ViewChild"],
          args: [_angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__["MatPaginator"], {
            "static": true
          }]
        }],
        sort: [{
          type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["ViewChild"],
          args: [_angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSort"], {
            "static": true
          }]
        }]
      });
    })();
    /***/

  },

  /***/
  "./src/app/dashboard/dashboard.component.ts":
  /*!**************************************************!*\
    !*** ./src/app/dashboard/dashboard.component.ts ***!
    \**************************************************/

  /*! exports provided: DashboardComponent */

  /***/
  function srcAppDashboardDashboardComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "DashboardComponent", function () {
      return DashboardComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ./../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _dashboard_left_dashboard_left_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! ../dashboard-left/dashboard-left.component */
    "./src/app/dashboard-left/dashboard-left.component.ts");
    /* harmony import */


    var _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! ../dashboard-right/dashboard-right.component */
    "./src/app/dashboard-right/dashboard-right.component.ts");

    var DashboardComponent = /*#__PURE__*/function () {
      function DashboardComponent(upload, router) {
        _classCallCheck(this, DashboardComponent);

        this.upload = upload;
        this.router = router;
      }

      _createClass(DashboardComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          this.file = localStorage.getItem("name");
        }
      }, {
        key: "getSheet",
        value: function getSheet() {
          var _this5 = this;

          this.upload.getFile(this.file).subscribe(function (data) {
            var url = window.URL.createObjectURL(data);
            window.open(url);

            _this5.router.navigate([""]);
          });
        }
      }]);

      return DashboardComponent;
    }();

    DashboardComponent.ɵfac = function DashboardComponent_Factory(t) {
      return new (t || DashboardComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"]));
    };

    DashboardComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DashboardComponent,
      selectors: [["app-dashboard"]],
      decls: 4,
      vars: 0,
      consts: [[1, "main"], [1, "button-container"]],
      template: function DashboardComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "app-dashboard-left");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "app-dashboard-right");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_dashboard_left_dashboard_left_component__WEBPACK_IMPORTED_MODULE_3__["DashboardLeftComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_4__["DashboardRightComponent"]],
      styles: [".main[_ngcontent-%COMP%]{\n    display:grid;\n    height:100vh;\n    grid-template-columns: 3fr 1fr;\n   \n    grid-template-rows: 300px;\n    text-align: center;\n    border:5px solid black;\n    color:#c2185a;\n    background: #dfdfdf;\n    text-shadow:1px 1px black;\n    overflow:auto;\n}\n.button-container[_ngcontent-%COMP%] {\n    background-color: #dfdfdf;\n    padding: 10% 10% 0% 10%\n     \n}\n.success[_ngcontent-%COMP%]{\n    background-color:#1f601f;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvZGFzaGJvYXJkL2Rhc2hib2FyZC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQTtJQUNJLFlBQVk7SUFDWixZQUFZO0lBQ1osOEJBQThCOztJQUU5Qix5QkFBeUI7SUFDekIsa0JBQWtCO0lBQ2xCLHNCQUFzQjtJQUN0QixhQUFhO0lBQ2IsbUJBQW1CO0lBQ25CLHlCQUF5QjtJQUN6QixhQUFhO0FBQ2pCO0FBQ0E7SUFDSSx5QkFBeUI7SUFDekI7O0FBRUo7QUFDQTtJQUNJLHdCQUF3QjtBQUM1QiIsImZpbGUiOiJzcmMvYXBwL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLm1haW57XG4gICAgZGlzcGxheTpncmlkO1xuICAgIGhlaWdodDoxMDB2aDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDNmciAxZnI7XG4gICBcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDMwMHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBib3JkZXI6NXB4IHNvbGlkIGJsYWNrO1xuICAgIGNvbG9yOiNjMjE4NWE7XG4gICAgYmFja2dyb3VuZDogI2RmZGZkZjtcbiAgICB0ZXh0LXNoYWRvdzoxcHggMXB4IGJsYWNrO1xuICAgIG92ZXJmbG93OmF1dG87XG59XG4uYnV0dG9uLWNvbnRhaW5lciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2RmZGZkZjtcbiAgICBwYWRkaW5nOiAxMCUgMTAlIDAlIDEwJVxuICAgICBcbn1cbi5zdWNjZXNze1xuICAgIGJhY2tncm91bmQtY29sb3I6IzFmNjAxZjtcbn1cbiJdfQ== */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](DashboardComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-dashboard',
          templateUrl: './dashboard.component.html',
          styleUrls: ['./dashboard.component.css']
        }]
      }], function () {
        return [{
          type: _upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]
        }, {
          type: _angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/issue/issue.component.ts":
  /*!******************************************!*\
    !*** ./src/app/issue/issue.component.ts ***!
    \******************************************/

  /*! exports provided: IssueComponent */

  /***/
  function srcAppIssueIssueComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "IssueComponent", function () {
      return IssueComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! @angular/material/dialog */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/dialog.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! ../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");

    function IssueComponent_ul_1_li_6_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "li");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 5);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var line_r2 = ctx.$implicit;

        var ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngClass", ctx_r1.getClass(line_r2.css));

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](line_r2.text);
      }
    }

    function IssueComponent_ul_1_Template(rf, ctx) {
      if (rf & 1) {
        var _r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "ul");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Lend us a hand!");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "h3");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Our AI is still learning how to read scripts and it looks like we ran into a few issues");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "div", 1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, IssueComponent_ul_1_li_6_Template, 3, 2, "li", 2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "li");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](11, "Is the line in red DESCRIPTION or SOMETHING ELSE");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](12, "div", 3);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](14, "button", 4);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_ul_1_Template_button_click_14_listener() {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r4);

          var ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r3.updateScriptDoc(ctx_r3.currentProblem.index, "dialog");
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](15, "something else");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](16, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](17, "button", 4);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_ul_1_Template_button_click_17_listener() {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r4);

          var ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r5.updateScriptDoc(ctx_r5.currentProblem.index, "first-description");
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](18, "description");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](6);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r0.currentProblem.modalText);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassMap"](ctx_r0.currentProblem.finalText.css);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", ctx_r0.currentProblem.finalText.text, "");
      }
    }

    var IssueComponent = /*#__PURE__*/function () {
      function IssueComponent(upload, dialogRef, data) {
        _classCallCheck(this, IssueComponent);

        this.upload = upload;
        this.dialogRef = dialogRef;
        this.data = data;
        this.modalProblems = [];
        this.problemIndex = 0;
        this.modalReady = false;
      }

      _createClass(IssueComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }, {
        key: "ngAfterViewInit",
        value: function ngAfterViewInit() {
          console.log("after firiing");
          this.scriptData = this.upload.lineArr;
          console.log(this.data);
          this.problems = this.data.scenes;
          this.selected = this.data.selected;
          this.getProblems();
          this.updateProblem();
          console.log(this.currentProblem);
          console.log(this.problems);
          console.log(this.selected); //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
          //Add 'implements AfterViewInit' to the class.
        }
      }, {
        key: "getProblems",
        value: function getProblems() {
          var _this6 = this;

          var _loop3 = function _loop3(i) {
            var scenes = _this6.problems.filter(function (scene) {
              return scene.sceneNumber === _this6.selected[i].sceneIndex + 1;
            });

            console.log(scenes);
            scenes.forEach(function (scene) {
              scene.lineCSS = [];

              for (var _i2 = 0; _i2 < scene.text.length; _i2++) {
                scene.lineCSS.push(_this6.scriptData[scene.lastCharIndex + _i2].category);
              }
            });

            _this6.modalProblems.push(scenes);
          };

          for (var i = 0; i < this.selected.length; i++) {
            _loop3(i);
          }

          this.modalProblems = this.modalProblems.flat();
          this.modalReady = true;
          console.log(this.modalProblems);
        }
      }, {
        key: "updateProblem",
        value: function updateProblem() {
          this.currentProblem = this.modalProblems[this.problemIndex];
          this.currentProblem.modalText = [];

          for (var i = 0; i < this.currentProblem.lineCSS.length; i++) {
            this.currentProblem.modalText.push({
              text: this.currentProblem.text[i],
              css: this.currentProblem.lineCSS[i]
            });
          }

          this.currentProblem.finalText = {
            css: this.currentProblem.modalText[this.currentProblem.modalText.length - 1].css + " last-line",
            text: this.currentProblem.modalText[this.currentProblem.modalText.length - 1].text
          };
          this.currentProblem.modalText.pop();
          console.log(this.currentProblem);
        }
      }, {
        key: "iterateProblem",
        value: function iterateProblem() {
          console.log(this.problemIndex, this.modalProblems.length);

          if (this.problemIndex + 1 < this.modalProblems.length) {
            this.problemIndex += 1;
            this.updateProblem();
          } else this.dialogRef.close();
        }
      }, {
        key: "updateScriptDoc",
        value: function updateScriptDoc(index, str) {
          this.upload.lineArr[index].category = str;
          this.iterateProblem();
        }
      }, {
        key: "getClass",
        value: function getClass(str) {
          return str;
        }
      }]);

      return IssueComponent;
    }();

    IssueComponent.ɵfac = function IssueComponent_Factory(t) {
      return new (t || IssueComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_2__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MatDialogRef"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MAT_DIALOG_DATA"]));
    };

    IssueComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: IssueComponent,
      selectors: [["app-issue"]],
      decls: 2,
      vars: 1,
      consts: [[4, "ngIf"], [1, "screenbox"], [4, "ngFor", "ngForOf"], [1, "button-container"], [3, "click"], [3, "ngClass"]],
      template: function IssueComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, IssueComponent_ul_1_Template, 19, 5, "ul", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.modalReady);
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["NgIf"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgForOf"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgClass"]],
      styles: [".screenbox[_ngcontent-%COMP%]{\n    background-color: whitesmoke;\n    color: black;\n    text-align: center;\n\n}\nli[_ngcontent-%COMP%] {\n  font: 16px Courier, fixed;\n  list-style-type: none;\n  line-height: normal;\n}\nspan.page-number[_ngcontent-%COMP%] {\n  text-decoration: none !important;\n}\n.false[_ngcontent-%COMP%] {\n  text-decoration: line-through;\n}\n.true[_ngcontent-%COMP%] {\n  text-decoration: none;\n}\n.last-line[_ngcontent-%COMP%]{\n    color:red !important;\n    text-decoration: underline;\n}\n.page-number[_ngcontent-%COMP%] {\n  text-align: right;\n  margin-left: 400px;\n  text-decoration: none !important;\n  ;\n}\n.page-number-hidden[_ngcontent-%COMP%] {\n  opacity: 0;\n  page-break-after: always;\n}\n.scene-header[_ngcontent-%COMP%] {\n  padding-top: 1ex;\n  display: inline-block;\n  margin-left: 50px\n}\n.version[_ngcontent-%COMP%] {\n  display: none;\n}\n.description[_ngcontent-%COMP%] {\n  line-height: 1;\n}\n.first-description[_ngcontent-%COMP%] {\n  padding-top: 1.2ex;\n\n}\n.first[_ngcontent-%COMP%] {\n  margin-top: 95px\n}\n.character[_ngcontent-%COMP%] {\n\n  padding-top: 1.2ex\n}\n.hidden[_ngcontent-%COMP%] {\n  display: none\n}\n.dialog[_ngcontent-%COMP%], .short-dialog[_ngcontent-%COMP%] {\n    margin-right:8%;\n    margin-left: 8%;\n}\n.transition[_ngcontent-%COMP%] {\n  padding-top: 3ex;\n  margin-left: 65%;\n  padding-bottom: 1.5ex;\n}\n.scene-header[_ngcontent-%COMP%] {\n  font-weight: 900;\n}\n.shot[_ngcontent-%COMP%] {\n  text-align: right;\n  font-weight: 900;\n}\n.hidden[_ngcontent-%COMP%] {\n  display: none\n}\n.scene-number-left[_ngcontent-%COMP%] {\n  margin-left: -50px;\n  float: left;\n  text-align: left;\n  font-weight: 900;\n}\n.scene-number-right[_ngcontent-%COMP%] {\n  margin-right: 0px;\n  float: right;\n  text-align: right;\n  font-weight: 900;\n}\n.button-container[_ngcontent-%COMP%]{\n    display:grid;\n    grid-template-columns: 1fr 1fr;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvaXNzdWUvaXNzdWUuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtJQUNJLDRCQUE0QjtJQUM1QixZQUFZO0lBQ1osa0JBQWtCOztBQUV0QjtBQUNBO0VBQ0UseUJBQXlCO0VBQ3pCLHFCQUFxQjtFQUNyQixtQkFBbUI7QUFDckI7QUFFQTtFQUNFLGdDQUFnQztBQUNsQztBQUVBO0VBQ0UsNkJBQTZCO0FBQy9CO0FBRUE7RUFDRSxxQkFBcUI7QUFDdkI7QUFDQTtJQUNJLG9CQUFvQjtJQUNwQiwwQkFBMEI7QUFDOUI7QUFFQTtFQUNFLGlCQUFpQjtFQUNqQixrQkFBa0I7RUFDbEIsZ0NBQWdDOztBQUVsQztBQUVBO0VBQ0UsVUFBVTtFQUNWLHdCQUF3QjtBQUMxQjtBQUVBO0VBQ0UsZ0JBQWdCO0VBQ2hCLHFCQUFxQjtFQUNyQjtBQUNGO0FBRUE7RUFDRSxhQUFhO0FBQ2Y7QUFFQTtFQUNFLGNBQWM7QUFDaEI7QUFFQTtFQUNFLGtCQUFrQjs7QUFFcEI7QUFFQTtFQUNFO0FBQ0Y7QUFFQTs7RUFFRTtBQUNGO0FBRUE7RUFDRTtBQUNGO0FBRUE7O0lBRUksZUFBZTtJQUNmLGVBQWU7QUFDbkI7QUFFQTtFQUNFLGdCQUFnQjtFQUNoQixnQkFBZ0I7RUFDaEIscUJBQXFCO0FBQ3ZCO0FBRUE7RUFDRSxnQkFBZ0I7QUFDbEI7QUFFQTtFQUNFLGlCQUFpQjtFQUNqQixnQkFBZ0I7QUFDbEI7QUFFQTtFQUNFO0FBQ0Y7QUFFQTtFQUNFLGtCQUFrQjtFQUNsQixXQUFXO0VBQ1gsZ0JBQWdCO0VBQ2hCLGdCQUFnQjtBQUNsQjtBQUVBO0VBQ0UsaUJBQWlCO0VBQ2pCLFlBQVk7RUFDWixpQkFBaUI7RUFDakIsZ0JBQWdCO0FBQ2xCO0FBQ0E7SUFDSSxZQUFZO0lBQ1osOEJBQThCO0FBQ2xDIiwiZmlsZSI6InNyYy9hcHAvaXNzdWUvaXNzdWUuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIi5zY3JlZW5ib3h7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGVzbW9rZTtcbiAgICBjb2xvcjogYmxhY2s7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuXG59XG5saSB7XG4gIGZvbnQ6IDE2cHggQ291cmllciwgZml4ZWQ7XG4gIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcbiAgbGluZS1oZWlnaHQ6IG5vcm1hbDtcbn1cblxuc3Bhbi5wYWdlLW51bWJlciB7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZSAhaW1wb3J0YW50O1xufVxuXG4uZmFsc2Uge1xuICB0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDtcbn1cblxuLnRydWUge1xuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG59XG4ubGFzdC1saW5le1xuICAgIGNvbG9yOnJlZCAhaW1wb3J0YW50O1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xufVxuXG4ucGFnZS1udW1iZXIge1xuICB0ZXh0LWFsaWduOiByaWdodDtcbiAgbWFyZ2luLWxlZnQ6IDQwMHB4O1xuICB0ZXh0LWRlY29yYXRpb246IG5vbmUgIWltcG9ydGFudDtcbiAgO1xufVxuXG4ucGFnZS1udW1iZXItaGlkZGVuIHtcbiAgb3BhY2l0eTogMDtcbiAgcGFnZS1icmVhay1hZnRlcjogYWx3YXlzO1xufVxuXG4uc2NlbmUtaGVhZGVyIHtcbiAgcGFkZGluZy10b3A6IDFleDtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBtYXJnaW4tbGVmdDogNTBweFxufVxuXG4udmVyc2lvbiB7XG4gIGRpc3BsYXk6IG5vbmU7XG59XG5cbi5kZXNjcmlwdGlvbiB7XG4gIGxpbmUtaGVpZ2h0OiAxO1xufVxuXG4uZmlyc3QtZGVzY3JpcHRpb24ge1xuICBwYWRkaW5nLXRvcDogMS4yZXg7XG5cbn1cblxuLmZpcnN0IHtcbiAgbWFyZ2luLXRvcDogOTVweFxufVxuXG4uY2hhcmFjdGVyIHtcblxuICBwYWRkaW5nLXRvcDogMS4yZXhcbn1cblxuLmhpZGRlbiB7XG4gIGRpc3BsYXk6IG5vbmVcbn1cblxuLmRpYWxvZyxcbi5zaG9ydC1kaWFsb2cge1xuICAgIG1hcmdpbi1yaWdodDo4JTtcbiAgICBtYXJnaW4tbGVmdDogOCU7XG59XG5cbi50cmFuc2l0aW9uIHtcbiAgcGFkZGluZy10b3A6IDNleDtcbiAgbWFyZ2luLWxlZnQ6IDY1JTtcbiAgcGFkZGluZy1ib3R0b206IDEuNWV4O1xufVxuXG4uc2NlbmUtaGVhZGVyIHtcbiAgZm9udC13ZWlnaHQ6IDkwMDtcbn1cblxuLnNob3Qge1xuICB0ZXh0LWFsaWduOiByaWdodDtcbiAgZm9udC13ZWlnaHQ6IDkwMDtcbn1cblxuLmhpZGRlbiB7XG4gIGRpc3BsYXk6IG5vbmVcbn1cblxuLnNjZW5lLW51bWJlci1sZWZ0IHtcbiAgbWFyZ2luLWxlZnQ6IC01MHB4O1xuICBmbG9hdDogbGVmdDtcbiAgdGV4dC1hbGlnbjogbGVmdDtcbiAgZm9udC13ZWlnaHQ6IDkwMDtcbn1cblxuLnNjZW5lLW51bWJlci1yaWdodCB7XG4gIG1hcmdpbi1yaWdodDogMHB4O1xuICBmbG9hdDogcmlnaHQ7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICBmb250LXdlaWdodDogOTAwO1xufVxuLmJ1dHRvbi1jb250YWluZXJ7XG4gICAgZGlzcGxheTpncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcbn0iXX0= */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](IssueComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-issue',
          templateUrl: './issue.component.html',
          styleUrls: ['./issue.component.css']
        }]
      }], function () {
        return [{
          type: _upload_service__WEBPACK_IMPORTED_MODULE_2__["UploadService"]
        }, {
          type: _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MatDialogRef"]
        }, {
          type: undefined,
          decorators: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Inject"],
            args: [_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MAT_DIALOG_DATA"]]
          }]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/nav/nav.component.ts":
  /*!**************************************!*\
    !*** ./src/app/nav/nav.component.ts ***!
    \**************************************/

  /*! exports provided: NavComponent */

  /***/
  function srcAppNavNavComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "NavComponent", function () {
      return NavComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! @angular/cdk/layout */
    "./node_modules/@angular/cdk/__ivy_ngcc__/fesm2015/layout.js");
    /* harmony import */


    var rxjs_operators__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! rxjs/operators */
    "./node_modules/rxjs/_esm2015/operators/index.js");
    /* harmony import */


    var _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/material/sidenav */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sidenav.js");
    /* harmony import */


    var _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! @angular/material/toolbar */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/toolbar.js");
    /* harmony import */


    var _angular_material_list__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! @angular/material/list */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/list.js");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _angular_material_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
    /*! @angular/material/button */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/button.js");
    /* harmony import */


    var _angular_material_icon__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! @angular/material/icon */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/icon.js");

    function NavComponent_button_17_Template(rf, ctx) {
      if (rf & 1) {
        var _r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "button", 6);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function NavComponent_button_17_Template_button_click_0_listener() {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          var _r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](2);

          return _r0.toggle();
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "mat-icon", 7);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "menu");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    var NavComponent = function NavComponent(breakpointObserver) {
      _classCallCheck(this, NavComponent);

      this.breakpointObserver = breakpointObserver;
      this.isHandset$ = this.breakpointObserver.observe(_angular_cdk_layout__WEBPACK_IMPORTED_MODULE_1__["Breakpoints"].Handset).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_2__["map"])(function (result) {
        return result.matches;
      }), Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_2__["shareReplay"])());
    };

    NavComponent.ɵfac = function NavComponent_Factory(t) {
      return new (t || NavComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_cdk_layout__WEBPACK_IMPORTED_MODULE_1__["BreakpointObserver"]));
    };

    NavComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: NavComponent,
      selectors: [["app-nav"]],
      decls: 22,
      vars: 12,
      consts: [[1, "sidenav-container"], ["fixedInViewport", "", 1, "sidenav", 3, "mode", "opened"], ["drawer", ""], ["mat-list-item", "", "href", "#"], ["color", "primary"], ["type", "button", "aria-label", "Toggle sidenav", "mat-icon-button", "", 3, "click", 4, "ngIf"], ["type", "button", "aria-label", "Toggle sidenav", "mat-icon-button", "", 3, "click"], ["aria-label", "Side nav toggle icon"]],
      template: function NavComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-sidenav-container", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "mat-sidenav", 1, 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](3, "async");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](4, "async");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](5, "async");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "mat-toolbar");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7, "Menu");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "mat-nav-list");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "a", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](10, "Profile - we're working on it");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "a", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](12, "Upolad - coming soon");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "a", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](14, "Pricing - also on the way");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "mat-sidenav-content");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](16, "mat-toolbar", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](17, NavComponent_button_17_Template, 3, 0, "button", 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](18, "async");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](19, "span");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](20, "Welcome to CheapSide");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](21, "router-outlet");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("mode", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](4, 6, ctx.isHandset$) ? "over" : "side")("opened", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](5, 8, ctx.isHandset$) === false);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("role", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](3, 4, ctx.isHandset$) ? "dialog" : "navigation");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](16);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](18, 10, ctx.isHandset$));
        }
      },
      directives: [_angular_material_sidenav__WEBPACK_IMPORTED_MODULE_3__["MatSidenavContainer"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_3__["MatSidenav"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_4__["MatToolbar"], _angular_material_list__WEBPACK_IMPORTED_MODULE_5__["MatNavList"], _angular_material_list__WEBPACK_IMPORTED_MODULE_5__["MatListItem"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_3__["MatSidenavContent"], _angular_common__WEBPACK_IMPORTED_MODULE_6__["NgIf"], _angular_router__WEBPACK_IMPORTED_MODULE_7__["RouterOutlet"], _angular_material_button__WEBPACK_IMPORTED_MODULE_8__["MatButton"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_9__["MatIcon"]],
      pipes: [_angular_common__WEBPACK_IMPORTED_MODULE_6__["AsyncPipe"]],
      styles: [".sidenav-container[_ngcontent-%COMP%] {\n  height: 100%;\n}\n\n.sidenav[_ngcontent-%COMP%] {\n  width: 200px;\n}\n\n.sidenav[_ngcontent-%COMP%]   .mat-toolbar[_ngcontent-%COMP%] {\n  background: inherit;\n}\n\n.mat-toolbar.mat-primary[_ngcontent-%COMP%] {\n  position: -webkit-sticky;\n  position: sticky;\n  top: 0;\n  z-index: 1;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvbmF2L25hdi5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsWUFBWTtBQUNkOztBQUVBO0VBQ0UsWUFBWTtBQUNkOztBQUVBO0VBQ0UsbUJBQW1CO0FBQ3JCOztBQUVBO0VBQ0Usd0JBQWdCO0VBQWhCLGdCQUFnQjtFQUNoQixNQUFNO0VBQ04sVUFBVTtBQUNaIiwiZmlsZSI6InNyYy9hcHAvbmF2L25hdi5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLnNpZGVuYXYtY29udGFpbmVyIHtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuXG4uc2lkZW5hdiB7XG4gIHdpZHRoOiAyMDBweDtcbn1cblxuLnNpZGVuYXYgLm1hdC10b29sYmFyIHtcbiAgYmFja2dyb3VuZDogaW5oZXJpdDtcbn1cblxuLm1hdC10b29sYmFyLm1hdC1wcmltYXJ5IHtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiAxO1xufVxuIl19 */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](NavComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-nav',
          templateUrl: './nav.component.html',
          styleUrls: ['./nav.component.css']
        }]
      }], function () {
        return [{
          type: _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_1__["BreakpointObserver"]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/navbar/navbar.component.ts":
  /*!********************************************!*\
    !*** ./src/app/navbar/navbar.component.ts ***!
    \********************************************/

  /*! exports provided: NavbarComponent */

  /***/
  function srcAppNavbarNavbarComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "NavbarComponent", function () {
      return NavbarComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var NavbarComponent = /*#__PURE__*/function () {
      function NavbarComponent() {
        _classCallCheck(this, NavbarComponent);
      }

      _createClass(NavbarComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }]);

      return NavbarComponent;
    }();

    NavbarComponent.ɵfac = function NavbarComponent_Factory(t) {
      return new (t || NavbarComponent)();
    };

    NavbarComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: NavbarComponent,
      selectors: [["app-navbar"]],
      decls: 2,
      vars: 0,
      template: function NavbarComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "p");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, "navbar works!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL25hdmJhci9uYXZiYXIuY29tcG9uZW50LmNzcyJ9 */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](NavbarComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-navbar',
          templateUrl: './navbar.component.html',
          styleUrls: ['./navbar.component.css']
        }]
      }], function () {
        return [];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/script/script.component.ts":
  /*!********************************************!*\
    !*** ./src/app/script/script.component.ts ***!
    \********************************************/

  /*! exports provided: ScriptComponent */

  /***/
  function srcAppScriptScriptComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "ScriptComponent", function () {
      return ScriptComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var ScriptComponent = /*#__PURE__*/function () {
      function ScriptComponent() {
        _classCallCheck(this, ScriptComponent);
      }

      _createClass(ScriptComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }]);

      return ScriptComponent;
    }();

    ScriptComponent.ɵfac = function ScriptComponent_Factory(t) {
      return new (t || ScriptComponent)();
    };

    ScriptComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: ScriptComponent,
      selectors: [["app-script"]],
      decls: 2,
      vars: 0,
      template: function ScriptComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "p");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, "script works!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL3NjcmlwdC9zY3JpcHQuY29tcG9uZW50LmNzcyJ9 */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](ScriptComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-script',
          templateUrl: './script.component.html',
          styleUrls: ['./script.component.css']
        }]
      }], function () {
        return [];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/upload.service.ts":
  /*!***********************************!*\
    !*** ./src/app/upload.service.ts ***!
    \***********************************/

  /*! exports provided: UploadService */

  /***/
  function srcAppUploadServiceTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "UploadService", function () {
      return UploadService;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var rxjs_operators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! rxjs/operators */
    "./node_modules/rxjs/_esm2015/operators/index.js");
    /* harmony import */


    var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/common/http */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/http.js");

    var UploadService = /*#__PURE__*/function () {
      function UploadService(httpClient) {
        _classCallCheck(this, UploadService);

        this.httpClient = httpClient;
        this.httpOptions = {
          headers: null,
          params: null,
          responseType: null
        }; //   THIS NEEDS TO BE UN COMMENTED AND ADDED BEFORE ALL THE URL TARGETS IN THE GET METHODS

        this.url = "https://sides3.herokuapp.com";
      }

      _createClass(UploadService, [{
        key: "getPDF",
        value: function getPDF(name) {
          var params = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpParams"]();
          params.append("name", name);
          this.httpOptions.params = params;
          this.httpOptions.headers = new Headers();
          this.httpOptions.responseType = "blob";
          return this.httpClient.get(this.url + "/complete", {
            responseType: "blob",
            params: {
              name: this.script
            }
          });
        }
      }, {
        key: "getFile",
        value: function getFile(name) {
          var params = new _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpParams"]();
          params.append("name", name);
          this.httpOptions.params = params;
          this.httpOptions.headers = new Headers();
          this.httpOptions.responseType = "blob"; // console.log(name)
          // headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

          return this.httpClient.get(this.url + '/download', {
            responseType: "blob",
            params: {
              name: this.script
            }
          });
        }
      }, {
        key: "resetHttpOptions",
        value: function resetHttpOptions() {
          this.httpOptions = {
            headers: "",
            params: null,
            responseType: null
          };
        } // get classified data 

      }, {
        key: "postFile",
        value: function postFile(fileToUpload) {
          this.resetHttpOptions();
          this.script = localStorage.getItem('name');
          var endpoint = '/api';
          var formData = new FormData();
          formData.append('script', fileToUpload, fileToUpload.name);
          return this.httpClient.post(this.url + "/api", formData, this.httpOptions).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_1__["map"])(function (data) {
            return data;
          }));
        }
      }, {
        key: "generatePdf",
        value: function generatePdf(sceneArr, name) {
          console.log("calling generatePDF");
          sceneArr.push(name); // change this to just refrence the page breaks and then add x out to all other lines
          // let document= []
          // document.push(name)
          // sceneArr.forEach(pageArr => {
          //   for (let i = 0; i < pageArr.length-1; i++){
          //     document.push(this.lineArr[pageArr[i].index])
          // }
          // })

          console.log(sceneArr);
          return this.httpClient.post(this.url + "/pdf", sceneArr);
        }
      }]);

      return UploadService;
    }();

    UploadService.ɵfac = function UploadService_Factory(t) {
      return new (t || UploadService)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵinject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpClient"]));
    };

    UploadService.ɵprov = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({
      token: UploadService,
      factory: UploadService.ɵfac,
      providedIn: 'root'
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](UploadService, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"],
        args: [{
          providedIn: 'root'
        }]
      }], function () {
        return [{
          type: _angular_common_http__WEBPACK_IMPORTED_MODULE_2__["HttpClient"]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/app/upload/upload.component.ts":
  /*!********************************************!*\
    !*** ./src/app/upload/upload.component.ts ***!
    \********************************************/

  /*! exports provided: UploadComponent */

  /***/
  function srcAppUploadUploadComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "UploadComponent", function () {
      return UploadComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");

    var UploadComponent = /*#__PURE__*/function () {
      function UploadComponent(upload, router) {
        _classCallCheck(this, UploadComponent);

        this.upload = upload;
        this.router = router;
      }

      _createClass(UploadComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          this.upload.lineArr = [];
        }
      }, {
        key: "ngOnDestroy",
        value: function ngOnDestroy() {
          //Called once, before the instance is destroyed.
          //Add 'implements OnDestroy' to the class.
          this.dataSubscription.unsubscribe();
        }
      }, {
        key: "handleFileInput",
        value: function handleFileInput(files) {
          var _this7 = this;

          this.fileToUpload = files.item(0);
          localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ""));
          this.$script_data = this.upload.postFile(this.fileToUpload);
          this.dataSubscription = this.$script_data.subscribe(function (data) {
            console.log(data);
            _this7.lines = data[0];
            _this7.upload.lineArr = data[0];
            _this7.upload.issues = data[1];

            _this7.router.navigate(["download"]);
          });
        }
      }]);

      return UploadComponent;
    }();

    UploadComponent.ɵfac = function UploadComponent_Factory(t) {
      return new (t || UploadComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"]));
    };

    UploadComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: UploadComponent,
      selectors: [["app-upload"]],
      decls: 26,
      vars: 0,
      consts: [[1, "form-group", "center"], [1, "three-column", "center"], ["href", "https://www.heroku.com/policy/security", 2, "color", "red"], [1, "center"], ["for", "file"], ["name", "script", "enctype", "multipart/form-data", "type", "file", "id", "script", 3, "change"]],
      template: function UploadComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, "Our AI saves your crew's time.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5, "Give us a script - we'll give you your scenes.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7, "We crawl your script and line out all the stuff you dont need so your PA's and AD's can get to real work");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9, "All for a buck.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](12, "Your script is SAFE with us.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](14, "Our software NEVER saves your pages");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, "We're backed by ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](17, "a", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](18, "Heroku");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](19, " your script is in good hands");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](20, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](21, "label", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](22, "Upload your script");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](23, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](24, "input", 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("change", function UploadComponent_Template_input_change_24_listener($event) {
            return ctx.handleFileInput($event.target.files);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](25, "div");
        }
      },
      styles: [".body[_ngcontent-%COMP%]{margin-left: 10%; margin-right: 10%; top:2%; bottom: 2%}\nh3[_ngcontent-%COMP%]{\n    font:45px;\n\n}\nh4[_ngcontent-%COMP%]{\n    font:36px;\n}\n.three-column[_ngcontent-%COMP%]{\n    display:grid;\n    grid-template-columns:1fr 1fr 1fr ;\n    padding:2% 5%;\n    border-bottom:2px solid white;\n}\n.center[_ngcontent-%COMP%]{\n    text-align: center;\n}\n.sceneheader[_ngcontent-%COMP%], .character[_ngcontent-%COMP%] { padding-top: 1.5ex; }\n.version[_ngcontent-%COMP%] { display: none;}\n.description[_ngcontent-%COMP%] { padding-right: 10%; }\n.character[_ngcontent-%COMP%] { margin-left: 20%; text-align: center; margin-right: 20%; padding-top:15px}\n.dialog[_ngcontent-%COMP%], .short-dialog[_ngcontent-%COMP%] { margin-left: 20%;  }\n.short-dialog[_ngcontent-%COMP%]{ padding-bottom:10px}\n.parenthetical[_ngcontent-%COMP%] { margin-left: 20%; }\n\n.dialogue[_ngcontent-%COMP%]    + .parenthetical[_ngcontent-%COMP%] { padding-bottom: 0; }\n.transition[_ngcontent-%COMP%] { padding-top: 3ex; margin-left: 65%; padding-bottom: 1.5ex; }\n.scene-header[_ngcontent-%COMP%]{ font-weight:900; padding-top: 20px; padding-bottom:20px}\n.shot[_ngcontent-%COMP%]{ text-align: right; font-weight: 900;}\n.hidden[_ngcontent-%COMP%]{display:none}\nli[_ngcontent-%COMP%] { font: 12px Courier, fixed; list-style-type: none; line-height: normal; }\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvdXBsb2FkL3VwbG9hZC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFVBQVU7QUFDN0Q7SUFDSSxTQUFTOztBQUViO0FBQ0E7SUFDSSxTQUFTO0FBQ2I7QUFDQTtJQUNJLFlBQVk7SUFDWixrQ0FBa0M7SUFDbEMsYUFBYTtJQUNiLDZCQUE2QjtBQUNqQztBQUNBO0lBQ0ksa0JBQWtCO0FBQ3RCO0FBQ0EsMkJBQTJCLGtCQUFrQixFQUFFO0FBQy9DLFdBQVcsYUFBYSxDQUFDO0FBQ3pCLGVBQWUsa0JBQWtCLEVBQUU7QUFFbkMsYUFBYSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0I7QUFFdEYseUJBQXlCLGdCQUFnQixHQUFHO0FBQzVDLGVBQWUsbUJBQW1CO0FBQ2xDLGlCQUFpQixnQkFBZ0IsRUFBRTtBQUVuQyw4RkFBOEY7QUFFOUYsNkJBQTZCLGlCQUFpQixFQUFFO0FBRWhELGNBQWMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUU7QUFDekUsZUFBZSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CO0FBQ3RFLE9BQU8saUJBQWlCLEVBQUUsZ0JBQWdCLENBQUM7QUFDM0MsUUFBUSxZQUFZO0FBQ3BCLEtBQUsseUJBQXlCLEVBQUUscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUiLCJmaWxlIjoic3JjL2FwcC91cGxvYWQvdXBsb2FkLmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuYm9keXttYXJnaW4tbGVmdDogMTAlOyBtYXJnaW4tcmlnaHQ6IDEwJTsgdG9wOjIlOyBib3R0b206IDIlfVxuaDN7XG4gICAgZm9udDo0NXB4O1xuXG59XG5oNHtcbiAgICBmb250OjM2cHg7XG59XG4udGhyZWUtY29sdW1ue1xuICAgIGRpc3BsYXk6Z3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyIDFmciAxZnIgO1xuICAgIHBhZGRpbmc6MiUgNSU7XG4gICAgYm9yZGVyLWJvdHRvbToycHggc29saWQgd2hpdGU7XG59XG4uY2VudGVye1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cbi5zY2VuZWhlYWRlciwgLmNoYXJhY3RlciB7IHBhZGRpbmctdG9wOiAxLjVleDsgfVxuLnZlcnNpb24geyBkaXNwbGF5OiBub25lO31cbi5kZXNjcmlwdGlvbiB7IHBhZGRpbmctcmlnaHQ6IDEwJTsgfVxuXG4uY2hhcmFjdGVyIHsgbWFyZ2luLWxlZnQ6IDIwJTsgdGV4dC1hbGlnbjogY2VudGVyOyBtYXJnaW4tcmlnaHQ6IDIwJTsgcGFkZGluZy10b3A6MTVweH1cblxuLmRpYWxvZywgLnNob3J0LWRpYWxvZyB7IG1hcmdpbi1sZWZ0OiAyMCU7ICB9XG4uc2hvcnQtZGlhbG9neyBwYWRkaW5nLWJvdHRvbToxMHB4fVxuLnBhcmVudGhldGljYWwgeyBtYXJnaW4tbGVmdDogMjAlOyB9XG5cbi8qIHNwZWNpYWwgY2FzZTogZGlhbG9ndWUgZm9sbG93ZWQgYnkgYSBwYXJlbnRoZXRpY2FsOyB0aGUgZXh0cmEgbGluZSBuZWVkcyB0byBiZSBzdXBwcmVzc2VkICovXG5cbi5kaWFsb2d1ZSArIC5wYXJlbnRoZXRpY2FsIHsgcGFkZGluZy1ib3R0b206IDA7IH1cblxuLnRyYW5zaXRpb24geyBwYWRkaW5nLXRvcDogM2V4OyBtYXJnaW4tbGVmdDogNjUlOyBwYWRkaW5nLWJvdHRvbTogMS41ZXg7IH1cbi5zY2VuZS1oZWFkZXJ7IGZvbnQtd2VpZ2h0OjkwMDsgcGFkZGluZy10b3A6IDIwcHg7IHBhZGRpbmctYm90dG9tOjIwcHh9XG4uc2hvdHsgdGV4dC1hbGlnbjogcmlnaHQ7IGZvbnQtd2VpZ2h0OiA5MDA7fVxuLmhpZGRlbntkaXNwbGF5Om5vbmV9XG5saSB7IGZvbnQ6IDEycHggQ291cmllciwgZml4ZWQ7IGxpc3Qtc3R5bGUtdHlwZTogbm9uZTsgbGluZS1oZWlnaHQ6IG5vcm1hbDsgfSJdfQ== */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](UploadComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-upload',
          templateUrl: './upload.component.html',
          styleUrls: ['./upload.component.css']
        }]
      }], function () {
        return [{
          type: _upload_service__WEBPACK_IMPORTED_MODULE_1__["UploadService"]
        }, {
          type: _angular_router__WEBPACK_IMPORTED_MODULE_2__["Router"]
        }];
      }, null);
    })();
    /***/

  },

  /***/
  "./src/environments/environment.ts":
  /*!*****************************************!*\
    !*** ./src/environments/environment.ts ***!
    \*****************************************/

  /*! exports provided: environment */

  /***/
  function srcEnvironmentsEnvironmentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "environment", function () {
      return environment;
    }); // This file can be replaced during build by using the `fileReplacements` array.
    // `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
    // The list of file replacements can be found in `angular.json`.


    var environment = {
      production: false
    };
    /*
     * For easier debugging in development mode, you can import the following file
     * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
     *
     * This import should be commented out in production mode because it will have a negative impact
     * on performance if an error is thrown.
     */
    // import 'zone.js/dist/zone-error';  // Included with Angular CLI.

    /***/
  },

  /***/
  "./src/main.ts":
  /*!*********************!*\
    !*** ./src/main.ts ***!
    \*********************/

  /*! no exports provided */

  /***/
  function srcMainTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");
    /* harmony import */


    var _environments_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! ./environments/environment */
    "./src/environments/environment.ts");
    /* harmony import */


    var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! ./app/app.module */
    "./src/app/app.module.ts");
    /* harmony import */


    var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/platform-browser */
    "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/platform-browser.js");

    if (_environments_environment__WEBPACK_IMPORTED_MODULE_1__["environment"].production) {
      Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
    }

    _angular_platform_browser__WEBPACK_IMPORTED_MODULE_3__["platformBrowser"]().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"])["catch"](function (err) {
      return console.error(err);
    });
    /***/

  },

  /***/
  0:
  /*!***************************!*\
    !*** multi ./src/main.ts ***!
    \***************************/

  /*! no static exports found */

  /***/
  function _(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(
    /*! /Users/timmckiernan/Desktop/sideWays/src/main.ts */
    "./src/main.ts");
    /***/
  }
}, [[0, "runtime", "vendor"]]]);
//# sourceMappingURL=main-es5.js.map