///<reference path="./../../../types/all.d.ts" />
var notify = require("growl").growl;

export function error (text : string) : void {
    notify.error({ title: "Error",
                   message: text });
};

export function warning (text : string) : void {
    notify.warning({ title: "Warning",
                     message: text });
};

export function notice (text : string) : void {
    notify.notice({ message: text,
                    title: ""});
};
