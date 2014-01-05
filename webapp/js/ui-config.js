/** @jsx React.DOM */

/*global require: false, exports: true */

var React = require("react"),
    config_store = require("./config-store"),
    ace = require("brace"),
    notify = require("./ui-log"),
    file_local = require("./file-local"),
    vex = require("vex"),
    Q = require("q");
require("brace/mode/javascript");
require("brace/theme/xcode");

function vexSubmit(name) {
    return function ($vexContent, event) {
        $vexContent.data().vex.value = name;
        return vex.close($vexContent.data().vex.id);
    };
}

/**
 * @class
 * @classdesc A lsit of all loaded configs
 */
exports.ConfigsList = React.createClass({
    // Misc methods

    updateFromDb: function () {
        var that = this;
        config_store.listConfigs().then(function (configs) {
            that.setState({names: configs.map(function (x) { return x.name; })});
        });
    },
    // Event handlers

    doEdit: function (name) {
        this.props.changeState({view: "editConfig", name: name});
        return false;
    },

    doAdd: function (name) {
        var that = this;
        vex.dialog.open({ message: "Choose how to add the new config.",
                   buttons: [{ text: "Blank",
                               type: "button",
                               click: vexSubmit("blank") },
                             { text: "From file",
                               type: "button",
                               click: vexSubmit("file") }],
                   callback: function (data) {
                       var promise;
                       if (data == "file") {
                           promise = file_local.readFile(null);
                       } else {
                           promise = Q.fcall(function () { return ""; });
                       }
                       promise.then(function (result) {
                           return config_store.setConfig(name, result.content);
                       }).then(function () {
                           that.doEdit(name);
                       });
                   }
                 });
        this.setState({adding: false});
        return false;
    },

    doDelete: function (name) {
        var that = this;
        config_store.deleteConfig(name).then(function () {
            notify.notice("Config " + name + " deleted.");
            that.updateFromDb();
        }, function () {
            notify.warning("Deletion error!");
        });
    },

    // React methods

    getInitialState: function () {
        return {names: [], adding: false};
    },

    componentWillMount: function () {
        this.updateFromDb();
    },
    componentDidUpdate: function () {
        if (this.state.adding) {
            this.refs.newName.getDOMNode().focus();
        }
    },

    render: function () {
        var that = this, addForm;
        function renderConfig(name) {
            return <option value={name} key={name}>
                {name}
                </option>;
        }
        function edit () {
            that.doEdit(that.refs.config.getDOMNode().value);
            return false;
        }
        function add () {
            that.doAdd(that.refs.newName.getDOMNode().value);
            return false;
        }
        function delet () {
            that.doDelete(that.refs.config.getDOMNode().value);
            return false;
        }
        if (this.state.adding) {
            addForm = <form onSubmit={add}>
                <input type="text" placeholder="New config name" ref="newName" />
                <input type="submit" value="Add" />
                <button onClick={function () {that.setState({adding:false});
                                              return false;}}>
                Cancel</button>
                </form>;
        } else {
            addForm = <a onClick={function () {that.setState({adding: true});
                                               return false;}}
                href="#">Add new</a>;
        }
        return (<div id="configs-list">
            <select ref="config">
            {this.state.names.map(renderConfig)}
            </select><span> </span>
            <a href="#" onClick={edit}>edit</a> <span> &ndash; </span>
            <a href="#" onClick={delet}>delete</a><br />
            {addForm}
            </div>);
    }
});


/**
 * @class
 * @classdesc An editor for configuration files
 */
exports.ConfigEditor = React.createClass({

    /** @member {Boolean} Are there unsaved changes? */
    dirty: false,

    // Event handler functions

    /**
     * @method Save the edited config
     */
    doSave: function doSave () {
        var that = this;
        config_store.setConfig(this.props.name, this.editor.getValue()).then(
            function () {
                that.dirty = false;
                notify.notice("Save success");
            },
            function (error) {
                notify.error("Save error!");
                console.log(error);
            }
        );
        return false;
    },

    /**
     * @method Exit the editor; return to the welcome view
     */
    doExit: function () {
        var that = this;
        function doExitInner () {
            that.props.changeState({view: "welcome"});
        }
        if (this.dirty) {
            vex.dialog.confirm({ message: "Discard unsaved changes?",
                                 callback: function (data) {
                                     if (data) doExitInner();
                                 }});
        } else {
            doExitInner();
        }
        return false;
    },

    /**
     * @method Export this config to a local file.
     */
    doExport: function () {
        file_local.writeFile(null, this.editor.getValue());
    },

    // React methods

    /**
     * @method
     */
    render: function () {
        return <div id="code-editor-outer">
            <div id="code-editor-buttons">
            <button onClick={this.doSave}>Save</button>
            <button onClick={this.doExit}>Exit</button>
            <button onClick={this.doExport}>Export</button>
            </div>
            <div id="editor">
            </div>
            </div>;
    },

    /**
     * @method Set up the Ace editor internals.
     */
    componentDidMount: function () {
        var editor = this.editor = ace.edit("editor"),
            that = this;
        editor.setTheme("ace/theme/xcode");
        editor.getSession().setMode("ace/mode/javascript");
        config_store.getConfig(this.props.name).then(function (result) {
            editor.setValue(result);
            editor.clearSelection();
            editor.focus();
            this.dirty = false;
            editor.on("change", function () {
                that.dirty = true;
            });
        }).fail(function (error) {
            console.log("db error");
            console.log(error);
        });
    }
});
