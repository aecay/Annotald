///<reference path="./../../../types/all.d.ts" />

export interface File {
    read () : Q.Promise<string>;
    write (content : string) : Q.Promise<boolean>;
    serialize () : Object;
}

export interface IFilePrompt {
    prompt () : Q.Promise<File>;
}

export interface IFileStatic {
    fileType : string;
}
