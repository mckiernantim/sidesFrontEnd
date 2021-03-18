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
      decls: 2,
      vars: 0,
      consts: [[1, "app"]],
      template: function AppComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "app-nav");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_nav_nav_component__WEBPACK_IMPORTED_MODULE_1__["NavComponent"]],
      styles: [".selections-container[_ngcontent-%COMP%]{\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n\n}\n.layout-button[_ngcontent-%COMP%]{\n    max-width:200px;\n    \n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvYXBwLmNvbXBvbmVudC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7SUFDSSxhQUFhO0lBQ2IsOEJBQThCOztBQUVsQztBQUNBO0lBQ0ksZUFBZTs7QUFFbkIiLCJmaWxlIjoic3JjL2FwcC9hcHAuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIi5zZWxlY3Rpb25zLWNvbnRhaW5lcntcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmcjtcblxufVxuLmxheW91dC1idXR0b257XG4gICAgbWF4LXdpZHRoOjIwMHB4O1xuICAgIFxufSJdfQ== */"]
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


    var _angular_material_card__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(
    /*! @angular/material/card */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/card.js");
    /* harmony import */


    var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(
    /*! @angular/material/progress-spinner */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/progress-spinner.js");
    /* harmony import */


    var _angular_fire__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(
    /*! @angular/fire */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire.js");
    /* harmony import */


    var _environments_environment__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(
    /*! ../environments/environment */
    "./src/environments/environment.ts");
    /* harmony import */


    var _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(
    /*! @angular/fire/firestore */
    "./node_modules/@angular/fire/__ivy_ngcc__/fesm2015/angular-fire-firestore.js");
    /* harmony import */


    var _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(
    /*! ./dual-dialog/dual-dialog.component */
    "./src/app/dual-dialog/dual-dialog.component.ts");
    /* harmony import */


    var _footer_footer_component__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(
    /*! ./footer/footer.component */
    "./src/app/footer/footer.component.ts"); // material stuff
    // Firebase


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
      imports: [[_angular_fire__WEBPACK_IMPORTED_MODULE_29__["AngularFireModule"].initializeApp(_environments_environment__WEBPACK_IMPORTED_MODULE_30__["environment"].firebaseConfig, 'sideWays'), _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_31__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_material_card__WEBPACK_IMPORTED_MODULE_27__["MatCardModule"], _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_28__["MatProgressSpinnerModule"]]]
    });

    (function () {
      (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵsetNgModuleScope"](AppModule, {
        declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_7__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_8__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_9__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_11__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_19__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_24__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_25__["IssueComponent"], _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_32__["DualDialogComponent"], _footer_footer_component__WEBPACK_IMPORTED_MODULE_33__["FooterComponent"]],
        imports: [_angular_fire__WEBPACK_IMPORTED_MODULE_29__["AngularFireModule"], _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_31__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_material_card__WEBPACK_IMPORTED_MODULE_27__["MatCardModule"], _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_28__["MatProgressSpinnerModule"]]
      });
    })();
    /*@__PURE__*/


    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](AppModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"],
        args: [{
          declarations: [_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"], _upload_upload_component__WEBPACK_IMPORTED_MODULE_6__["UploadComponent"], _dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_7__["DashboardRightComponent"], _dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_8__["DashboardComponent"], _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_9__["NavbarComponent"], _nav_nav_component__WEBPACK_IMPORTED_MODULE_11__["NavComponent"], _script_script_component__WEBPACK_IMPORTED_MODULE_19__["ScriptComponent"], _complete_complete_component__WEBPACK_IMPORTED_MODULE_24__["CompleteComponent"], _issue_issue_component__WEBPACK_IMPORTED_MODULE_25__["IssueComponent"], _dual_dialog_dual_dialog_component__WEBPACK_IMPORTED_MODULE_32__["DualDialogComponent"], _footer_footer_component__WEBPACK_IMPORTED_MODULE_33__["FooterComponent"]],
          imports: [_angular_fire__WEBPACK_IMPORTED_MODULE_29__["AngularFireModule"].initializeApp(_environments_environment__WEBPACK_IMPORTED_MODULE_30__["environment"].firebaseConfig, 'sideWays'), _angular_fire_firestore__WEBPACK_IMPORTED_MODULE_31__["AngularFirestoreModule"], _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"], _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"], _angular_common_http__WEBPACK_IMPORTED_MODULE_0__["HttpClientModule"], _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_10__["BrowserAnimationsModule"], _angular_cdk_layout__WEBPACK_IMPORTED_MODULE_12__["LayoutModule"], _angular_forms__WEBPACK_IMPORTED_MODULE_23__["FormsModule"], _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_13__["MatToolbarModule"], _angular_material_button__WEBPACK_IMPORTED_MODULE_14__["MatButtonModule"], _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_15__["MatSidenavModule"], _angular_material_icon__WEBPACK_IMPORTED_MODULE_16__["MatIconModule"], _angular_material_list__WEBPACK_IMPORTED_MODULE_17__["MatListModule"], _angular_material_input__WEBPACK_IMPORTED_MODULE_18__["MatInputModule"], _angular_material_table__WEBPACK_IMPORTED_MODULE_20__["MatTableModule"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_21__["MatPaginatorModule"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_22__["MatSortModule"], _angular_material_dialog__WEBPACK_IMPORTED_MODULE_26__["MatDialogModule"], _angular_material_card__WEBPACK_IMPORTED_MODULE_27__["MatCardModule"], _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_28__["MatProgressSpinnerModule"]],
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

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, " What browser you used and version you used. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](17, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](18, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](19, " Thanks so much for your help as we move forward. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](20, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](21, " and if you go the time ");

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


    var _line_out_service__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
    /*! ./../line-out.service */
    "./src/app/line-out.service.ts");
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(
    /*! @angular/material/form-field */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/form-field.js");
    /* harmony import */


    var _angular_material_input__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(
    /*! @angular/material/input */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/input.js");

    function DashboardRightComponent_th_17_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Scene Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_18_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r16 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r16.sceneNumber, " ");
      }
    }

    function DashboardRightComponent_th_20_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Page Number ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_21_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r18 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r18.pageNumber, " ");
      }
    }

    function DashboardRightComponent_th_23_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Title ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_24_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r20 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r20.text, " ");
      }
    }

    function DashboardRightComponent_th_26_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Text ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_27_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r21 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", scene_r21.preview, " ");
      }
    }

    function DashboardRightComponent_th_29_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "th", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " Select ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }
    }

    function DashboardRightComponent_td_30_Template(rf, ctx) {
      if (rf & 1) {
        var _r25 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "td", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "input", 25);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("change", function DashboardRightComponent_td_30_Template_input_change_1_listener($event) {
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

        var ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpropertyInterpolate"]("name", i_r23 + 1);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("disabled", ctx_r10.active === false ? "disabled" : null);
      }
    }

    function DashboardRightComponent_tr_31_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 26);
      }
    }

    function DashboardRightComponent_tr_32_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "tr", 27);
      }
    }

    function DashboardRightComponent_tr_33_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "tr", 28);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "td", 29);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        var _r0 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵreference"](13);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("No data matching the filter \"", _r0.value, "\"");
      }
    }

    function DashboardRightComponent_li_42_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "li");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "pre");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var scene_r27 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate3"]("", scene_r27.sceneNumber, "     ", scene_r27.text, "     ", scene_r27.sceneNumber, "");
      }
    }

    function DashboardRightComponent_div_49_div_5_div_3_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 34);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "h2");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "Breaks for doc");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var data_r31 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"](" ", data_r31.key, " : ", data_r31.value, " ");
      }
    }

    function DashboardRightComponent_div_49_div_5_div_5_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 34);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "h2");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "data for pages");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var data_r32 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"](" ", data_r32.key, " : ", data_r32.value, " ");
      }
    }

    function DashboardRightComponent_div_49_div_5_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 32);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "Final doc here");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](3, DashboardRightComponent_div_49_div_5_div_3_Template, 4, 2, "div", 33);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](4, "keyvalue");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DashboardRightComponent_div_49_div_5_div_5_Template, 4, 2, "div", 33);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](6, "keyvalue");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r28 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](4, 2, ctx_r28.finalDocument.breaks));

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](6, 4, ctx_r28.finalDocument.doc));
      }
    }

    function DashboardRightComponent_div_49_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 30);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, " stats for nerds ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](2, "br");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](4, "br");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DashboardRightComponent_div_49_div_5_Template, 7, 6, "div", 31);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r15 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" Length: ", ctx_r15.totalPages.length, " ");

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r15.finalDocReady);
      }
    }

    var _c0 = function _c0() {
      return [5, 10, 25, 100];
    };

    var DashboardRightComponent = /*#__PURE__*/function () {
      function DashboardRightComponent(db, upload, router, dialog, lineOut, datePipe) {
        _classCallCheck(this, DashboardRightComponent);

        this.db = db;
        this.upload = upload;
        this.router = router;
        this.dialog = dialog;
        this.lineOut = lineOut;
        this.datePipe = datePipe;
        this.displayedColumns = ['number', "page number", 'text', "preview", "select"];
        this.dataReady = false;
        this.initialSelection = [];
        this.active = true;
        this.waitingForScript = false;
        this.finalDocReady = false;
        this.script = localStorage.getItem("name");
        this.db = db;
        this.problemsData = db.collection('problemLines').valueChanges();
        this.linesCrawled = db.collection('funData').doc('totalLines').valueChanges();
        this.funData = db.collection('funData');
        this.totalLines;
        this.scriptLength; // this.funData.doc('totalLines').valueChanges().subscribe(
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

          this.finalDocument = {
            doc: {},
            breaks: {}
          };
          this.waitingForScript = false;
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

          if (this.scriptData) {
            this.characters = this.scriptData.filter(function (line) {
              return line.category === "character";
            });
            this.characters = _toConsumableArray(new Set(this.characters.map(function (line) {
              return line.text.replace(/\s/g, '');
            })));
          }

          console.log(this.upload.lineArr);

          if (this.totalPages && this.scriptData) {
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
            } // this.dataReady=true;


            console.log(this.scenes);
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          }

          var probsArr = []; // here is our issue !&@#!*@#&!#&!*&

          this.scriptProblems.forEach(function (line) {
            var ind = line.index;
            var scene = _this.scriptData[ind].sceneIndex;

            var problem = _this.scenes.map(function (scene) {
              return scene.sceneIndex;
            }).indexOf(scene); // MAP OVER THIS AN FLAG SCENES IF THEY HAVE  PROBLEM LINE


            probsArr.push(problem); // filter through script problems and then go to scenes and add problem flags for each index at proper location
          }); //   if(probsArr.length>0){
          //   probsArr = [...new Set(probsArr)]
          //  for (let i=0; i< probsArr.length; i++){
          //   //  get an array of problem lines for the scenes
          //   if(this.scenes[probsArr[i].problems]){
          //   this.scenes[probsArr[i]].problems = 
          //   this.scriptProblems.filter
          //   (line => line.sceneNumber === probsArr[i])
          //     }
          //   }
          //   this.db.collection('problemLines')
          //   .add(
          //     {title:this.script, 
          //       data:this.scriptProblems, 
          //       date:new Date().toISOString()
          //     })
          //   }

          this.length = this.scriptData.length; // assign PAGENUMBER values to page 0 and 1 in order for future 

          for (var _i = 0; _i < 200; _i++) {
            this.scriptData[_i].page == 0 ? this.scriptData[_i].pageNumber = 0 : this.scriptData[_i].page == 1 ? this.scriptData[_i].pageNumber = 1 : this.scriptData;
          }
        }
      }, {
        key: "ngAfterViewInit",
        value: function ngAfterViewInit() {
          this.scriptLength = this.totalPages.length - 1;
          this.dataReady = true;
        } // lets get lookback tighter  - should be able to refrence lastCharacterIndex

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

          var _loop = function _loop(i) {
            var page = data.filter(function (line) {
              return line.page === i;
            });

            _this2.pages.push(page);

            if (i === num) {
              _this2.dataReady = true;
            }
          };

          for (var i = 2; i < num + 1; i++) {
            _loop(i);
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
        } //  pass the scene to be made and the breaks ponts for the scene to be changed to visible true

      }, {
        key: "makeVisible",
        value: function makeVisible(sceneArr, breaks) {
          console.log(sceneArr, breaks);
          this.finalDocument.breaks = breaks;
          console.log("wubalaubudubdub");
          breaks = breaks.sort(function (a, b) {
            return a.first - b.first;
          });
          var merged = [].concat.apply([], sceneArr);
          var counter = 0;

          for (var i = 0; i < merged.length; i++) {
            if (breaks[counter] && merged[i].index > breaks[counter].first && merged[i].index <= breaks[counter].last) {
              merged[i].visible = "true";

              if (merged[i].bar === "noBar") {
                merged[i].bar = "bar";
              }

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
              item.xPos = 87;
            }
          });
          console.log('merged');
          console.log(merged);
          return merged;
        }
      }, {
        key: "getPdf",
        value: function getPdf(sceneArr, name, numPages, layout) {
          var _this3 = this;

          console.log(numPages);
          console.log("THIS IS THE PAGES LENGTH");
          sceneArr = this.sortByNum(sceneArr); // need first and last lines from selected

          var fullPages = [];
          var used = [];
          var pages = [];
          var sceneBreaks = []; //  WALK THROUGH THIS

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
          });
          console.log("FULL PAGES");
          console.log(fullPages);

          var _final = this.makeVisible(fullPages, sceneBreaks);

          if (numPages.length > 1) {
            // we need to find how long the script is so we know how to change the Y pos 
            //     THIS IS OUR PROBLEM RIGHT HERE
            console.log(numPages[numPages.length - 1]);
            var lastPage = numPages[numPages.length - 1];
            console.log("last page is here~!");
            console.log(lastPage);

            _final.push(lastPage);
          }

          var trues = _final.filter(function (line) {
            return line.visible == 'true';
          });

          console.log("TRUES");
          console.log(trues);
          var finalDocument = {
            data: [],
            name: name,
            numPages: numPages.length,
            layout: layout
          };
          var page = [];

          for (var i = 0; i < _final.length; i++) {
            if (_final[i].page && !_final[i].text) {
              page.forEach(function (line) {
                var target = page.indexOf(line);

                if (page[target + 1] && (page[target + 1].visible == "false" || page[target + 1].category == "scene-header" || page[target + 1].category == "page-number" && page[target + 2] && page[target + 2].category == "scene-header") && line.visible == "true") {
                  line.end = "END";
                }
              });
              finalDocument.data.push(page);
              page = [];
            } else {
              page.push(_final[i]);
            }
          } // create continue arrows


          for (var _i2 = 0; _i2 < finalDocument.data.length - 1; _i2++) {
            var last = finalDocument.data[_i2][finalDocument.data[_i2].length - 1];
            var next = finalDocument.data[_i2 + 1];

            if (next[1].visible === "true") {
              last.cont = "CONTINUE", finalDocument.data[_i2 + 1][0].cont = "CONTINUE", finalDocument.data[_i2 + 1][0].top = "top";
            }

            last.cont ? last.barY = last.yPos - 10 : last;

            for (var j = 0; j < finalDocument.data[_i2].length; j++) {
              var current = finalDocument.data[_i2][j];
              current.visible == "true" && j < finalDocument.data.length - 1 && finalDocument.data[_i2][j + 1].visible == "false" && finalDocument.data[_i2][j + _i2].category != ("page-number" || false) ? current.end = "END" : current;
              current.end ? current.endY = current.yPos - 10 : current;
            }
          }

          console.log("final doc ");
          console.log(finalDocument);
          console.log(numPages);
          this.finalDocument.doc = finalDocument;
          this.lineOut.makeX(finalDocument);
          this.finalDocReady = true;
          this.upload.generatePdf(finalDocument).subscribe(function (data) {
            _this3.router.navigate(["complete"]);

            _this3.dialog.closeAll();
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

          if (this.modalData) {
            var dialogRef = this.dialog.open(_issue_issue_component__WEBPACK_IMPORTED_MODULE_0__["IssueComponent"], {
              width: '800px',
              data: {
                scenes: this.modalData,
                selected: this.selected
              }
            });
            dialogRef.afterClosed().subscribe(function (result) {
              _this4.waitingForScript = true;
              result.callsheet = result.callsheet.name;
              _this4.callsheet = result.callsheet;

              _this4.openFinalSpinner();

              var scriptLength = _this4.totalPages.length - 1;

              _this4.getPdf(_this4.selected, _this4.script, _this4.totalPages, result);
            });
          } else this.getPdf(this.selected, this.script, this.totalPages, "");
        }
      }, {
        key: "openFinalSpinner",
        value: function openFinalSpinner() {
          this.waitingForScript = true;

          if (this.waitingForScript) {
            var dialogRef = this.dialog.open(_issue_issue_component__WEBPACK_IMPORTED_MODULE_0__["IssueComponent"], {
              width: '800px',
              data: {
                selected: this.selected,
                script: this.script,
                totalPages: this.totalPages.length - 1,
                callsheet: this.callsheet,
                waitingForScript: true
              }
            });
            dialogRef.afterClosed().subscribe(function (result) {
              result;
            });
          }
        }
      }]);

      return DashboardRightComponent;
    }();

    DashboardRightComponent.ɵfac = function DashboardRightComponent_Factory(t) {
      return new (t || DashboardRightComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_fire_firestore__WEBPACK_IMPORTED_MODULE_5__["AngularFirestore"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_upload_service__WEBPACK_IMPORTED_MODULE_6__["UploadService"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_7__["Router"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__["MatDialog"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_line_out_service__WEBPACK_IMPORTED_MODULE_9__["LineOutService"]), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_10__["DatePipe"]));
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
      vars: 17,
      consts: [[1, "project-title"], [1, "main-container", "two-column", "cell"], [1, "controls-container"], [2, "width", "100%"], ["matInput", "", "placeholder", "Search your scenes here", 3, "keyup"], ["input", ""], [1, "mat-elevation-z8"], ["mat-table", "", "matSort", "", 3, "dataSource"], ["matColumnDef", "number"], ["mat-header-cell", "", "mat-sort-header", "", 4, "matHeaderCellDef"], ["mat-cell", "", 4, "matCellDef"], ["matColumnDef", "page number"], ["matColumnDef", "text"], ["matColumnDef", "preview"], ["matColumnDef", "select"], ["mat-header-row", "", 4, "matHeaderRowDef"], ["mat-row", "", 4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], [3, "pageSizeOptions"], [1, "data-feed", "cell"], [4, "ngFor", "ngForOf"], [3, "click"], ["class", "main-container", 4, "ngIf"], ["mat-header-cell", "", "mat-sort-header", ""], ["mat-cell", ""], ["type", "checkbox", 3, "name", "change"], ["mat-header-row", ""], ["mat-row", ""], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"], [1, "main-container"], ["class", "two-column", 4, "ngIf"], [1, "two-column"], ["class", "cell", 4, "ngFor", "ngForOf"], [1, "cell"]],
      template: function DashboardRightComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](1, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "h1", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](4, "date");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](5, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "div", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](7, "h2");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](8);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](9, "mat-form-field", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](10, "mat-label");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](11, "Filter");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](12, "input", 4, 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("keyup", function DashboardRightComponent_Template_input_keyup_12_listener($event) {
            return ctx.applyFilter($event);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](14, "div", 6);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](15, "table", 7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](16, 8);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](17, DashboardRightComponent_th_17_Template, 2, 0, "th", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](18, DashboardRightComponent_td_18_Template, 2, 1, "td", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](19, 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](20, DashboardRightComponent_th_20_Template, 2, 0, "th", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](21, DashboardRightComponent_td_21_Template, 2, 1, "td", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](22, 12);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](23, DashboardRightComponent_th_23_Template, 2, 0, "th", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](24, DashboardRightComponent_td_24_Template, 2, 1, "td", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](25, 13);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](26, DashboardRightComponent_th_26_Template, 2, 0, "th", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](27, DashboardRightComponent_td_27_Template, 2, 1, "td", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](28, 14);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](29, DashboardRightComponent_th_29_Template, 2, 0, "th", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](30, DashboardRightComponent_td_30_Template, 2, 2, "td", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](31, DashboardRightComponent_tr_31_Template, 1, 0, "tr", 15);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](32, DashboardRightComponent_tr_32_Template, 1, 0, "tr", 16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](33, DashboardRightComponent_tr_33_Template, 3, 1, "tr", 17);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](34, "mat-paginator", 18);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](35, "div", 19);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](36, "h1");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](37);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](38, "h2");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](39);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](40, "date");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](41, "ul");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](42, DashboardRightComponent_li_42_Template, 3, 3, "li", 20);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](43, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](44, "button", 21);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DashboardRightComponent_Template_button_click_44_listener() {
            return ctx.openDialog();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](45, "getPDF");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](46, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](47, "button", 21);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DashboardRightComponent_Template_button_click_47_listener() {
            return ctx.lineOut.makeX(ctx.finalDocument);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](48, "test the line out");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](49, DashboardRightComponent_div_49_Template, 6, 2, "div", 22);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("Generating sides for ", ctx.script, "-", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](4, 11, ctx.date), "");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", ctx.script, " scenes");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("dataSource", ctx.dataSource);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](16);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matHeaderRowDef", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matRowDefColumns", ctx.displayedColumns);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("pageSizeOptions", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpureFunction0"](16, _c0));

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", ctx.script, " sides");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind2"](40, 13, ctx.date, "shortDate"), " scenes:");

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx.selected);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](7);

          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.dataReady);
        }
      },
      directives: [_angular_material_form_field__WEBPACK_IMPORTED_MODULE_11__["MatFormField"], _angular_material_form_field__WEBPACK_IMPORTED_MODULE_11__["MatLabel"], _angular_material_input__WEBPACK_IMPORTED_MODULE_12__["MatInput"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatTable"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSort"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatColumnDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCellDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRowDef"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRowDef"], _angular_material_paginator__WEBPACK_IMPORTED_MODULE_2__["MatPaginator"], _angular_common__WEBPACK_IMPORTED_MODULE_10__["NgForOf"], _angular_common__WEBPACK_IMPORTED_MODULE_10__["NgIf"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderCell"], _angular_material_sort__WEBPACK_IMPORTED_MODULE_3__["MatSortHeader"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatCell"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatHeaderRow"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__["MatRow"]],
      pipes: [_angular_common__WEBPACK_IMPORTED_MODULE_10__["DatePipe"], _angular_common__WEBPACK_IMPORTED_MODULE_10__["KeyValuePipe"]],
      styles: ["li[_ngcontent-%COMP%]{\n    list-style-type: none;\n}\n.cell[_ngcontent-%COMP%]{\n    padding: 0 5% 5% 5%;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvZGFzaGJvYXJkLXJpZ2h0L2Rhc2hib2FyZC1yaWdodC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0kscUJBQXFCO0FBQ3pCO0FBQ0E7SUFDSSxtQkFBbUI7QUFDdkIiLCJmaWxlIjoic3JjL2FwcC9kYXNoYm9hcmQtcmlnaHQvZGFzaGJvYXJkLXJpZ2h0LmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJsaXtcbiAgICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG59XG4uY2VsbHtcbiAgICBwYWRkaW5nOiAwIDUlIDUlIDUlO1xufSJdfQ== */"]
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
          type: _line_out_service__WEBPACK_IMPORTED_MODULE_9__["LineOutService"]
        }, {
          type: _angular_common__WEBPACK_IMPORTED_MODULE_10__["DatePipe"]
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
      decls: 4,
      vars: 0,
      consts: [[1, "main"], [1, "button-container"], [1, "white-logo"]],
      template: function DashboardComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "div", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "app-dashboard-right");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_dashboard_right_dashboard_right_component__WEBPACK_IMPORTED_MODULE_3__["DashboardRightComponent"]],
      styles: [".main[_ngcontent-%COMP%]{\n    height: 100vh;\n    grid-template-rows: 300px;\n    text-align: center;\n   \n   \n    color: var(--white);\n    background: var(--red);\n    \n    overflow: auto;\n    \n}\n.white-logo[_ngcontent-%COMP%]{\n    background-image: url('logoFlatWhite.png');\n    background-size: contain;\n    background-repeat:no-repeat;\n\n    margin:0 auto;\n    height:250px;\n    width:250px;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvZGFzaGJvYXJkL2Rhc2hib2FyZC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQTtJQUNJLGFBQWE7SUFDYix5QkFBeUI7SUFDekIsa0JBQWtCOzs7SUFHbEIsbUJBQW1CO0lBQ25CLHNCQUFzQjtJQUN0QixnQ0FBZ0M7SUFDaEMsY0FBYzs7QUFFbEI7QUFDQTtJQUNJLDBDQUE2RDtJQUM3RCx3QkFBd0I7SUFDeEIsMkJBQTJCOztJQUUzQixhQUFhO0lBQ2IsWUFBWTtJQUNaLFdBQVc7QUFDZiIsImZpbGUiOiJzcmMvYXBwL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29tcG9uZW50LmNzcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLm1haW57XG4gICAgaGVpZ2h0OiAxMDB2aDtcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDMwMHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgIFxuICAgXG4gICAgY29sb3I6IHZhcigtLXdoaXRlKTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1yZWQpO1xuICAgIC8qIHRleHQtc2hhZG93OiAxcHggMXB4IGJsYWNrOyAqL1xuICAgIG92ZXJmbG93OiBhdXRvO1xuICAgIFxufVxuLndoaXRlLWxvZ297XG4gICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKFwiLi4vLi4vYXNzZXRzL2ljb25zL2xvZ29GbGF0V2hpdGUucG5nXCIpO1xuICAgIGJhY2tncm91bmQtc2l6ZTogY29udGFpbjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7XG5cbiAgICBtYXJnaW46MCBhdXRvO1xuICAgIGhlaWdodDoyNTBweDtcbiAgICB3aWR0aDoyNTBweDtcbn1cblxuXG4iXX0= */"]
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
      styles: ["\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2R1YWwtZGlhbG9nL2R1YWwtZGlhbG9nLmNvbXBvbmVudC5jc3MifQ== */"]
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
  "./src/app/footer/footer.component.ts":
  /*!********************************************!*\
    !*** ./src/app/footer/footer.component.ts ***!
    \********************************************/

  /*! exports provided: FooterComponent */

  /***/
  function srcAppFooterFooterComponentTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "FooterComponent", function () {
      return FooterComponent;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var FooterComponent = /*#__PURE__*/function () {
      function FooterComponent() {
        _classCallCheck(this, FooterComponent);
      }

      _createClass(FooterComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {}
      }]);

      return FooterComponent;
    }();

    FooterComponent.ɵfac = function FooterComponent_Factory(t) {
      return new (t || FooterComponent)();
    };

    FooterComponent.ɵcmp = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: FooterComponent,
      selectors: [["app-footer"]],
      decls: 5,
      vars: 0,
      consts: [[1, "section-border-top"], [1, "footer-container", "red"], [1, "footer-text"], [1, "footer-logo"]],
      template: function FooterComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "h4", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, " \xA9 2021 Sides-Ways Script Sides LLC All Rights Reserved.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](4, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: [".footer-text[_ngcontent-%COMP%]{\n    text-align: right;\n}\n.footer-container[_ngcontent-%COMP%]{\n    padding:1%;\n    width:90%;\n  \n    display:inline-flex;\n    align-content: flex-end;\n    justify-content: flex-end;\n}\n.footer-logo[_ngcontent-%COMP%]{\n    height:35px;\n    width:35px;\n    background-image: url('logoFlatWhite.png');\n    background-size:contain;\n    background-repeat: no-repeat;\n    margin-left:  1%;\n\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvZm9vdGVyL2Zvb3Rlci5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0ksaUJBQWlCO0FBQ3JCO0FBQ0E7SUFDSSxVQUFVO0lBQ1YsU0FBUzs7SUFFVCxtQkFBbUI7SUFDbkIsdUJBQXVCO0lBQ3ZCLHlCQUF5QjtBQUM3QjtBQUVBO0lBQ0ksV0FBVztJQUNYLFVBQVU7SUFDViwwQ0FBOEQ7SUFDOUQsdUJBQXVCO0lBQ3ZCLDRCQUE0QjtJQUM1QixnQkFBZ0I7O0FBRXBCIiwiZmlsZSI6InNyYy9hcHAvZm9vdGVyL2Zvb3Rlci5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmZvb3Rlci10ZXh0e1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xufVxuLmZvb3Rlci1jb250YWluZXJ7XG4gICAgcGFkZGluZzoxJTtcbiAgICB3aWR0aDo5MCU7XG4gIFxuICAgIGRpc3BsYXk6aW5saW5lLWZsZXg7XG4gICAgYWxpZ24tY29udGVudDogZmxleC1lbmQ7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbn1cblxuLmZvb3Rlci1sb2dve1xuICAgIGhlaWdodDozNXB4O1xuICAgIHdpZHRoOjM1cHg7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKCcuLi8uLi9hc3NldHMvL2ljb25zL2xvZ29GbGF0V2hpdGUucG5nJyk7XG4gICAgYmFja2dyb3VuZC1zaXplOmNvbnRhaW47XG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgICBtYXJnaW4tbGVmdDogIDElO1xuXG59Il19 */"]
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](FooterComponent, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Component"],
        args: [{
          selector: 'app-footer',
          templateUrl: './footer.component.html',
          styleUrls: ['./footer.component.css']
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
    /* harmony import */


    var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! @angular/material/progress-spinner */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/progress-spinner.js");

    var _c0 = ["callSheet"];

    function IssueComponent_div_1_li_6_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "li", 5);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var text_r7 = ctx.$implicit;

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](text_r7.text);
      }
    }

    function IssueComponent_div_1_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "ul");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5, "Scenes:");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, IssueComponent_div_1_li_6_Template, 2, 1, "li", 4);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }

      if (rf & 2) {
        var ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" Layout: ", ctx_r0.selected, " ");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r0.data.selected);
      }
    }

    function IssueComponent_div_2_Template(rf, ctx) {
      if (rf & 1) {
        var _r9 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, "Select a layout");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "div", 6);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "div", 7);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "div", 8);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "h2");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, "Single Copy");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "button", 9);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_div_2_Template_button_click_9_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r9);

          var ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r8.selectOption($event.target.id);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](10, "Standard");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "div", 7);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](12, "div", 10);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "h2");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](14, "Double Copy");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "button", 11);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_div_2_Template_button_click_15_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r9);

          var ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r10.selectOption($event.target.id);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](16, " Landscape");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_3_Template(rf, ctx) {
      if (rf & 1) {
        var _r13 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 12);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Add a call sheet.");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "form", 13, 14);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "input", 15);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("change", function IssueComponent_div_3_Template_input_change_5_listener($event) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r13);

          var ctx_r12 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r12.handleFileInput($event.target.files);
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_4_Template(rf, ctx) {
      if (rf & 1) {
        var _r15 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 7);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "button", 16);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function IssueComponent_div_4_Template_button_click_1_listener() {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r15);

          var ctx_r14 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();

          return ctx_r14.dialogRef.close({
            selected: ctx_r14.selected,
            callsheet: ctx_r14.callsheet
          });
        });

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "Get My Sides");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_5_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h1");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "BRB");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "mat-progress-spinner", 17);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "h3", 18);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5, "Processing Script");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "div", 19);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](7, "img", 20);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "h2");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9, "Getting Sides");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

    function IssueComponent_div_6_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, " Processing Call sheet ");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "mat-progress-spinner", 21);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
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
        this.callsheetReady = false;
        this.docUploaded = false;
        this.awaitingData = false; // modalReady: boolean = false

        this.selectionMade = false;
        this.waitingForScript = false;
      }

      _createClass(IssueComponent, [{
        key: "ngOnInit",
        value: function ngOnInit() {
          this.callsheet = undefined;
          this.selected = undefined;
          this.callsheetReady = false;
          this.callsheet = undefined;
          this.awaitingData = false;
          this.data.waitingForScript ? this.waitingForScript = true : this.waitingForScript = false;
        }
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

          file === "no callsheet" ? this.callsheetReady = true : this.awaitingData = true;
          this.upload.postCallSheet(file[0]).subscribe(function (data) {
            console.log("callsheet compelte");
            _this6.callsheet = file[0];
            _this6.docUploaded = true;
            _this6.callsheetReady = true;
            _this6.awaitingData = false;
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
      decls: 7,
      vars: 6,
      consts: [[1, "modal", "red"], [4, "ngIf"], ["class", "", 4, "ngIf"], ["class", "button-wrapper", 4, "ngIf"], ["style", "list-style-type:none;", 4, "ngFor", "ngForOf"], [2, "list-style-type", "none"], [1, "selections-container"], [1, "button-wrapper"], [1, "icon", 2, "background-image", "url(../../assets/vert.png)"], ["id", "standard", 1, "layout-button", 3, "click"], [1, "icon", 2, "background-image", "url(../../assets/horiz.png)"], ["id", "landscape", 1, "layout-button", 3, "click"], [1, ""], ["name", "callSheet", "id", "callSheet"], ["callSheet", ""], ["enctype", "multipart/form-data", "type", "file", 3, "change"], [1, "close-button", 3, "click"], ["mode", "indeterminate", "value", "0", 2, "display", "none"], [1, "spinner-text"], [1, "loading-image"], ["src", "../../assets/icons//robotWhite.png", 1, "spinning-bot"], ["mode", "indeterminate", "value", "500"]],
      template: function IssueComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, IssueComponent_div_1_Template, 7, 2, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, IssueComponent_div_2_Template, 17, 0, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, IssueComponent_div_3_Template, 6, 0, "div", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, IssueComponent_div_4_Template, 3, 0, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](5, IssueComponent_div_5_Template, 10, 0, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, IssueComponent_div_6_Template, 3, 0, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx.waitingForScript && ctx.selectionMade && !ctx.awaitingData);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx.waitingForScript && !ctx.selectionMade && !ctx.awaitingData);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx.waitingForScript && !ctx.awaitingData && ctx.selectionMade && !ctx.callsheetReady);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx.waitingForScript && !ctx.awaitingData && ctx.selectionMade && ctx.callsheetReady);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.waitingForScript);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.awaitingData && ctx.selectionMade);
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_3__["NgIf"], _angular_common__WEBPACK_IMPORTED_MODULE_3__["NgForOf"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["ɵangular_packages_forms_forms_y"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["NgControlStatusGroup"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__["NgForm"], _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_5__["MatProgressSpinner"]],
      styles: [".modal[_ngcontent-%COMP%]{\n  justify-content: center;\n  display: grid;\n  padding:2%;\n  text-align:center\n}\n.selections-container[_ngcontent-%COMP%]{\n    display:grid;\n    grid-template-columns: 1fr 1fr;\n   \n    justify-items:center;\n}\n.button-wrapper[_ngcontent-%COMP%]{\n  \n  padding:10px;\n\n}\n.icon[_ngcontent-%COMP%]{\n  max-height: 300px;\n  max-width: 300px;\n  height: 200px;\n  width: 250px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n  \n}\n.layout-button[_ngcontent-%COMP%]{\n  \n\n  padding:5%\n}\n.layout-button[_ngcontent-%COMP%]:hover{\n  -webkit-filter: hue-rotate(180deg);\n          filter: hue-rotate(180deg); \n}\n.close-button[_ngcontent-%COMP%]{\n  margin: 0 auto;\n  padding:2%;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvaXNzdWUvaXNzdWUuY29tcG9uZW50LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLHVCQUF1QjtFQUN2QixhQUFhO0VBQ2IsVUFBVTtFQUNWO0FBQ0Y7QUFDQTtJQUNJLFlBQVk7SUFDWiw4QkFBOEI7O0lBRTlCLG9CQUFvQjtBQUN4QjtBQUNBOztFQUVFLFlBQVk7O0FBRWQ7QUFFQTtFQUNFLGlCQUFpQjtFQUNqQixnQkFBZ0I7RUFDaEIsYUFBYTtFQUNiLFlBQVk7RUFDWix3QkFBd0I7RUFDeEIsNEJBQTRCO0VBQzVCLDJCQUEyQjs7QUFFN0I7QUFDQTs7O0VBR0U7QUFDRjtBQUNBO0VBQ0Usa0NBQTBCO1VBQTFCLDBCQUEwQjtBQUM1QjtBQUNBO0VBQ0UsY0FBYztFQUNkLFVBQVU7QUFDWiIsImZpbGUiOiJzcmMvYXBwL2lzc3VlL2lzc3VlLmNvbXBvbmVudC5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyIubW9kYWx7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBkaXNwbGF5OiBncmlkO1xuICBwYWRkaW5nOjIlO1xuICB0ZXh0LWFsaWduOmNlbnRlclxufVxuLnNlbGVjdGlvbnMtY29udGFpbmVye1xuICAgIGRpc3BsYXk6Z3JpZDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7XG4gICBcbiAgICBqdXN0aWZ5LWl0ZW1zOmNlbnRlcjtcbn1cbi5idXR0b24td3JhcHBlcntcbiAgXG4gIHBhZGRpbmc6MTBweDtcblxufVxuXG4uaWNvbntcbiAgbWF4LWhlaWdodDogMzAwcHg7XG4gIG1heC13aWR0aDogMzAwcHg7XG4gIGhlaWdodDogMjAwcHg7XG4gIHdpZHRoOiAyNTBweDtcbiAgYmFja2dyb3VuZC1zaXplOiBjb250YWluO1xuICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7XG4gIFxufVxuLmxheW91dC1idXR0b257XG4gIFxuXG4gIHBhZGRpbmc6NSVcbn1cbi5sYXlvdXQtYnV0dG9uOmhvdmVye1xuICBmaWx0ZXI6IGh1ZS1yb3RhdGUoMTgwZGVnKTsgXG59XG4uY2xvc2UtYnV0dG9ue1xuICBtYXJnaW46IDAgYXV0bztcbiAgcGFkZGluZzoyJTtcbn0iXX0= */"]
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
  "./src/app/line-out.service.ts":
  /*!*************************************!*\
    !*** ./src/app/line-out.service.ts ***!
    \*************************************/

  /*! exports provided: LineOutService */

  /***/
  function srcAppLineOutServiceTs(module, __webpack_exports__, __webpack_require__) {
    "use strict";

    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */


    __webpack_require__.d(__webpack_exports__, "LineOutService", function () {
      return LineOutService;
    });
    /* harmony import */


    var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
    /*! @angular/core */
    "./node_modules/@angular/core/__ivy_ngcc__/fesm2015/core.js");

    var LineOutService = /*#__PURE__*/function () {
      function LineOutService() {
        _classCallCheck(this, LineOutService);
      }

      _createClass(LineOutService, [{
        key: "makeX",
        value: function makeX(doc) {
          console.log(doc);
          console.log("doc");
        }
      }]);

      return LineOutService;
    }();

    LineOutService.ɵfac = function LineOutService_Factory(t) {
      return new (t || LineOutService)();
    };

    LineOutService.ɵprov = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({
      token: LineOutService,
      factory: LineOutService.ɵfac,
      providedIn: 'root'
    });
    /*@__PURE__*/

    (function () {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](LineOutService, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"],
        args: [{
          providedIn: 'root'
        }]
      }], function () {
        return [];
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


    var _navbar_navbar_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
    /*! ../navbar/navbar.component */
    "./src/app/navbar/navbar.component.ts");
    /* harmony import */


    var _angular_router__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! @angular/router */
    "./node_modules/@angular/router/__ivy_ngcc__/fesm2015/router.js");
    /* harmony import */


    var _footer_footer_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! ../footer/footer.component */
    "./src/app/footer/footer.component.ts");

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
      decls: 4,
      vars: 0,
      consts: [[1, "full-vh"]],
      template: function NavComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "app-navbar");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "router-outlet");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "app-footer");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      directives: [_navbar_navbar_component__WEBPACK_IMPORTED_MODULE_3__["NavbarComponent"], _angular_router__WEBPACK_IMPORTED_MODULE_4__["RouterOutlet"], _footer_footer_component__WEBPACK_IMPORTED_MODULE_5__["FooterComponent"]],
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
      decls: 16,
      vars: 0,
      consts: [[1, "navbar", "red"], [1, "nav-item", "left", "logo"], [1, "nav-links", "right"], [1, "right", "nav-item"], [1, "right"], [1, "contact"]],
      template: function NavbarComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "h3", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "SIDES-WAYS");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "ul", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "li", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "a", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6, "ABOUT US");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "li", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "a", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9, "ABOUT US");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "li", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](11, "a", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](12, "ABOUT US");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](13, "li", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](14, "a", 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](15, "CONTACT US");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: [".nav-item[_ngcontent-%COMP%]{\n    font-size: 12px;\n    display:inline;\n}\n.logo[_ngcontent-%COMP%]{\n    font-size:2em;\n    width: 15%;\n}\n.nav-title[_ngcontent-%COMP%]{\n    font-size:2em;\n    font-weight: 900;\n}\n.nav-links[_ngcontent-%COMP%]{\n    list-style-type: none;\n    margin:0;\n    padding:10px;  \n    display: inline;\n    align-content: end;\n}\n.navbar[_ngcontent-%COMP%]{\n    height: 5%;\n    width: 90%;\n    padding: 2.5% 1.5% 0.5% 2.5%;\n    margin:0 auto;\n    display:flex;\n}\n.nav-links[_ngcontent-%COMP%]{\n    width:100%\n}\nli[_ngcontent-%COMP%], a[_ngcontent-%COMP%]{\n    padding:.3% 2%;\n    font-size:1.1em\n\n}\n.contact[_ngcontent-%COMP%]{\n    border:1px solid blue;\n    padding:1%\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvbmF2YmFyL25hdmJhci5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0ksZUFBZTtJQUNmLGNBQWM7QUFDbEI7QUFDQTtJQUNJLGFBQWE7SUFDYixVQUFVO0FBQ2Q7QUFDQTtJQUNJLGFBQWE7SUFDYixnQkFBZ0I7QUFDcEI7QUFDQTtJQUNJLHFCQUFxQjtJQUNyQixRQUFRO0lBQ1IsWUFBWTtJQUNaLGVBQWU7SUFDZixrQkFBa0I7QUFDdEI7QUFFQTtJQUNJLFVBQVU7SUFDVixVQUFVO0lBQ1YsNEJBQTRCO0lBQzVCLGFBQWE7SUFDYixZQUFZO0FBQ2hCO0FBQ0E7SUFDSTtBQUNKO0FBQ0E7SUFDSSxjQUFjO0lBQ2Q7O0FBRUo7QUFHQTtJQUNJLHFCQUFxQjtJQUNyQjtBQUNKIiwiZmlsZSI6InNyYy9hcHAvbmF2YmFyL25hdmJhci5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLm5hdi1pdGVte1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBkaXNwbGF5OmlubGluZTtcbn1cbi5sb2dve1xuICAgIGZvbnQtc2l6ZToyZW07XG4gICAgd2lkdGg6IDE1JTtcbn1cbi5uYXYtdGl0bGV7XG4gICAgZm9udC1zaXplOjJlbTtcbiAgICBmb250LXdlaWdodDogOTAwO1xufVxuLm5hdi1saW5rc3tcbiAgICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG4gICAgbWFyZ2luOjA7XG4gICAgcGFkZGluZzoxMHB4OyAgXG4gICAgZGlzcGxheTogaW5saW5lO1xuICAgIGFsaWduLWNvbnRlbnQ6IGVuZDtcbn1cblxuLm5hdmJhcntcbiAgICBoZWlnaHQ6IDUlO1xuICAgIHdpZHRoOiA5MCU7XG4gICAgcGFkZGluZzogMi41JSAxLjUlIDAuNSUgMi41JTtcbiAgICBtYXJnaW46MCBhdXRvO1xuICAgIGRpc3BsYXk6ZmxleDtcbn1cbi5uYXYtbGlua3N7XG4gICAgd2lkdGg6MTAwJVxufVxubGksIGF7XG4gICAgcGFkZGluZzouMyUgMiU7XG4gICAgZm9udC1zaXplOjEuMWVtXG5cbn1cblxuICAgIFxuLmNvbnRhY3R7XG4gICAgYm9yZGVyOjFweCBzb2xpZCBibHVlO1xuICAgIHBhZGRpbmc6MSVcbn1cbiJdfQ== */"]
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
        };
        this.urls = ["https://sides3.herokuapp.com", "http://localhost:8080"];
        this.url = this.urls[0];
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
        }
      }, {
        key: "toggleUrl",
        value: function toggleUrl() {
          if (this.url != this.urls[0]) {
            this.url = this.urls[0];
          } else {
            this.url = this.urls[1];
          }

          console.log(this.url);
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
        value: function generatePdf(sceneArr) {
          console.log("calling generatePDF");
          console.log(sceneArr[2]);
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
    /* harmony import */


    var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
    /*! @angular/common */
    "./node_modules/@angular/common/__ivy_ngcc__/fesm2015/common.js");
    /* harmony import */


    var _angular_material_card__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
    /*! @angular/material/card */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/card.js");
    /* harmony import */


    var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
    /*! @angular/material/progress-spinner */
    "./node_modules/@angular/material/__ivy_ngcc__/fesm2015/progress-spinner.js");

    function UploadComponent_div_0_Template(rf, ctx) {
      if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 22);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "mat-card-content");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "mat-progress-spinner", 23);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "h3", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "Processing Script");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "div", 25);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "img", 26);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "h3", 24);

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, "Sit Tight.");

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
      }
    }

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
        value: function ngOnInit() {
          this.working = false;
        }
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

          console.log("firing over script");
          this.working = true;
          this.fileToUpload = files.item(0);
          localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ""));
          this.$script_data = this.upload.postFile(this.fileToUpload);
          this.dataSubscription = this.$script_data.subscribe(function (data) {
            console.log(data);
            _this8.lines = data[0];

            if (_this8.addTwo(data[0]).category) {
              var two = _this8.addTwo(data[0]);

              data[0][two].category = "page-number";
            } // data [0] = lineArr


            _this8.upload.lineArr = data[0];

            var x = _this8.upload.lineArr.filter(function (line) {
              return line.category == "scene-header";
            });

            console.log(_this8.upload.lineArr); // data[1] = pagesArr

            _this8.upload.pagesArr = data[1];
            _this8.upload.lineCount = data[2].map(function (line) {
              return line.totalLines;
            });
            alert("your IP is safe. " + data[3] + " was just deleted from our servers.");
            data.pop();

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
      decls: 67,
      vars: 2,
      consts: [["class", "spinner-overlay center", 4, "ngIf"], [1, "form-group", "two-column", "left", "red"], [1, "left-cell"], [1, "text-area"], [1, "upload-headline"], [1, "big-text", 2, "padding-bottom", "1%"], [1, "big-text"], [1, "upload-description"], [1, "left", "upload-description", "right-cell"], [1, "details"], [1, "feature-block"], [1, "feature-headline"], [1, "learn-more", "bold"], [1, "arrow"], [1, "center", "right-cell"], [1, "upload-card"], ["src", "../../assets/icons/redLogoFlat.png", 1, "card-image"], [1, "uploadButton"], ["name", "script", "enctype", "multipart/form-data", "type", "file", "id", "script", 3, "change"], [1, "developer-tools"], [1, "yellow"], [3, "click"], [1, "spinner-overlay", "center"], ["mode", "indeterminate", "value", "0", 2, "display", "none"], [1, "spinner-text"], [1, "loading-image"], ["src", "../../assets/icons//robotWhite.png", 1, "spinning-bot"]],
      template: function UploadComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, UploadComponent_div_0_Template, 9, 0, "div", 0);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "div", 1);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "div", 2);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "div", 3);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "div", 4);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "h1", 5);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6, "Welcome");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "h1", 6);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, " to Sides-Ways");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](9, "div", 7);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "p");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](11, " AD's and PA's spend thousands of hours every year lining out sides to hand out on set. Thats a lot of time that could be spent on other things. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](12, "span");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](13, "Enter: Sides-Ways");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](14, "div", 8);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "div", 9);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](16, "div", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](17, "h4", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](18, "Simple");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](19, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](20, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](21, "We make sides for sets. Thats it.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](22, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](23, "No subscriptions. NOTHING saved. Just sides. ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](24, "div", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](25, "h4", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](26, "Safe");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](27, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](28, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](29, "We're backed by Heroku and Google.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](30, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](31, "Your IP is protected at all times.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](32, "div", 10);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](33, "h4", 11);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](34, "Secure");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](35, "br");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](36, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](37, "No one EVER sees script. We record nothing.");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](38, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](39, "We dont even have a database");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](40, "div", 12);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](41, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](42, "Learn more ");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](43, "span", 13);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](44, "\u2192");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](45, "div", 14);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](46, "mat-card", 15);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](47, "mat-card-header");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](48, "div");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](49, "img", 16);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](50, "mat-card-content");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](51, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](52, "Upload your script");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](53, "h3");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](54, " We'll prep your sides");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](55, "mat-card-actions");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](56, "label", 17);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](57, "span");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](58, "UPLOAD SCRIPT");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](59, "input", 18);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("change", function UploadComponent_Template_input_change_59_listener($event) {
            return ctx.handleFileInput($event.target.files);
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](60, "div", 19);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](61, "h4");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](62, "Tools for nerds (ignore this stuff):");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](63, "h5", 20);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](64);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](65, "button", 21);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function UploadComponent_Template_button_click_65_listener() {
            return ctx.upload.toggleUrl();
          });

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](66, "Toggle Development Mode");

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }

        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.working);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](64);

          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"]("current target : ", ctx.upload.url, " ");
        }
      },
      directives: [_angular_common__WEBPACK_IMPORTED_MODULE_4__["NgIf"], _angular_material_card__WEBPACK_IMPORTED_MODULE_5__["MatCard"], _angular_material_card__WEBPACK_IMPORTED_MODULE_5__["MatCardHeader"], _angular_material_card__WEBPACK_IMPORTED_MODULE_5__["MatCardContent"], _angular_material_card__WEBPACK_IMPORTED_MODULE_5__["MatCardActions"], _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__["MatProgressSpinner"]],
      styles: [".arrow[_ngcontent-%COMP%]{\n    padding-left:1%;\n   \n}\n\n.body[_ngcontent-%COMP%]{margin-left: 10%; margin-right: 10%; top:2%; bottom: 2%}\n\n.big-text[_ngcontent-%COMP%]{\n    \n    font-size: 3.5em;\n    padding-top: 20px;\n    font-weight: bold;\n}\n\n.feature-block[_ngcontent-%COMP%]:nth-of-type(2){\n    border-right: 1px solid var(--white);\n    border-left: 1px solid var(--white)\n}\n\n.developer-tools[_ngcontent-%COMP%]{\n   \n    padding-top: 5%;\n}\n\n.learn-more[_ngcontent-%COMP%]{\n    font-size:1.4em\n}\n\n.small-border[_ngcontent-%COMP%]{\n    border-top: 2px solid var(--white);\n    margin-top: 6%;\n    margin-bottom: 1%;\n    width:15%\n\n}\n\n.details[_ngcontent-%COMP%]{\n    padding-top:0;\n    display:grid;\n    grid-template-columns: 1fr 1fr 1fr\n}\n\nh4[_ngcontent-%COMP%]{\n    font:36px;\n}\n\n.left-cell[_ngcontent-%COMP%]{\n    padding-top: 10%;\n    padding-left: 15%;\n    \n    width: 70%;\n    margin: 0 auto;\n}\n\n.right-cell[_ngcontent-%COMP%]{\n    padding-right:15%;\n    padding-top:10%\n}\n\n.text-area[_ngcontent-%COMP%]{\n    width: 85%;\n}\n\n.upload-headline[_ngcontent-%COMP%]{\n    padding-bottom: 25px;\n    height: auto;\n}\n\n.upload-description[_ngcontent-%COMP%]{\n    width:95%;\n    font-size:1.1em\n}\n\n.feature-headline[_ngcontent-%COMP%]{\n    font-size:1.7em;\n    padding-top:2%;\n}\n\n.upload-description[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{\n  margin:0 0 0 0\n}\n\n.upload-card[_ngcontent-%COMP%]{\n    width: 60%;\n    height: auto;\n    margin: 0 auto;\n    padding-bottom: 10% !important;\n    display: block;\n    position: relative;\n    padding: 16px;\n    border-radius: 15px 15px 15px 15px !important;\n}\n\n.two-column[_ngcontent-%COMP%]{\n    display:grid;\n    min-height: 75vh;\n   \n    height:auto;\n \n    grid-template-columns:1fr 1fr ;\n    padding:2% 3%;\n    \n}\n\n.feature-block[_ngcontent-%COMP%]{\n    width:85%;\n    padding-right: 5%;\n    padding-left: 5%;\n}\n\n.card-image[_ngcontent-%COMP%]{\n    width:75%;\n    height:auto;\n    margin-left: -5%\n}\n\n.loading-image[_ngcontent-%COMP%]{\n    width:auto;\n    height:auto;\n    margin: 0 auto;\n}\n\n.warning-box[_ngcontent-%COMP%]{\n    background-color: #c2185a;\n\n    text-align: center;\n    margin: 0 auto;\n}\n\nlabel.uploadButton[_ngcontent-%COMP%]   input[type=\"file\"][_ngcontent-%COMP%] {\n    position:absolute;\n    top: -1000px;\n}\n\n\n\n.uploadButton[_ngcontent-%COMP%] {\n    border: 2px solid #AAA;\n    border-radius: 4px;\n    padding: 2px 5px;\n    margin: 2px;\n    background: #DDD;\n    display: inline-block;\n}\n\n.uploadButton[_ngcontent-%COMP%]:hover {\n    background: #CCC;\n}\n\n.uploadButton[_ngcontent-%COMP%]:active {\n    background: #CCF;\n}\n\n.uploadButton[_ngcontent-%COMP%]   [_ngcontent-%COMP%]:invalid    + span[_ngcontent-%COMP%] {\n    color: #A44;\n}\n\n.uploadButton[_ngcontent-%COMP%]   [_ngcontent-%COMP%]:valid    + span[_ngcontent-%COMP%] {\n    color: #4A4;\n}\n\n.spinner-text[_ngcontent-%COMP%]{\n\n    margin: 0 auto;\n    color:var(--white);\n    font-size:2.4em\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvdXBsb2FkL3VwbG9hZC5jb21wb25lbnQuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0lBQ0ksZUFBZTs7QUFFbkI7O0FBRUEsTUFBTSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsVUFBVTs7QUFDN0Q7O0lBRUksZ0JBQWdCO0lBQ2hCLGlCQUFpQjtJQUNqQixpQkFBaUI7QUFDckI7O0FBQ0E7SUFDSSxvQ0FBb0M7SUFDcEM7QUFDSjs7QUFDQTs7SUFFSSxlQUFlO0FBQ25COztBQUNBO0lBQ0k7QUFDSjs7QUFDQTtJQUNJLGtDQUFrQztJQUNsQyxjQUFjO0lBQ2QsaUJBQWlCO0lBQ2pCOztBQUVKOztBQUNBO0lBQ0ksYUFBYTtJQUNiLFlBQVk7SUFDWjtBQUNKOztBQUNBO0lBQ0ksU0FBUztBQUNiOztBQUNBO0lBQ0ksZ0JBQWdCO0lBQ2hCLGlCQUFpQjs7SUFFakIsVUFBVTtJQUNWLGNBQWM7QUFDbEI7O0FBQ0E7SUFDSSxpQkFBaUI7SUFDakI7QUFDSjs7QUFDQTtJQUNJLFVBQVU7QUFDZDs7QUFDQTtJQUNJLG9CQUFvQjtJQUNwQixZQUFZO0FBQ2hCOztBQUNBO0lBQ0ksU0FBUztJQUNUO0FBQ0o7O0FBQ0E7SUFDSSxlQUFlO0lBQ2YsY0FBYztBQUNsQjs7QUFDQTtFQUNFO0FBQ0Y7O0FBQ0E7SUFDSSxVQUFVO0lBQ1YsWUFBWTtJQUNaLGNBQWM7SUFDZCw4QkFBOEI7SUFDOUIsY0FBYztJQUNkLGtCQUFrQjtJQUNsQixhQUFhO0lBQ2IsNkNBQTZDO0FBQ2pEOztBQUNBO0lBQ0ksWUFBWTtJQUNaLGdCQUFnQjs7SUFFaEIsV0FBVzs7SUFFWCw4QkFBOEI7SUFDOUIsYUFBYTs7QUFFakI7O0FBQ0E7SUFDSSxTQUFTO0lBQ1QsaUJBQWlCO0lBQ2pCLGdCQUFnQjtBQUNwQjs7QUFDQTtJQUNJLFNBQVM7SUFDVCxXQUFXO0lBQ1g7QUFDSjs7QUFDQTtJQUNJLFVBQVU7SUFDVixXQUFXO0lBQ1gsY0FBYztBQUNsQjs7QUFDQTtJQUNJLHlCQUF5Qjs7SUFFekIsa0JBQWtCO0lBQ2xCLGNBQWM7QUFDbEI7O0FBQ0E7SUFDSSxpQkFBaUI7SUFDakIsWUFBWTtBQUNoQjs7QUFFQSxtQ0FBbUM7O0FBQ25DO0lBQ0ksc0JBQXNCO0lBQ3RCLGtCQUFrQjtJQUNsQixnQkFBZ0I7SUFDaEIsV0FBVztJQUNYLGdCQUFnQjtJQUNoQixxQkFBcUI7QUFDekI7O0FBQ0E7SUFDSSxnQkFBZ0I7QUFDcEI7O0FBQ0E7SUFDSSxnQkFBZ0I7QUFDcEI7O0FBQ0E7SUFDSSxXQUFXO0FBQ2Y7O0FBQ0E7SUFDSSxXQUFXO0FBQ2Y7O0FBQ0E7O0lBRUksY0FBYztJQUNkLGtCQUFrQjtJQUNsQjtBQUNKIiwiZmlsZSI6InNyYy9hcHAvdXBsb2FkL3VwbG9hZC5jb21wb25lbnQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmFycm93e1xuICAgIHBhZGRpbmctbGVmdDoxJTtcbiAgIFxufVxuXG4uYm9keXttYXJnaW4tbGVmdDogMTAlOyBtYXJnaW4tcmlnaHQ6IDEwJTsgdG9wOjIlOyBib3R0b206IDIlfVxuLmJpZy10ZXh0e1xuICAgIFxuICAgIGZvbnQtc2l6ZTogMy41ZW07XG4gICAgcGFkZGluZy10b3A6IDIwcHg7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG4uZmVhdHVyZS1ibG9jazpudGgtb2YtdHlwZSgyKXtcbiAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS13aGl0ZSk7XG4gICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZCB2YXIoLS13aGl0ZSlcbn1cbi5kZXZlbG9wZXItdG9vbHN7XG4gICBcbiAgICBwYWRkaW5nLXRvcDogNSU7XG59XG4ubGVhcm4tbW9yZXtcbiAgICBmb250LXNpemU6MS40ZW1cbn1cbi5zbWFsbC1ib3JkZXJ7XG4gICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkIHZhcigtLXdoaXRlKTtcbiAgICBtYXJnaW4tdG9wOiA2JTtcbiAgICBtYXJnaW4tYm90dG9tOiAxJTtcbiAgICB3aWR0aDoxNSVcblxufSBcbi5kZXRhaWxze1xuICAgIHBhZGRpbmctdG9wOjA7XG4gICAgZGlzcGxheTpncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmciAxZnJcbn1cbmg0e1xuICAgIGZvbnQ6MzZweDtcbn1cbi5sZWZ0LWNlbGx7XG4gICAgcGFkZGluZy10b3A6IDEwJTtcbiAgICBwYWRkaW5nLWxlZnQ6IDE1JTtcbiAgICBcbiAgICB3aWR0aDogNzAlO1xuICAgIG1hcmdpbjogMCBhdXRvO1xufVxuLnJpZ2h0LWNlbGx7XG4gICAgcGFkZGluZy1yaWdodDoxNSU7XG4gICAgcGFkZGluZy10b3A6MTAlXG59XG4udGV4dC1hcmVhe1xuICAgIHdpZHRoOiA4NSU7XG59XG4udXBsb2FkLWhlYWRsaW5le1xuICAgIHBhZGRpbmctYm90dG9tOiAyNXB4O1xuICAgIGhlaWdodDogYXV0bztcbn1cbi51cGxvYWQtZGVzY3JpcHRpb257XG4gICAgd2lkdGg6OTUlO1xuICAgIGZvbnQtc2l6ZToxLjFlbVxufVxuLmZlYXR1cmUtaGVhZGxpbmV7XG4gICAgZm9udC1zaXplOjEuN2VtO1xuICAgIHBhZGRpbmctdG9wOjIlO1xufVxuLnVwbG9hZC1kZXNjcmlwdGlvbiBoNHtcbiAgbWFyZ2luOjAgMCAwIDBcbn1cbi51cGxvYWQtY2FyZHtcbiAgICB3aWR0aDogNjAlO1xuICAgIGhlaWdodDogYXV0bztcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBwYWRkaW5nLWJvdHRvbTogMTAlICFpbXBvcnRhbnQ7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIHBhZGRpbmc6IDE2cHg7XG4gICAgYm9yZGVyLXJhZGl1czogMTVweCAxNXB4IDE1cHggMTVweCAhaW1wb3J0YW50O1xufVxuLnR3by1jb2x1bW57XG4gICAgZGlzcGxheTpncmlkO1xuICAgIG1pbi1oZWlnaHQ6IDc1dmg7XG4gICBcbiAgICBoZWlnaHQ6YXV0bztcbiBcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6MWZyIDFmciA7XG4gICAgcGFkZGluZzoyJSAzJTtcbiAgICBcbn1cbi5mZWF0dXJlLWJsb2Nre1xuICAgIHdpZHRoOjg1JTtcbiAgICBwYWRkaW5nLXJpZ2h0OiA1JTtcbiAgICBwYWRkaW5nLWxlZnQ6IDUlO1xufVxuLmNhcmQtaW1hZ2V7XG4gICAgd2lkdGg6NzUlO1xuICAgIGhlaWdodDphdXRvO1xuICAgIG1hcmdpbi1sZWZ0OiAtNSVcbn1cbi5sb2FkaW5nLWltYWdle1xuICAgIHdpZHRoOmF1dG87XG4gICAgaGVpZ2h0OmF1dG87XG4gICAgbWFyZ2luOiAwIGF1dG87XG59XG4ud2FybmluZy1ib3h7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2MyMTg1YTtcblxuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBtYXJnaW46IDAgYXV0bztcbn1cbmxhYmVsLnVwbG9hZEJ1dHRvbiBpbnB1dFt0eXBlPVwiZmlsZVwiXSB7XG4gICAgcG9zaXRpb246YWJzb2x1dGU7XG4gICAgdG9wOiAtMTAwMHB4O1xufVxuXG4vKioqKiogRXhhbXBsZSBjdXN0b20gc3R5bGluZyAqKioqKi9cbi51cGxvYWRCdXR0b24ge1xuICAgIGJvcmRlcjogMnB4IHNvbGlkICNBQUE7XG4gICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgIHBhZGRpbmc6IDJweCA1cHg7XG4gICAgbWFyZ2luOiAycHg7XG4gICAgYmFja2dyb3VuZDogI0RERDtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG59XG4udXBsb2FkQnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiAjQ0NDO1xufVxuLnVwbG9hZEJ1dHRvbjphY3RpdmUge1xuICAgIGJhY2tncm91bmQ6ICNDQ0Y7XG59XG4udXBsb2FkQnV0dG9uIDppbnZhbGlkICsgc3BhbiB7XG4gICAgY29sb3I6ICNBNDQ7XG59XG4udXBsb2FkQnV0dG9uIDp2YWxpZCArIHNwYW4ge1xuICAgIGNvbG9yOiAjNEE0O1xufVxuLnNwaW5uZXItdGV4dHtcblxuICAgIG1hcmdpbjogMCBhdXRvO1xuICAgIGNvbG9yOnZhcigtLXdoaXRlKTtcbiAgICBmb250LXNpemU6Mi40ZW1cbn0iXX0= */"]
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