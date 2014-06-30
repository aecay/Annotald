interface TagFunction {
    (attrs : { [key : string] : string }, ...children : string[]) : string;
    (...children : string[]) : string;
}

interface WutFunctions {
    div : TagFunction;
    span : TagFunction;
    input: TagFunction;
    textarea: TagFunction;
    label: TagFunction;
    select: TagFunction;
    option: TagFunction;
}

declare module "wut" {
    export function pollute (x : Object) : WutFunctions;
}
