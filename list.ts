import {Inject, Component, Directive} from "ngts/ngts";
import {AbsoluteUrl} from "./url.helper";

export interface IListFactory {
    beginList?(): string;
    endList?(): string;
    beginItem?(): string;
    endItem?(): string;
    repeatTag?(): string;
    repeatAttributes?(): string;
}

export class BaseListFactory implements IListFactory {
    beginList = () => "";
    endList = () => "";
    beginItem = () => "";
    endItem = () => "";
    repeatTag = () => "div";
    repeatAttributes = () => "";
}

@Directive({
    module : "ngtsModule",
    restrict: "EA",
    scope: {
        source: "=",
        viewSrc: "=",
        viewData: "="
    },
    bindToController: true,
    controllerAs: "_ctrl",
    priority: 10000
})
export class NgtsList {
    currentItemIndex: number;
    currentItemScope: any;
    currentItem: any;

    itemScopes: any[];
    source: any[];

    sourceExpr: string;
    // No usar esta propiedad más de una vez en un mismo ciclo de ejecución. (Cachear el resultado y usarlo)
    //get source(): any[] {
    //    return this.$scope.$eval(this.sourceExpr);
    //}

    constructor( @Inject("$scope") private $scope, @Inject("$attrs") private $attrs, @Inject("$timeout") $timeout,
        @Inject("$injector") $injector, @Inject("$compile") $compile, @Inject("$element") element) {

        this.compile($attrs, $injector, element, $compile, $scope);

        this.itemScopes = [];
        this.sourceExpr = $attrs.source;
        this.assignAs($attrs.as);
    }

    compile($attrs, $injector, element, $compile, $scope) {
        const factory = new BaseListFactory();
        const attrs = $attrs;
        if (attrs.factory)
            angular.extend(factory, $injector.get(attrs.factory));
        else
            attrs.factory = "";

        let repeat = "item in " + attrs.source;
        if (attrs.repeat)
            repeat = attrs.repeat.replace("$$source", "_ctrl.source");

        const viewSrc = attrs.viewSrc ? "view-src='_ctrl.viewSrc'" : "";
        const viewData = attrs.viewData ? "view-data='_ctrl.viewData'" : "";

        const transclude = element.html();
        element.html("");

        const innerHtml = $(factory.beginList() +
            "<" + factory.repeatTag() + " ng-repeat=\"" + repeat + "\"" + factory.repeatAttributes() + ">" +
            "<ngts-list-item index='{{$index}}' objeto='objeto' factory='" + attrs.factory + "' " + viewSrc + " " + viewData + ">" + transclude + "</ngts-list-item>" +
            "</" + factory.repeatTag() + ">" +
            factory.endList());
        element.append(innerHtml);
        $compile(innerHtml)($scope);
        
    }

    assignAs(asAttr: string) {
        var parts = asAttr.split(".");
        var object = this.$scope;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!object[parts[i]])
                object[parts[i]] = {};
            object = object[parts[i]];
        }
        object[parts[parts.length - 1]] = this;
    }

    addItemScope(itemScope) {
        if (itemScope._ctrl.$index === 0)
            this.itemScopes = [];
        this.itemScopes.push(itemScope);
    }

    get multiselect(): boolean {
        return angular.isDefined(this.$attrs.multiselect) && this.$attrs.multiselect === true;
    }

    itemClicked(event, itemScope) {
        // Mantenemos la lista de seleccionados.
        var multiselect = this.multiselect;
        if (event.shiftKey && multiselect) {
            var from = this.currentItemIndex;
            var to = itemScope._ctrl.$index;
            var i;
            for (i = from; i !== to; i = i + (from < to ? 1 : -1)) {
                this.itemScopes[i]._ctrl.$selected = true;
            }
            this.itemScopes[i]._ctrl.$selected = true;

            // Eliminamos la selección de texto
            document.getSelection().removeAllRanges();
        } else if (event.ctrlKey && multiselect) {
            itemScope._ctrl.$selected = !itemScope._ctrl.$selected;
        } else {
            angular.forEach(this.itemScopes, (value, key) => { value._ctrl.$selected = false; });
            itemScope._ctrl.$selected = true;
        }

        // Actualizamos los flag de item actual
        if (this.currentItemScope)
            this.currentItemScope._ctrl.$current = false;
        itemScope._ctrl.$current = true;
        this.currentItemScope = itemScope;
        this.currentItemIndex = itemScope._ctrl.$index;

        this.currentItem = this.source[this.currentItemIndex];
    }    
}

@Directive({
    restrict: "EA",
    require: ["^ngtsList"],
    priority: 10000,
    scope: false,
    controllerAs: "$listItemCtrl",
    compile: () => {
        return {
            pre: () => {},
            post: (scope, element, attributes, controllers: any[]) => {
                var parentCtrl = controllers[0] as any;
                parentCtrl.addItemScope(scope);
                element.parent().click((event) => {
                    parentCtrl.itemClicked(event, scope);
                    scope.$apply();
                });
            }
        };
    }
})
export class NgtsListItem {
    current = false;
    selected = false;
    objeto: any;
    constructor(@Inject("$scope") $scope, @Inject("$attrs") attrs, @Inject("$element") element, @Inject("$compile") $compile) {
        const $injector = angular.injector(["ng", "ngtsModule"]);
        var factory = new BaseListFactory();
        if (attrs.factory)
            angular.extend(factory, $injector.get(attrs.factory));

        var transclude = element.html();
        element.html("");

        var include = "";
        if (attrs.viewSrc) {
            include = "<ngts-include src=\"_ctrl.viewSrc\" replace></ngts-include>";
        }
        var html = $(factory.beginItem() + transclude + include + factory.endItem());

        element.append(html);
        $compile(html)($scope);

    }
}