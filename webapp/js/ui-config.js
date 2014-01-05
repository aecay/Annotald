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

exports.ConfigEditor = React.createClass({
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
    doExport: function () {
        file_local.writeFile(null, this.editor.getValue());
    },
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
    dirty: false,
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

function vexSubmit(name) {
    return function ($vexContent, event) {
        $vexContent.data().vex.value = name;
        return vex.close($vexContent.data().vex.id);
    };
}

exports.ConfigsList = React.createClass({
    getInitialState: function () {
        return {names: [], adding: false};
    },
    updateFromDb: function () {
        var that = this;
        config_store.listConfigs().then(function (configs) {
            that.setState({names: configs.map(function (x) { return x.name; })});
        });
    },
    componentWillMount: function () {
        this.updateFromDb();
    },
    doEdit: function (name) {
        this.props.changeState({view: "editConfig", name: name});
        return false;
    },
    doAdd: function () {
        var name = this.refs.newName.getDOMNode().value,
            that = this;
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
                       promise.then(function (contents) {
                           return config_store.setConfig(name, contents);
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
    componentDidUpdate: function () {
        if (this.state.adding) {
            this.refs.newName.getDOMNode().focus();
        }
    },
    render: function () {
        var that = this, addForm;
        function renderConfig(name) {
            return <li key={name}>
                {name} - <a href="#" onClick={that.doEdit.bind(that, name)}>edit</a>
                - <a href="#" onClick={that.doDelete.bind(that, name)}>delete</a>
                </li>;
        }
        if (this.state.adding) {
            addForm = <form onSubmit={this.doAdd}>
                <input type="text" placeholder="New config name" ref="newName" />
                <input type="submit" value="Add" />
                </form>;
        } else {
            addForm = <a onClick={function () {that.setState({adding: true});
                                               return false;}}
                href="#">Add new</a>;
        }
        return <div id="configs-list">
            <ul>
            {this.state.names.map(renderConfig)}
            </ul>
            {addForm}
            </div>;
    }
});
