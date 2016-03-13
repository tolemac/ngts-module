import {Inject, Directive} from "ngts/ngts";
import {NgtsLayoutService} from "./services/layout.data.service";

@Directive({
    module: "ngtsModule",
    restrict: "A",
    scope: false
})
export class NgtsLayoutData {
    constructor( @Inject("$element") $element, @Inject("emLayout") emLayout: NgtsLayoutService,
        @Inject("$parse") $parse, @Inject("$attrs") $attrs, @Inject("$scope") $scope) {
        $element.html($parse($attrs.emLayoutData)(emLayout.data));
    }
}
