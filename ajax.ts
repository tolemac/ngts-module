import {Inject, Directive} from "ngts/ngts";
import {AbsoluteUrl} from "./url.helper";

@Directive({
    module: "ngtsModule",    
    restrict: "E",
    bindToController: true,
    scope: {
        url: "@path",
        as: "=as",
        httpVerb: "@verb",
        onFail: "&onFail",
        onSuccess: "&onSuccess"
    },
    priority: 20000
})
export class NgtsAjax {
    auto = false; // Si es false se ejecuta solo cuando se llama explicitamente a "run()", si no lo hará en cuanto path tenga valores correctos.
    as: any; 
    url: string;
    pathAttr: string;
    parentScope: any;
    absoluteUrl = false;
    pathVariables = [];
    params: any = {};
    working = false;
    success = false;
    fail = false;
    httpVerb = "post";
    result: any;
    model: any;
    onFail: () => void;
    onSuccess: () => void;
    
    paged = false;
    incrementalModel = false;
    hasMore : boolean;

    constructor( @Inject("$scope") $scope, @Inject("$attrs") private $attrs,
        @Inject("$http") private $http: angular.IHttpService, @Inject("$location") private $location,
        @Inject("$interpolate") private $interpolate) {
        this.pathAttr = $attrs.path;

        this.auto = angular.isDefined($attrs.auto) && $attrs.auto !== false;
        this.paged = angular.isDefined($attrs.paged) && $attrs.paged !== false;
        this.incrementalModel = angular.isDefined($attrs.incremental) && $attrs.incremental !== false;
        if (this.incrementalModel)
            this.paged = true;
        this.absoluteUrl = angular.isDefined($attrs.absPath) && $attrs.absPath !== false;
        this.as = this;
        this.parentScope = $scope.$parent;

        this.observePath();

        if (this.paged)
            this.params = { queryInfo: { Pagina: 0, RegistrosPorPagina: 10 } };
    }

    private observePath() {
        if (!this.url)
            this.url = this.$location.path();
        else {
            const pathVariables = this.pathVariables = this.pathAttr.match(/{{[\w.\s|:$']+}}/g) || [];
            if (pathVariables) {
                for (let i in pathVariables) {
                    if (pathVariables.hasOwnProperty(i)) {
                        pathVariables[i] = pathVariables[i].toString();
                    }
                }
            }

        }

        this.$attrs.$observe("path", () => {
            if (this.auto && this.pathVariablesHaveValues())
                this.run();
        });
    }

    private pathVariablesHaveValues() {
        let result = true;
        const pathVariables = this.pathVariables;
        for (let i = 0; i < pathVariables.length; i++) {
            const interpolation = pathVariables[i];
            const expression = this.$interpolate(interpolation);
            if (!expression(this.parentScope)) {
                result = false;
                break;
            }
        }
        return result;
    }

    private assignModel(data) {
        if (this.incrementalModel && angular.isArray(data)) {
            if (!this.model)
                this.model = [];
            this.model = this.model.concat(data);
            this.hasMore = data.length === this.params.pageSize;
        } else {
            if (this.model)
                delete this.model;
            this.model = data;
        }
    }

    run(params?: any): angular.IHttpPromise<any> {
        let promise: ng.IHttpPromise<any>;
        params = angular.extend({}, params, this.params);

        this.working = true;
        this.success = false;
        this.fail = false;

        const url = this.absoluteUrl ? this.url : AbsoluteUrl(this.url);
        if (this.httpVerb === "get")
            promise = this.$http.get<any>(url);
        else if (this.httpVerb === "post")
            promise = this.$http.post<any>(url, params);
        else {
            this.working = false;
            alert("AjaxHttp: Méthod " + this.httpVerb + " not implemented.");
            return undefined;
        }

        var fail = (data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
            this.working = false;
            this.success = false;
            this.fail = true;
            this.result = { data: data, status: status, headers: headers, config: config };
            if (this.onFail) {
                this.onFail();
            }
        }

        var success = (data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
            this.working = false;
            this.success = true;
            this.fail = false;
            this.result = { data: data, status: status, headers: headers, config: config };
            this.assignModel(data);
            if (this.onSuccess) {
                this.onSuccess();
            }
        };

        promise
            .success((data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
                success(data, status as number, headers, config);
            })
            .error((data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
                fail(data, status as number, headers, config);
            });
        return promise;
    }

    public nextPage() {
        if (this.paged) {
            this.params.Pagina++;
            return this.run();
        }
    }

    public firstPage() {
        if (this.paged) {
            delete this.model;
            this.params.Pagina = 0;
            this.run();
        }
    }
}
