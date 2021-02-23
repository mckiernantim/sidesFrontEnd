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
      styles: [".selections-container[_ngcontent-%COMP%]{\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n\n}\n.layout-button[_ngcontent-%COMP%]{\n    max-width:200px;\n    \n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0ksYUFBYTtJQUNiLDhCQUE4Qjs7QUFFbEM7QUFDQTtJQUNJLGVBQWU7O0FBRW5CIiwiZmlsZSI6ImFwcC5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLnNlbGVjdGlvbnMtY29udGFpbmVye1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyO1xuXG59XG4ubGF5b3V0LWJ1dHRvbntcbiAgICBtYXgtd2lkdGg6MjAwcHg7XG4gICAgXG59Il19 */"]
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


    var _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
    /*! ./dashboard-right/dashboard-right.component */
    "./src/app/dashboard-right/dashboard-right.component.ts");
    /* harmony import */


    var _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
    /*! ./dashboard/dashboard.component */
    "./src/app/dashboard/dashboard.component.ts");
    /* harmony import */


    var _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! ./navbar/navbar.component */
    "./src/app/navbar/navbar.component.ts");
    /* harmony import */


    var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
    /*! @angular/platform-browser/animations */
    "./node_modules/@angular/platform-browser/__ivy_ngcc__/fesm2015/animations.js");
    /* harmony import */


    var _nav_nav_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(
    /*! ./nav/nav.component */
    "./src/app/nav/nav.component.ts");
    /* harmony import */


    var _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(
    /*! @angular/cdk/layout */
    "./node_modules/@angular/cdk/__ivy_ngcc__/fesm2015/layout.js");
    /* harmony import */


    var _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(
    /*! @angular/material/toolbar */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/toolbar.js");
    /* harmony import */


    var _angular_material_button__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(
    /*! @angular/material/button */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/button.js");
    /* harmony import */


    var _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(
    /*! @angular/material/sidenav */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sidenav.js");
    /* harmony import */


    var _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(
    /*! @angular/material/icon */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/icon.js");
    /* harmony import */


    var _angular_material_list__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(
    /*! @angular/material/list */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/list.js");
    /* harmony import */


    var _angular_material_input__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(
    /*! @angular/material/input */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/input.js");
    /* harmony import */


    var _script_script_component__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(
    /*! ./script/script.component */
    "./src/app/script/script.component.ts");
    /* harmony import */


    var _angular_material_table__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(
    /*! @angular/material/table */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/table.js");
    /* harmony import */


    var _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(
    /*! @angular/material/paginator */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/paginator.js");
    /* harmony import */


    var _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(
    /*! @angular/material/sort */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/sort.js");
    /* harmony import */


    var _angular_forms__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(
    /*! @angular/forms */
    "./node_modules/@angular/forms/__ivy_ngcc__/fesm2015/forms.js");
    /* harmony import */


    var _complete_complete_component__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(
    /*! ./complete/complete.component */
    "./src/app/complete/complete.component.ts");
    /* harmony import */


    var _issue_issue_component__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(
    /*! ./issue/issue.component */
    "./src/app/issue/issue.component.ts");
    /* harmony import */


    var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(
    /*! @angular/material/dialog */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/dialog.js");
    /* harmony import */


    var _angular_fire__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(
    /*! @angular/fire */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire.js");
    /* harmony import */


    var _environments_environment__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(
    /*! ../environments/environment */
    "./src/environments/environment.ts");
    /* harmony import */


    var _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(
    /*! @angular/fire/firestore */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire-firestore.js");
    /* harmony import */


    var _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(
    /*! ./dual-dialog/dual-dialog.component */
    "./src/app/dual-dialog/dual-dialog.component.ts"); // Firebase


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
      imports: [[_angular_fire__WEBPACK_IMPORTED_MODULE_27__["AngularFireModule"].initializeApp(_environments_environment__WEBPACK_IMPORTED_MODULE_28__["environment"].firebaseConfig, 'sideWays'), _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_29__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"]]]
    });

    (function () {
      (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppModule, {
        declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_7__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_8__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_9__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_11__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_19__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_24__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_25__["IssueComponent"], _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_30__["DualDialogComponent"]],
        imports: [_angular_fire__WEBPACK_IMPORTED_MODULE_27__["AngularFireModule"], _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_29__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"]]
      });
    })();
    /*@__PURE__*/


    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](AppModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"],
        args: [{
          declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_7__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_8__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_9__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_11__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_19__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_24__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_25__["IssueComponent"], _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_30__["DualDialogComponent"]],
          imports: [_angular_fire__WEBPACK_IMPORTED_MODULE_27__["AngularFireModule"].initializeApp(_environments_environment__WEBPACK_IMPORTED_MODULE_28__["environment"].firebaseConfig, 'sideWays'), _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_29__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"]],
          providers: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["DatePipe"]],
          entryComponents: [_issue_issue_component__WEBPACK_IMPORTED_MODULE_25__["IssueComponent"]],
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
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");

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
      decls: 27,
      vars: 0,
      consts: [["href", "mailto:sidewaystesters@gmail.com", 2, "color", "red"], ["routerLink", ""], [3, "click"]],
      template: function CompleteComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Thanks helping us with SideWays! ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Please hit us up at ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "a", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6, "sideWaysHelp@gmail.com");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7, " with any issues you encountered.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9, "It would help us greatly if you could include ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "ul");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](12, " The original PDF pages ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](14, " The created pages ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, " What broweser you used. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](17, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](18, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](19, " Thanks so much for your help as we move forward. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](20, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](21, " and if you go tthe time ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](22, "a", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](23, "Do it again!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](24, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](25, "button", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function CompleteComponent_Template_button_click_25_listener() {
            return ctx.downloadPDF();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](26, "Download PDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_angular_router__WEBPACK_IMPORTED_MODULE_2__["RouterLinkWithHref"]],
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJjb21wbGV0ZS9jb21wbGV0ZS5jb21wb25lbnQuY3NzIn0= */"]
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


    var _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! @angular/fire/firestore */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire-firestore.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
    /*! ./../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
    /*! @angular/material/dialog */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/dialog.js");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
    /*! @angular/material/form-field */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/form-field.js");
    /* harmony import */


    var _angular_material_input__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(
    /*! @angular/material/input */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/input.js");

    function DashboardRightComponent_li_10_Template(rf, ctx) {
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

    function DashboardRightComponent_th_32_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Scene Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_33_Template(rf, ctx) {
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

    function DashboardRightComponent_th_35_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Page Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_36_Template(rf, ctx) {
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

    function DashboardRightComponent_th_38_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Title ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_39_Template(rf, ctx) {
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

    function DashboardRightComponent_th_41_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Text ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_42_Template(rf, ctx) {
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

    function DashboardRightComponent_th_44_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Select ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_45_Template(rf, ctx) {
      if (rf & 1) {
        var _r25 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "input", 22);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("change", function DashboardRightComponent_td_45_Template_input_change_1_listener($event) {
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

    function DashboardRightComponent_tr_46_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 23);
      }
    }

    function DashboardRightComponent_tr_47_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 24);
      }
    }

    function DashboardRightComponent_tr_48_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "tr", 25);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "td", 26);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        var _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵreference"](28);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("No data matching the filter \"", _r1.value, "\"");
      }
    }

    var _c0 = function _c0() {
      return [10, 25, 100];
    };

    var DashboardRightComponent = /*#__PURE__*/function () {
      function DashboardRightComponent(db, upload, router, dialog, datePipe) {
        _classCallCheck(this, DashboardRightComponent);

        this.db = db;
        this.upload = upload;
        this.router = router;
        this.dialog = dialog;
        this.datePipe = datePipe;
        this.displayedColumns = ['number', "page number", 'text', "preview", "select"];
        this.dataReady = false;
        this.initialSelection = [];
        this.active = true;
        this.script = localStorage.getItem("name");
        this.db = db;
        this.problemsData = db.collection('problemLines').valueChanges();
        this.linesCrawled = db.collection('funData').doc('totalLines').valueChanges();
        this.funData = db.collection('funData');
        this.totalLines; // this.funData.doc('totalLines').valueChanges().subscribe(
        //   doc => {
        //     this.totalLines = doc['total'];
        //     this.charactersCount = doc['characters'];
        //     this.scenesCount = doc['scenes'];
        //     console.log(this.scenes)
        //     console.log(this.scenesCount)
        //   })
      }

      _createClass(DashboardRightComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          var _this = this;

          this.linesReady = false;
          this.date = Date.now();
          this.selected = [];
          this.pageLengths = [];
          this.pages = [];
          this.active = true;
          this.scriptProblems = [];
          this.modalData = [];
          this.scriptData = this.upload.lineArr;
          this.totalPages = this.upload.pagesArr;
          this.characters = this.scriptData.filter(function (line) {
            return line.category === "character";
          });
          this.characters = _toConsumableArray(new Set(this.characters.map(function (line) {
            return line.text.replace(/\s/g, '');
          })));
          this.scenes = this.scriptData.filter(function (line) {
            return line.category === "scene-header";
          });

          for (var i = 0; i < this.scenes.length; i++) {
            // give scenes extra data
            if (this.scenes[i + 1]) {
              var last = this.scenes[i + 1].index; // next scenes first line

              this.scenes[i].lastLine = this.scriptData[this.scenes[i + 1].index - 1].index; // last lines page

              this.scenes[i].lastPage = this.scriptData[this.scenes[i].lastLine].page;
              this.scenes[i].firstLine = this.scriptData[this.scenes[i].index - 1].index;
              this.scenes[i].preview = this.getPreview(i);
            }

            this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatTableDataSource"](this.scenes);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.length = this.scriptData.length;
          } //  NO LONGER NECESARRY BECAUSE OF X Y POS
          // this.scriptProblems = this.upload.issues
          // this.scriptProblems.forEach(line => {
          //   line.text = this.lookBack(line)
          // })


          this.dataReady = true;
          var probsArr = []; // here is our issue !&@#!*@#&!#&!*&

          this.scriptProblems.forEach(function (line) {
            var ind = line.index;
            var scene = _this.scriptData[ind].sceneIndex;

            var problem = _this.scenes.map(function (scene) {
              return scene.sceneIndex;
            }).indexOf(scene); // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LINE


            probsArr.push(problem); // filter through script problems and then go to scenes and add problem flags for each index at proper location
          });

          if (probsArr.length > 0) {
            probsArr = _toConsumableArray(new Set(probsArr));

            var _loop = function _loop(_i) {
              //  get an array of problem lines for the scenes
              if (_this.scenes[probsArr[_i].problems]) {
                _this.scenes[probsArr[_i]].problems = _this.scriptProblems.filter(function (line) {
                  return line.sceneNumber === probsArr[_i];
                });
              }
            };

            for (var _i = 0; _i < probsArr.length; _i++) {
              _loop(_i);
            }

            this.db.collection('problemLines').add({
              title: this.script,
              data: this.scriptProblems,
              date: new Date().toISOString()
            });
          }

          console.log(this.scriptData);
          this.length = this.scriptData.length; // assign PAGENUMBER values to page 0 and 1 in order for future 

          for (var _i2 = 0; _i2 < 200; _i2++) {
            this.scriptData[_i2].page == 0 ? this.scriptData[_i2].pageNumber = 0 : this.scriptData[_i2].page == 1 ? this.scriptData[_i2].pageNumber = 1 : this.scriptData;
          }
        } // ngAfterViewInit():void{
        // if( this.upload.lineArr){
        //   this.linesReady = true;
        //   this.updateFunData()
        // }
        // }
        // updateFunData(){
        //   this.linesReady = true
        //   console.log(this.scenes)
        //   console.log(this.scenesCount)
        //   this.db.collection('funData')
        //   .doc('totalLines')
        //   .set({
        //     total:this.length+this.totalLines,
        //     scenes:this.scenesCount+this.scenes.length,
        //     characters:this.charactersCount + this.characters.length,
        //   })
        // }
        // lets get lookback tighter  - should be able to refrence lastCharacterIndex

      }, {
        key: "lookBack",
        value: function lookBack(line) {
          var newText = "";
          newText = this.scriptData[line.lastCharIndex].text;
          var ind = line.index;

          for (var i = line.lastCharIndex + 1; i < ind + 1; i++) {
            newText = newText + "\n" + this.scriptData[i].text;

            if (this.scriptData[i].category === ("more" || false || false) || this.scriptData[i].subCategory === "parenthetical") {}
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

          var num = data[data.length - 1].page;

          var _loop2 = function _loop2(i) {
            var page = data.filter(function (line) {
              return line.page === i;
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
        } // changeDual(line){
        //   line.siblings.forEach(sibling => {
        //     sibling.visible = "true"
        //     sibling.children.forEach(child => child.visible = "true")
        //   })
        // }
        //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true

      }, {
        key: "makeVisible",
        value: function makeVisible(sceneArr, breaks) {
          breaks = breaks.sort(function (a, b) {
            return a.first - b.first;
          });
          console.log(sceneArr);
          console.log("svene arr ^^^^^^");
          console.log(breaks);
          var merged = [].concat.apply([], sceneArr);
          var counter = 0;

          for (var i = 0; i < merged.length; i++) {
            if (breaks[counter] && merged[i].index > breaks[counter].first && merged[i].index <= breaks[counter].last) {
              merged[i].visible = "true";

              if (merged[i].bar === "noBar") {
                merged[i].bar = "bar";
              } // if(merged[i].siblings){
              //   this.changeDual(merged[i])
              // }


              if (merged[i].index === breaks[counter].last) {
                counter += 1;
              }
            } else if (!breaks[counter]) {
              break;
            }
          }

          merged.forEach(function (item) {
            if (item.category === "page-number-hidden" || item.category === "page-number") {
              item.visible = 'true';
            }
          });
          return merged;
        }
      }, {
        key: "checkPageOne",
        value: function checkPageOne(arr) {// for(let i=0 ;i<50; i++){
          //      arr[i].page==1 ? arr[i].pageNumber="1" : arr[i] = arr[i]
          // }
        }
      }, {
        key: "getPdf",
        value: function getPdf(sceneArr, name, numPages, layout) {
          var _this3 = this;

          sceneArr = this.sortByNum(sceneArr); // need first and last lines from selected

          var fullPages = [];
          var used = [];
          var pages = [];
          var sceneBreaks = [];
          sceneArr.forEach(function (scene) {
            for (var i = scene.page; i <= scene.lastPage; i++) {
              if (!pages.includes(i)) {
                pages.push(i);
              }
            }

            var breaks = {
              first: scene.firstLine,
              last: scene.lastLine,
              scene: scene.sceneNumber,
              firstPage: scene.page
            };
            sceneBreaks.push(breaks);
          });
          pages.forEach(function (page) {
            var doc = _this3.scriptData.filter(function (scene) {
              return scene.page === page;
            });

            doc.push({
              page: page,
              bar: "hideBar",
              hideCont: "hideCont",
              hideEnd: "hideEnd"
            });
            fullPages.push(doc);
          });
          fullPages = fullPages.sort(function (a, b) {
            return a[0].page > b[0].page ? 1 : -1;
          }); // fullPages =  this.checkPageOne(fullPages)

          var _final = this.makeVisible(fullPages, sceneBreaks);

          if (numPages.length > 1) {
            numPages = numPages[numPages.length - 1].page;

            _final.push(numPages);
          }

          console.log(_final);

          var trues = _final.filter(function (line) {
            return line.visible == 'true';
          });

          console.log(trues);
          var finalDocument = [];
          var page = [];

          for (var i = 0; i < _final.length; i++) {
            if (_final[i].page && !_final[i].text) {
              page.forEach(function (line) {
                var target = page.indexOf(line);

                if (page[target + 1] && (page[target + 1].visible == "false" || page[target + 1].category == "scene-header" || page[target + 1].category == "page-number" && page[target + 2].category == "scene-header") && line.visible == "true") {
                  line.end = "END";
                }
              });
              finalDocument.push(page);
              page = [];
            } else {
              page.push(_final[i]);
            }
          } // create continue arrows


          for (var _i3 = 0; _i3 < finalDocument.length - 1; _i3++) {
            var last = finalDocument[_i3][finalDocument[_i3].length - 1];
            var next = finalDocument[_i3 + 1];

            if (next[1].visible === "true") {
              last.cont = "CONTINUE", finalDocument[_i3 + 1][0].cont = "CONTINUE", finalDocument[_i3 + 1][0].top = "top";
            }

            last.cont ? last.barY = last.yPos - 10 : last;

            for (var j = 0; j < finalDocument[_i3].length; j++) {
              var current = finalDocument[_i3][j];
              current.visible == "true" && j < finalDocument.length - 1 && finalDocument[_i3][j + 1].visible == "false" ? current.end = "END" : current;
              current.end ? current.endY = current.yPos - 10 : current;
            }
          }

          this.upload.generatePdf(finalDocument, name, layout).subscribe(function (data) {
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
          var x = this.scenes.filter(function (scene) {
            return scene.problems;
          }).map(function (scene) {
            return scene = scene.problems;
          }).flat();
        }
      }, {
        key: "makePages",
        value: function makePages(scenes) {
          var pageNums = scenes.map(function (scene) {
            return scene.page;
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

          // THIS.MODAL DATA IS THE PROBLEM SOMEWHERE
          // this.modalData = this.scenes.filter(scene => {
          //  if(scene.problems){console.log(scene)}
          //   return scene.problems
          // }).map( scene => scene = scene.problems).flat();
          if (this.modalData) {
            // for (let i=0; i<this.modalData.length;i++) {
            //   if(this.modalData[i].text){
            //   this.modalData[i].text = this.modalData[i].text.split(/\n/)
            // }
            // }
            var dialogRef = this.dialog.open(_issue_issue_component__WEBPACK_IMPORTED_MODULE_0__["IssueComponent"], {
              width: '800px',
              data: {
                scenes: this.modalData,
                selected: this.selected
              }
            });
            dialogRef.afterClosed().subscribe(function (result) {
              console.log(result);
              result.callsheet = result.callsheet.name;
              console.log(result);

              _this4.getPdf(_this4.selected, _this4.script, _this4.totalPages, result);
            });
          } else this.getPdf(this.selected, this.script, this.totalPages, "");
        }
      }]);

      return DashboardRightComponent;
    }();

    DashboardRightComponent.ɵfac = function DashboardRightComponent_Factory(t) {
      return new (t || DashboardRightComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_fire_firestore__WEBPACK_IMPORTED_MODULE_5__["AngularFirestore"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_6__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_7__["Router"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__["MatDialog"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_9__["DatePipe"]));
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
      decls: 50,
      vars: 11,
      consts: [[1, "main-container"], [1, "controls-container"], [3, "click"], [4, "ngFor", "ngForOf"], [2, "width", "100%"], ["matInput", "", "placeholder", "Ex. Mia", 3, "keyup"], ["input", ""], [1, "mat-elevation-z8"], ["mat-table", "", "matSort", "", 3, "dataSource"], ["matColumnDef", "number"], ["mat-header-cell", "", "mat-sort-header", "", 4, "matHeaderCellDef"], ["mat-cell", "", 4, "matCellDef"], ["matColumnDef", "page number"], ["matColumnDef", "text"], ["matColumnDef", "preview"], ["matColumnDef", "select"], ["mat-header-row", "", 4, "matHeaderRowDef"], ["mat-row", "", 4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], [3, "pageSizeOptions"], ["mat-header-cell", "", "mat-sort-header", ""], ["mat-cell", ""], ["type", "checkbox", 3, "name", "change"], ["mat-header-row", ""], ["mat-row", ""], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"]],
      template: function DashboardRightComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "button", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DashboardRightComponent_Template_button_click_2_listener() {
            return ctx.openDialog();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3, "roll that beautiful bean footage");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "h2");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](8, "date");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](9, "ul");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](10, DashboardRightComponent_li_10_Template, 3, 3, "li", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](11, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](12, "button", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DashboardRightComponent_Template_button_click_12_listener() {
            return ctx.openDialog();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](13, "getPDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](14, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](15, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](16, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](17, "Here's your scenes. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](18, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](19, "Select up to 10 and we'll make em set ready.");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](20, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](21, "NOTICE - CURRENTLY THE LONGER THE FILE THE MORE SLIGHT DRIFT WE SEE IN THE FINAL PDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](22, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](23, "WE RECOMMEDN TRYING TO KEEP THE SIDES UNDER 20 PAGES FOR A DAY");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](24, "mat-form-field", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](25, "mat-label");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](26, "Filter");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](27, "input", 5, 6);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("keyup", function DashboardRightComponent_Template_input_keyup_27_listener($event) {
            return ctx.applyFilter($event);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](29, "div", 7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](30, "table", 8);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](31, 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](32, DashboardRightComponent_th_32_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](33, DashboardRightComponent_td_33_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](34, 12);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](35, DashboardRightComponent_th_35_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](36, DashboardRightComponent_td_36_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](37, 13);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](38, DashboardRightComponent_th_38_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](39, DashboardRightComponent_td_39_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](40, 14);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](41, DashboardRightComponent_th_41_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](42, DashboardRightComponent_td_42_Template, 2, 1, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](43, 15);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](44, DashboardRightComponent_th_44_Template, 2, 0, "th", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](45, DashboardRightComponent_td_45_Template, 2, 2, "td", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](46, DashboardRightComponent_tr_46_Template, 1, 0, "tr", 16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](47, DashboardRightComponent_tr_47_Template, 1, 0, "tr", 17);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](48, DashboardRightComponent_tr_48_Template, 3, 1, "tr", 18);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](49, "mat-paginator", 19);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" Project: ", ctx.script, "");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind2"](8, 7, ctx.date, "shortDate"), " scenes:");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx.selected);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](20);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("dataSource", ctx.dataSource);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matHeaderRowDef", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matRowDefColumns", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("pageSizeOptions", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpureFunction0"](10, _c0));
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_9__["NgForOf"], _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__["MatFormField"], _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__["MatLabel"], _angular_material_input__WEBPACK_IMPORTED_MODULE_11__["MatInput"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatTable"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSort"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatColumnDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRowDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRowDef"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__["MatPaginator"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCell"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSortHeader"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCell"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRow"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRow"]],
      pipes: [_angular_common__WEBPACK_IMPORTED_MODULE_9__["DatePipe"]],
      styles: ["li[_ngcontent-%COMP%]{\n    list-style-type: none;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhc2hib2FyZC1yaWdodC9kYXNoYm9hcmQtcmlnaHQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtJQUNJLHFCQUFxQjtBQUN6QiIsImZpbGUiOiJkYXNoYm9hcmQtcmlnaHQvZGFzaGJvYXJkLXJpZ2h0LmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJsaXtcbiAgICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG59Il19 */"]
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
          type: _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_5__["AngularFirestore"]
        }, {
          type: _upload_service__WEBPACK_IMPORTED_MODULE_6__["UploadService"]
        }, {
          type: _angular_router__WEBPACK_IMPORTED_MODULE_7__["Router"]
        }, {
          type: _angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__["MatDialog"]
        }, {
          type: _angular_common__WEBPACK_IMPORTED_MODULE_9__["DatePipe"]
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


    var _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
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
      decls: 3,
      vars: 0,
      consts: [[1, "main"], [1, "button-container"]],
      template: function DashboardComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "app-dashboard-right");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_3__["DashboardRightComponent"]],
      styles: [".main[_ngcontent-%COMP%]{\n    display:grid;\n    height:100vh;\n    grid-template-columns: 3fr 1fr;\n   \n    grid-template-rows: 300px;\n    text-align: center;\n    border:5px solid black;\n    color:#c2185a;\n    background: #dfdfdf;\n    text-shadow:1px 1px black;\n    overflow:auto;\n}\n.button-container[_ngcontent-%COMP%] {\n    background-color: #dfdfdf;\n    padding: 10% 10% 0% 10%\n     \n}\n.success[_ngcontent-%COMP%]{\n    background-color:#1f601f;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhc2hib2FyZC9kYXNoYm9hcmQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7SUFDSSxZQUFZO0lBQ1osWUFBWTtJQUNaLDhCQUE4Qjs7SUFFOUIseUJBQXlCO0lBQ3pCLGtCQUFrQjtJQUNsQixzQkFBc0I7SUFDdEIsYUFBYTtJQUNiLG1CQUFtQjtJQUNuQix5QkFBeUI7SUFDekIsYUFBYTtBQUNqQjtBQUNBO0lBQ0kseUJBQXlCO0lBQ3pCOztBQUVKO0FBQ0E7SUFDSSx3QkFBd0I7QUFDNUIiLCJmaWxlIjoiZGFzaGJvYXJkL2Rhc2hib2FyZC5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ubWFpbntcbiAgICBkaXNwbGF5OmdyaWQ7XG4gICAgaGVpZ2h0OjEwMHZoO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogM2ZyIDFmcjtcbiAgIFxuICAgIGdyaWQtdGVtcGxhdGUtcm93czogMzAwcHg7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIGJvcmRlcjo1cHggc29saWQgYmxhY2s7XG4gICAgY29sb3I6I2MyMTg1YTtcbiAgICBiYWNrZ3JvdW5kOiAjZGZkZmRmO1xuICAgIHRleHQtc2hhZG93OjFweCAxcHggYmxhY2s7XG4gICAgb3ZlcmZsb3c6YXV0bztcbn1cbi5idXR0b24tY29udGFpbmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGZkZmRmO1xuICAgIHBhZGRpbmc6IDEwJSAxMCUgMCUgMTAlXG4gICAgIFxufVxuLnN1Y2Nlc3N7XG4gICAgYmFja2dyb3VuZC1jb2xvcjojMWY2MDFmO1xufVxuIl19 */"]
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
  "./src/app/dual-dialog/dual-dialog.component.ts":
  /*!******************************************************!*\
    !*** ./src/app/dual-dialog/dual-dialog.component.ts ***!
    \******************************************************/

  /*! exports provided: DualDialogComponent */

  /***/
  function srcAppDualDialogDualDialogComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "DualDialogComponent", function () {
      return DualDialogComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var DualDialogComponent = /*#__PURE__*/function () {
      function DualDialogComponent() {
        _classCallCheck(this, DualDialogComponent);
      }

      _createClass(DualDialogComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }]);

      return DualDialogComponent;
    }();

    DualDialogComponent.ɵfac = function DualDialogComponent_Factory(t) {
      return new (t || DualDialogComponent)();
    };

    DualDialogComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DualDialogComponent,
      selectors: [["app-dual-dialog"]],
      decls: 2,
      vars: 0,
      template: function DualDialogComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "p");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, "dual-dialog works!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJkdWFsLWRpYWxvZy9kdWFsLWRpYWxvZy5jb21wb25lbnQuY3NzIn0= */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](DualDialogComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-dual-dialog',
          templateUrl: './dual-dialog.component.html',
          styleUrls: ['./dual-dialog.component.css']
        }]
      }], function () {
        return [];
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
    /* harmony import */


    var _angular_forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! @angular/forms */
    "./node_modules/@angular/forms/__ivy_ngcc__/fesm2015/forms.js");

    var _c0 = ["callSheet"];

    function IssueComponent_h1_3_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"]("you picked ", ctx_r0.selected, "");
      }
    }

    function IssueComponent_div_4_Template(rf, ctx) {
      if (rf & 1) {
        var _r5 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 5);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 6);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "div", 7);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "button", 8);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_div_4_Template_button_click_3_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r5);

          var ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r4.selectOption($event.target.id);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Standard");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "div", 6);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "div", 9);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "button", 10);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_div_4_Template_button_click_7_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r5);

          var ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r6.selectOption($event.target.id);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, " Landscape");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_5_Template(rf, ctx) {
      if (rf & 1) {
        var _r9 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 11);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Add a call sheet?");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "form", 12, 13);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "input", 14);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("change", function IssueComponent_div_5_Template_input_change_5_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r9);

          var ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r8.handleFileInput($event.target.files);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_6_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "iframe", 15);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpropertyInterpolate"]("src", ctx_r3.file, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵsanitizeResourceUrl"]);
      }
    }

    var IssueComponent = /*#__PURE__*/function () {
      function IssueComponent(upload, dialogRef, cdr, data) {
        _classCallCheck(this, IssueComponent);

        this.upload = upload;
        this.dialogRef = dialogRef;
        this.cdr = cdr;
        this.data = data;
        this.dualReady = false;
        this.dualEdit = false;
        this.pdfIssues = false;
        this.docUploaded = false; // modalReady: boolean = false

        this.selectionMade = false;
      }

      _createClass(IssueComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }, {
        key: "ngAfterViewInit",
        value: function ngAfterViewInit() {
          // figure out why the filter is not matching the sceneIndex - this should be easy
          // this.toggleDual()
          this.cdr.detectChanges(); // this.getProblems()
          //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
          //Add 'implements AfterViewInit' to the class.
        }
      }, {
        key: "addCallSheet",
        value: function addCallSheet() {
          console.log(this.selected, this.callsheet);
          this.dialogRef.close({
            selected: this.selected,
            callsheet: this.file
          });
        }
      }, {
        key: "handleFileInput",
        value: function handleFileInput(file) {
          var _this6 = this;

          this.file = file[0];
          console.log(this.file);
          this.docUploaded = true;
          console.log(this.docUploaded);
          this.upload.postCallSheet(this.file).subscribe(function (data) {
            console.log(data);
            _this6.callsheet = _this6.file;
          });
        }
      }, {
        key: "selectOption",
        value: function selectOption(option) {
          this.selectionMade = true;
          this.selected = option;
        }
      }]);

      return IssueComponent;
    }();

    IssueComponent.ɵfac = function IssueComponent_Factory(t) {
      return new (t || IssueComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_2__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MatDialogRef"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ChangeDetectorRef"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MAT_DIALOG_DATA"]));
    };

    IssueComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: IssueComponent,
      selectors: [["app-issue"]],
      viewQuery: function IssueComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](_c0, true);
        }

        if (rf & 2) {
          var _t;

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.el = _t.first);
        }
      },
      decls: 11,
      vars: 4,
      consts: [[1, "modal"], [4, "ngIf"], ["class", "selections-container", 4, "ngIf"], ["class", "", 4, "ngIf"], [1, "close-button", 3, "click"], [1, "selections-container"], [1, "button-wrapper"], [1, "icon", 2, "background-image", "url(../../assets/vert.png)"], ["id", "standard", 1, "layout-button", 3, "click"], [1, "icon", 2, "background-image", "url(../../assets/horiz.png)"], ["id", "landscape", 1, "layout-button", 3, "click"], [1, ""], ["name", "callSheet", "id", "callSheet"], ["callSheet", ""], ["enctype", "multipart/form-data", "type", "file", 3, "change"], [3, "src"]],
      template: function IssueComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Select a layout");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, IssueComponent_h1_3_Template, 2, 1, "h1", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, IssueComponent_div_4_Template, 9, 0, "div", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](5, IssueComponent_div_5_Template, 6, 0, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, IssueComponent_div_6_Template, 2, 1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "button", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_Template_button_click_7_listener() {
            return ctx.addCallSheet();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, "Get my sides!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "button", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_Template_button_click_9_listener() {
            return ctx.dialogRef.close({
              selected: ctx.selected
            });
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](10, "Nah, just get my sides");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.selectionMade);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx.selectionMade);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.selectionMade);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.docUploaded);
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["NgIf"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["ɵangular_packages_forms_forms_y"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["NgControlStatusGroup"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["NgForm"]],
      styles: [".modal[_ngcontent-%COMP%]{\n  justify-content: center;\n  display: grid;\n  background-color: #dfdfdf;\n}\n.selections-container[_ngcontent-%COMP%]{\n    display:grid;\n    grid-template-columns: 1fr 1fr;\n   \n    justify-items:center;\n}\n.button-wrapper[_ngcontent-%COMP%]{\n  border:2px solid green;\n  padding:10px;\n\n}\n.icon[_ngcontent-%COMP%]{\n  max-height: 300px;\n  max-width: 300px;\n  height: 200px;\n  width: 250px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n  \n}\n.layout-button[_ngcontent-%COMP%]{\n  \n\n  padding:5%\n}\n.layout-button[_ngcontent-%COMP%]:hover{\n  -webkit-filter: hue-rotate(180deg);\n          filter: hue-rotate(180deg); \n}\n.close-button[_ngcontent-%COMP%]{\n  margin: 0 auto;\n  padding:2%;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlzc3VlL2lzc3VlLmNvbXBvbmVudC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSx1QkFBdUI7RUFDdkIsYUFBYTtFQUNiLHlCQUF5QjtBQUMzQjtBQUNBO0lBQ0ksWUFBWTtJQUNaLDhCQUE4Qjs7SUFFOUIsb0JBQW9CO0FBQ3hCO0FBQ0E7RUFDRSxzQkFBc0I7RUFDdEIsWUFBWTs7QUFFZDtBQUVBO0VBQ0UsaUJBQWlCO0VBQ2pCLGdCQUFnQjtFQUNoQixhQUFhO0VBQ2IsWUFBWTtFQUNaLHdCQUF3QjtFQUN4Qiw0QkFBNEI7RUFDNUIsMkJBQTJCOztBQUU3QjtBQUNBOzs7RUFHRTtBQUNGO0FBQ0E7RUFDRSxrQ0FBMEI7VUFBMUIsMEJBQTBCO0FBQzVCO0FBQ0E7RUFDRSxjQUFjO0VBQ2QsVUFBVTtBQUNaIiwiZmlsZSI6Imlzc3VlL2lzc3VlLmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyIubW9kYWx7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBkaXNwbGF5OiBncmlkO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZGZkZmRmO1xufVxuLnNlbGVjdGlvbnMtY29udGFpbmVye1xuICAgIGRpc3BsYXk6Z3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7XG4gICBcbiAgICBqdXN0aWZ5LWl0ZW1zOmNlbnRlcjtcbn1cbi5idXR0b24td3JhcHBlcntcbiAgYm9yZGVyOjJweCBzb2xpZCBncmVlbjtcbiAgcGFkZGluZzoxMHB4O1xuXG59XG5cbi5pY29ue1xuICBtYXgtaGVpZ2h0OiAzMDBweDtcbiAgbWF4LXdpZHRoOiAzMDBweDtcbiAgaGVpZ2h0OiAyMDBweDtcbiAgd2lkdGg6IDI1MHB4O1xuICBiYWNrZ3JvdW5kLXNpemU6IGNvbnRhaW47XG4gIGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7XG4gIGJhY2tncm91bmQtcG9zaXRpb246IGNlbnRlcjtcbiAgXG59XG4ubGF5b3V0LWJ1dHRvbntcbiAgXG5cbiAgcGFkZGluZzo1JVxufVxuLmxheW91dC1idXR0b246aG92ZXJ7XG4gIGZpbHRlcjogaHVlLXJvdGF0ZSgxODBkZWcpOyBcbn1cbi5jbG9zZS1idXR0b257XG4gIG1hcmdpbjogMCBhdXRvO1xuICBwYWRkaW5nOjIlO1xufSJdfQ== */"]
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
          type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ChangeDetectorRef"]
        }, {
          type: undefined,
          decorators: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Inject"],
            args: [_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__["MAT_DIALOG_DATA"]]
          }]
        }];
      }, {
        el: [{
          type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["ViewChild"],
          args: ['callSheet']
        }]
      });
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

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](20, "Welcome to SideWays - Robo powered production");

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
      styles: [".sidenav-container[_ngcontent-%COMP%] {\n  height: 100%;\n}\n\n.sidenav[_ngcontent-%COMP%] {\n  width: 200px;\n}\n\n.sidenav[_ngcontent-%COMP%]   .mat-toolbar[_ngcontent-%COMP%] {\n  background: inherit;\n}\n\n.mat-toolbar.mat-primary[_ngcontent-%COMP%] {\n  position: -webkit-sticky;\n  position: sticky;\n  top: 0;\n  z-index: 1;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5hdi9uYXYuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLFlBQVk7QUFDZDs7QUFFQTtFQUNFLFlBQVk7QUFDZDs7QUFFQTtFQUNFLG1CQUFtQjtBQUNyQjs7QUFFQTtFQUNFLHdCQUFnQjtFQUFoQixnQkFBZ0I7RUFDaEIsTUFBTTtFQUNOLFVBQVU7QUFDWiIsImZpbGUiOiJuYXYvbmF2LmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuc2lkZW5hdi1jb250YWluZXIge1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbi5zaWRlbmF2IHtcbiAgd2lkdGg6IDIwMHB4O1xufVxuXG4uc2lkZW5hdiAubWF0LXRvb2xiYXIge1xuICBiYWNrZ3JvdW5kOiBpbmhlcml0O1xufVxuXG4ubWF0LXRvb2xiYXIubWF0LXByaW1hcnkge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICB0b3A6IDA7XG4gIHotaW5kZXg6IDE7XG59XG4iXX0= */"]
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
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJuYXZiYXIvbmF2YmFyLmNvbXBvbmVudC5jc3MifQ== */"]
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
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzY3JpcHQvc2NyaXB0LmNvbXBvbmVudC5jc3MifQ== */"]
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
      // url:string = "http://localhost:8080"
      function UploadService(httpClient) {
        _classCallCheck(this, UploadService);

        this.httpClient = httpClient;
        this.httpOptions = {
          headers: null,
          params: null,
          responseType: null
        };
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
        key: "makeJSON",
        value: function makeJSON(data) {
          console.log("firing make json from service");
          return this.httpClient.post(this.url + '/download', data);
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
          console.log(fileToUpload);
          var formData = new FormData();
          formData.append('script', fileToUpload, fileToUpload.name);
          console.log(formData);
          return this.httpClient.post(this.url + "/api", formData, this.httpOptions).pipe(Object(rxjs_operators__WEBPACK_IMPORTED_MODULE_1__["map"])(function (data) {
            return data;
          }));
        }
      }, {
        key: "generatePdf",
        value: function generatePdf(sceneArr, name, layout) {
          sceneArr.push(name);
          var title = sceneArr[sceneArr.length - 1];
          sceneArr.pop();
          sceneArr.unshift(title);
          sceneArr[sceneArr.length - 1].push(this.pagesArr[this.pagesArr.length - 1].page);
          sceneArr.push(layout);
          console.log("calling generatePDF");
          console.log(sceneArr[sceneArr.length - 1]);
          return this.httpClient.post(this.url + "/pdf", sceneArr);
        }
      }, {
        key: "postCallSheet",
        value: function postCallSheet(fileToUpload) {
          this.resetHttpOptions();
          console.log(fileToUpload.name);
          var formData = new FormData();
          this.coverSheet = fileToUpload;
          formData.append('callSheet', fileToUpload, fileToUpload.name);
          return this.httpClient.post(this.url + "/callsheet", formData, this.httpOptions);
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


    var _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
    /*! @angular/fire/firestore */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire-firestore.js");
    /* harmony import */


    var _upload_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
    /*! ../upload.service */
    "./src/app/upload.service.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");

    var UploadComponent = /*#__PURE__*/function () {
      function UploadComponent(db, upload, router) {
        var _this7 = this;

        _classCallCheck(this, UploadComponent);

        this.db = db;
        this.upload = upload;
        this.router = router;
        this.db = db;
        this.funData = db.collection('funData').doc('totalLines').valueChanges();
        this.totalLines;
        this.funData.subscribe(function (doc) {
          _this7.totalLines = doc.total, _this7.totalCharacters = doc.characters;
          _this7.totalScenes = doc.scenes;
        });
      }

      _createClass(UploadComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }, {
        key: "ngOnDestroy",
        value: function ngOnDestroy() {
          //Called once, before the instance is destroyed.
          //Add 'implements OnDestroy' to the class.
          this.dataSubscription.unsubscribe();
        }
      }, {
        key: "addTwo",
        value: function addTwo(arr) {
          var missingTwo = arr.findIndex(function (ind) {
            return ind.text === '2.' && ind.category == "page-number-hidden";
          });
          return missingTwo;
        }
      }, {
        key: "handleFileInput",
        value: function handleFileInput(files) {
          var _this8 = this;

          this.fileToUpload = files.item(0);
          localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ""));
          this.$script_data = this.upload.postFile(this.fileToUpload);
          this.dataSubscription = this.$script_data.subscribe(function (data) {
            console.log(data);
            _this8.lines = data[0];

            if (_this8.addTwo(data[0]).category) {
              var two = _this8.addTwo(data[0]);

              data[0][two].category = "page-number";
            }

            _this8.upload.lineArr = data[0];

            var x = _this8.upload.lineArr.filter(function (line) {
              return line.category == "scene-header";
            });

            console.log(_this8.upload.lineArr);
            _this8.upload.pagesArr = data[1];
            _this8.upload.lineCount = data[2].map(function (line) {
              return line.totalLines;
            });

            _this8.router.navigate(["download"]);
          });
        }
      }]);

      return UploadComponent;
    }();

    UploadComponent.ɵfac = function UploadComponent_Factory(t) {
      return new (t || UploadComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_fire_firestore__WEBPACK_IMPORTED_MODULE_1__["AngularFirestore"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_2__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_3__["Router"]));
    };

    UploadComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: UploadComponent,
      selectors: [["app-upload"]],
      decls: 60,
      vars: 0,
      consts: [[1, "form-group", "center"], [1, "three-column", "center"], ["href", "https://www.heroku.com/policy/security", 2, "color", "red"], [1, "warning-box"], [1, "center"], ["for", "file"], ["name", "script", "enctype", "multipart/form-data", "type", "file", "id", "script", 3, "change"], ["href", "mailto:sidewaystesters@gmail.com", 2, "color", "red"]],
      template: function UploadComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, "Welcome to SideWays");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "ul");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7, "We're bringing the efficency of modern AI to film production.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](10, " AD's and PA's spend thousands of hours every year lining out sides to hand out on set.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "li");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](12, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](13, " Thats a lot of time that could be spent on other things.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](14, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, "Safe. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](17, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](18, " We dont save your script. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](19, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](20, "Your IP is protected. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](21, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](22, "Simple. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](23, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](24, "We make sides and get better at making sides. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](25, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](26, " No subscriptions. No Logins. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](27, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](28, " Just sides. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](29, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](30, "Secure. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](31, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](32, " We're backed by ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](33, "a", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](34, "Heroku. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](35, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](36, "The web's most trusted cloud infrastructure");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](37, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](38, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](39, "DAKOTA!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](40, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](41, "First off thanks for helping us out. Hopefully with you input we can refine this bad boy more and get it to the market");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](42, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](43, " The only thing we ask is that the file not have a watermark and have proper formatting and we should be good to go");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](44, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](45, "thanks brother!");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](46, "div", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](47, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](48, "Upload your script here and we'll prep your sides");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](49, "label", 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](50, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](51, "input", 6);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("change", function UploadComponent_Template_input_change_51_listener($event) {
            return ctx.handleFileInput($event.target.files);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](52, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](53, "h2");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](54, "SideWays");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](55, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](56, "Thanks for helping us learn and grow! Please email and issues or problems with your script - or any ideas at all actually - to ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](57, "a", 7);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](58, "sideWaysHelp@gmail.com");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](59, "div");
        }
      },
      styles: [".body[_ngcontent-%COMP%]{margin-left: 10%; margin-right: 10%; top:2%; bottom: 2%}\nh3[_ngcontent-%COMP%]{\n    font:45px;\n\n}\nh4[_ngcontent-%COMP%]{\n    font:36px;\n}\n.three-column[_ngcontent-%COMP%]{\n    display:grid;\n    grid-template-columns:1fr 1fr 1fr ;\n    padding:2% 5%;\n    border-bottom:2px solid white;\n}\n.center[_ngcontent-%COMP%]{\n    text-align: center;\n}\n.warning-box[_ngcontent-%COMP%]{\n    background-color: #c2185a;\n\n    text-align: center;\n    margin: 0 auto;\n}\n.sceneheader[_ngcontent-%COMP%], .character[_ngcontent-%COMP%] { padding-top: 1.5ex; }\n.version[_ngcontent-%COMP%] { display: none;}\n.description[_ngcontent-%COMP%] { padding-right: 10%; }\n.character[_ngcontent-%COMP%] { margin-left: 20%; text-align: center; margin-right: 20%; padding-top:15px}\n.dialog[_ngcontent-%COMP%], .short-dialog[_ngcontent-%COMP%] { margin-left: 20%;  }\n.short-dialog[_ngcontent-%COMP%]{ padding-bottom:10px}\n.parenthetical[_ngcontent-%COMP%] { margin-left: 20%; }\n\n.dialogue[_ngcontent-%COMP%]    + .parenthetical[_ngcontent-%COMP%] { padding-bottom: 0; }\n.transition[_ngcontent-%COMP%] { padding-top: 3ex; margin-left: 65%; padding-bottom: 1.5ex; }\n.scene-header[_ngcontent-%COMP%]{ font-weight:900; padding-top: 20px; padding-bottom:20px}\n.shot[_ngcontent-%COMP%]{ text-align: right; font-weight: 900;}\n.hidden[_ngcontent-%COMP%]{display:none}\nli[_ngcontent-%COMP%] { font: 12px Courier, fixed; list-style-type: none; line-height: normal; }\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVwbG9hZC91cGxvYWQuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxVQUFVO0FBQzdEO0lBQ0ksU0FBUzs7QUFFYjtBQUNBO0lBQ0ksU0FBUztBQUNiO0FBQ0E7SUFDSSxZQUFZO0lBQ1osa0NBQWtDO0lBQ2xDLGFBQWE7SUFDYiw2QkFBNkI7QUFDakM7QUFDQTtJQUNJLGtCQUFrQjtBQUN0QjtBQUNBO0lBQ0kseUJBQXlCOztJQUV6QixrQkFBa0I7SUFDbEIsY0FBYztBQUNsQjtBQUNBLDJCQUEyQixrQkFBa0IsRUFBRTtBQUMvQyxXQUFXLGFBQWEsQ0FBQztBQUN6QixlQUFlLGtCQUFrQixFQUFFO0FBRW5DLGFBQWEsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCO0FBRXRGLHlCQUF5QixnQkFBZ0IsR0FBRztBQUM1QyxlQUFlLG1CQUFtQjtBQUNsQyxpQkFBaUIsZ0JBQWdCLEVBQUU7QUFFbkMsOEZBQThGO0FBRTlGLDZCQUE2QixpQkFBaUIsRUFBRTtBQUVoRCxjQUFjLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFO0FBQ3pFLGVBQWUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQjtBQUN0RSxPQUFPLGlCQUFpQixFQUFFLGdCQUFnQixDQUFDO0FBQzNDLFFBQVEsWUFBWTtBQUNwQixLQUFLLHlCQUF5QixFQUFFLHFCQUFxQixFQUFFLG1CQUFtQixFQUFFIiwiZmlsZSI6InVwbG9hZC91cGxvYWQuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIi5ib2R5e21hcmdpbi1sZWZ0OiAxMCU7IG1hcmdpbi1yaWdodDogMTAlOyB0b3A6MiU7IGJvdHRvbTogMiV9XG5oM3tcbiAgICBmb250OjQ1cHg7XG5cbn1cbmg0e1xuICAgIGZvbnQ6MzZweDtcbn1cbi50aHJlZS1jb2x1bW57XG4gICAgZGlzcGxheTpncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczoxZnIgMWZyIDFmciA7XG4gICAgcGFkZGluZzoyJSA1JTtcbiAgICBib3JkZXItYm90dG9tOjJweCBzb2xpZCB3aGl0ZTtcbn1cbi5jZW50ZXJ7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuLndhcm5pbmctYm94e1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNjMjE4NWE7XG5cbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgbWFyZ2luOiAwIGF1dG87XG59XG4uc2NlbmVoZWFkZXIsIC5jaGFyYWN0ZXIgeyBwYWRkaW5nLXRvcDogMS41ZXg7IH1cbi52ZXJzaW9uIHsgZGlzcGxheTogbm9uZTt9XG4uZGVzY3JpcHRpb24geyBwYWRkaW5nLXJpZ2h0OiAxMCU7IH1cblxuLmNoYXJhY3RlciB7IG1hcmdpbi1sZWZ0OiAyMCU7IHRleHQtYWxpZ246IGNlbnRlcjsgbWFyZ2luLXJpZ2h0OiAyMCU7IHBhZGRpbmctdG9wOjE1cHh9XG5cbi5kaWFsb2csIC5zaG9ydC1kaWFsb2cgeyBtYXJnaW4tbGVmdDogMjAlOyAgfVxuLnNob3J0LWRpYWxvZ3sgcGFkZGluZy1ib3R0b206MTBweH1cbi5wYXJlbnRoZXRpY2FsIHsgbWFyZ2luLWxlZnQ6IDIwJTsgfVxuXG4vKiBzcGVjaWFsIGNhc2U6IGRpYWxvZ3VlIGZvbGxvd2VkIGJ5IGEgcGFyZW50aGV0aWNhbDsgdGhlIGV4dHJhIGxpbmUgbmVlZHMgdG8gYmUgc3VwcHJlc3NlZCAqL1xuXG4uZGlhbG9ndWUgKyAucGFyZW50aGV0aWNhbCB7IHBhZGRpbmctYm90dG9tOiAwOyB9XG5cbi50cmFuc2l0aW9uIHsgcGFkZGluZy10b3A6IDNleDsgbWFyZ2luLWxlZnQ6IDY1JTsgcGFkZGluZy1ib3R0b206IDEuNWV4OyB9XG4uc2NlbmUtaGVhZGVyeyBmb250LXdlaWdodDo5MDA7IHBhZGRpbmctdG9wOiAyMHB4OyBwYWRkaW5nLWJvdHRvbToyMHB4fVxuLnNob3R7IHRleHQtYWxpZ246IHJpZ2h0OyBmb250LXdlaWdodDogOTAwO31cbi5oaWRkZW57ZGlzcGxheTpub25lfVxubGkgeyBmb250OiAxMnB4IENvdXJpZXIsIGZpeGVkOyBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7IGxpbmUtaGVpZ2h0OiBub3JtYWw7IH0iXX0= */"]
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
          type: _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_1__["AngularFirestore"]
        }, {
          type: _upload_service__WEBPACK_IMPORTED_MODULE_2__["UploadService"]
        }, {
          type: _angular_router__WEBPACK_IMPORTED_MODULE_3__["Router"]
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
      production: false,
      firebaseConfig: {
        apiKey: "AIzaSyBXD5kQfAS4lrmSJxYAuEUq8sxvXgWmCio",
        authDomain: "scriptthing.firebaseapp.com",
        databaseURL: "https://scriptthing.firebaseio.com",
        projectId: "scriptthing",
        storageBucket: "scriptthing.appspot.com",
        messagingSenderId: "195325163986",
        appId: "1:195325163986:web:e7a70646f087850353300b",
        measurementId: "G-XM3P84P6N7"
      }
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
    /*! /Users/timmckiernan/Desktop/sideWays-angular-app/src/main.ts */
    "./src/main.ts");
    /***/
  }
}, [[0, "runtime", "vendor"]]]);
//# sourceMappingURL=main-es5.js.map