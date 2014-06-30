///<reference path="./../../../types/all.d.ts" />

/* tslint:disable:quotemark */

import file = require("./file");

import Q = require ("q");
var vex = require("vex");
import recent = require("./recent");
var db = require("./../db");
import log = require("./../ui/log");

import compat = require("../compat");
var $ = compat.$;

var wut = require("./../ext/wut");

var HP = {};
wut.pollute(HP);
var H = <WutFunctions>HP;

var icepahcFiles = [
"1150.firstgrammar.sci-lin.psd",
"1150.homiliubok.rel-ser.psd",
"1210.jartein.rel-sag.psd",
"1210.thorlakur.rel-sag.psd",
"1250.sturlunga.nar-sag.psd",
"1250.thetubrot.nar-sag.psd",
"1260.jomsvikingar.nar-sag.psd",
"1270.gragas.law-law.psd",
"1275.morkin.nar-his.psd",
"1300.alexander.nar-sag.psd",
"1310.grettir.nar-sag.psd",
"1325.arni.nar-sag.psd",
"1350.bandamennM.nar-sag.psd",
"1350.finnbogi.nar-sag.psd",
"1350.marta.rel-sag.psd",
"1400.gunnar2.nar-sag.psd",
"1400.gunnar.nar-sag.psd",
"1400.viglundur.nar-sag.psd",
"1450.bandamenn.nar-sag.psd",
"1450.ectorssaga.nar-sag.psd",
"1450.judit.rel-bib.psd",
"1450.vilhjalmur.nar-sag.psd",
"1475.aevintyri.nar-rel.psd",
"1480.jarlmann.nar-sag.psd",
"1525.erasmus.nar-sag.psd",
"1525.georgius.nar-rel.psd",
"1540.ntacts.rel-bib.psd",
"1540.ntjohn.rel-bib.psd",
"1593.eintal.rel-oth.psd",
"1611.okur.rel-oth.psd",
"1628.olafuregils.bio-tra.psd",
"1630.gerhard.rel-oth.psd",
"1650.illugi.nar-sag.psd",
"1659.pislarsaga.bio-aut.psd",
"1661.indiafari.bio-tra.psd",
"1675.armann.nar-fic.psd",
"1675.magnus.bio-oth.psd",
"1675.modars.nar-fic.psd",
"1680.skalholt.nar-rel.psd",
"1720.vidalin.rel-ser.psd",
"1725.biskupasogur.nar-rel.psd",
"1745.klim.nar-fic.psd",
"1790.fimmbraedra.nar-sag.psd",
"1791.jonsteingrims.bio-aut.psd",
"1830.hellismenn.nar-sag.psd",
"1835.jonasedli.sci-nat.psd",
"1850.piltur.nar-fic.psd",
"1859.hugvekjur.rel-ser.psd",
"1861.orrusta.nar-fic.psd",
"1882.torfhildur.nar-fic.psd",
"1883.voggur.nar-fic.psd",
"1888.grimur.nar-fic.psd",
"1888.vordraumur.nar-fic.psd",
"1902.fossar.nar-fic.psd",
"1907.leysing.nar-fic.psd",
"1908.ofurefli.nar-fic.psd",
"1920.arin.rel-ser.psd",
"1985.margsaga.nar-fic.psd",
"1985.sagan.nar-fic.psd",
"2008.mamma.nar-fic.psd",
"2008.ofsi.nar-sag.psd",
"ntmatthew01.psd",
"ntmatthew02.psd"
];

function readFromGithub (file : string) : Q.Promise<string> {
    var deferred = Q.defer<string>();
    $.ajax(
        "https://api.github.com/repos/antonkarl/icecorpus/contents/finished/" +
            file,
        {
            dataType: "json",
            success: (data : any, status: string, xhr : any) : void => {
                if (data.encoding !== "base64") {
                    deferred.reject("Unknown encoding: " + data.encoding);
                }
                deferred.resolve(window.atob(data.content));
            },
            error: (xhr : any, status : string, error : string) : void => {
                deferred.reject(status + "\n" + error);
            }
        });
    return deferred.promise;
}

export class IcepahcFile implements file.AnnotaldFile {
    private name : string;
    private content : string;
    fileType : string = "IcePaHC";

    constructor (params : any) {
        this.name = params.name;
        this.content = params.content;
    }

    static prompt () : Q.Promise<IcepahcFile> {
        var deferred = Q.defer<IcepahcFile>();
        var that = this;

        function dialog1Cb () : void {
            var select = (<HTMLSelectElement>
                             document.getElementById(
                                 "icepahc-file-select"));
            var file = select.options[select.selectedIndex].value;
            readFromGithub(file).done(function (s : string) : void {
                deferred.resolve(new that({
                    name: file,
                    content: s
                }));
            });
        }

        vex.dialog.open({ message: "Please choose a file",
                          input:
                          H.div({ class: "vex-custom-field-wrapper" },
                                H.label({ for: "file"}, "File: "),
                                H.div({ class: "vex-custom-input-wrapper" },
                                      H.select.apply(
                                          null,
                                          (<any[]>[{ id: "icepahc-file-select" }]).concat(
                                              icepahcFiles.map(
                                                  function (s : string) : string {
                                                      return H.option(s);
                                                  }))))),
                          callback: dialog1Cb,
                          buttons: [{text: "OK", type: "submit"}]});
        return deferred.promise;
    }

    serialize () : Object {
        return {
            name: this.name
        };
    }

    write (s : string) : Q.Promise<void> {
        recent.recordFileAccess(this);
        log.notice("Cannot save files to IcePaHC; saving as local file " +
                   "icepahc-" + this.name);
        return db.get("files", {}).then((files : any) : Q.Promise<boolean> => {
            files["icepahc-" + this.name] = s;
            return db.put("files", files);
        });
    }

    read () : Q.Promise<string> {
        recent.recordFileAccess(this);
        if (this.content) {
            return Q(this.content);
        } else {
            return readFromGithub(this.name);
        }
    }
}
file.registerFileType("IcePaHC",
                      (params : any) : file.AnnotaldFile => new IcepahcFile(params));
