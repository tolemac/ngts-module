import {Inject, Injectable} from "ngts/ngts";

@Injectable({
    module: "ngtsModule"
})
export class NgtsLayoutService {
    data: any;
    constructor(@Inject("$rootScope") $scope) {
        if ($scope.$root.layoutData) {
            this.data = $scope.$root.layoutData;
        } else {
            $scope.$root.layoutData = this.data = {};
        }
    }
}