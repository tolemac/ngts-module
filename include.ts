import {Inject, Directive} from "ngts/ngts";

@Directive({
    scope: false,
    compile() {
        return {
            pre(scope : any, elem, attrs, ctrl, transclude) {
            },
            post() {
            }
        };
    }
})
export class NgtsInclude {
    src: string;
    constructor( @Inject("$templateRequest") $templateRequest, @Inject("$compile") $compile,
        @Inject("$element") elem,
        @Inject("$scope") scope, @Inject("$attrs") attrs) {

        const template = scope.$parent.$eval(attrs.src);
        $templateRequest(template, true).then(response => {
            var contentElement = elem.find("ngts-include-content");
            if (contentElement.length > 0) {
                contentElement.replaceWith($compile(angular.element(response))(scope));

                if (angular.isDefined(attrs["replace"]))
                    elem.replaceWith(elem.children());
            } else {
                var tempElem = angular.element(response);
                var transcludeElem: JQuery = tempElem.find("ngts-include-transclude");

                if (transcludeElem.length > 0) {
                    transcludeElem.replaceWith(elem.children());
                } else {

                    if (transcludeElem.length === 0)
                        transcludeElem = tempElem.siblings("ngts-include-transclude");
                    if (transcludeElem.length > 0) {
                        transcludeElem.after(tempElem);
                    }
                }

                if (angular.isDefined(attrs["replace"]))
                    elem.replaceWith($compile(tempElem)(scope));
                else
                    elem.append($compile(tempElem)(scope));
            }

        });        
    }
    
}