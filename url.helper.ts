export function setAbsoluteUrlFunction(fn : (partialUrl : string) => string){
    AbsoluteUrl = fn;
}

var dummyAbsoluteUrl = (url:string) => {
    return url;
}

export var AbsoluteUrl : (partialUrl : string) => string = dummyAbsoluteUrl;