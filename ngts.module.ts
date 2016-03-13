import {ModuleBootstrapper} from "ngts/ngts";

import {NgtsLayoutService} from "./services/layout.data.service";
import {NgtsLayoutData} from "layout.data";
import {NgtsList, NgtsListItem} from "list";
import {NgtsInclude} from "include";
import {NgtsAjax} from "ajax";

export class NgtsModule {
    static create() {
        var bootstrapper = new ModuleBootstrapper("ngtsModule", []);
        bootstrapper.createModule(undefined, [
            NgtsLayoutService,
            NgtsLayoutData,
            NgtsAjax,
            NgtsList, NgtsListItem,
            NgtsInclude]);
    }
}
