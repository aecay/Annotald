/** @jsx React.DOM */
/*jshint ignore:start */
/*global require: false, exports: true, Blob: false */

var React = require("react"),
    configStore = require("../config-store"),
    ace = require("brace"),
    notify = require("./log"),
    // TODO: conditional for node webkit
    fileLocal = require("../file/local"),
    vex = require("vex"),
    Q = require("q"),
    FileChooser = require("./file").FileChooser,
    $ = require("jquery"),
    _ = require("lodash");
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
 * @classdesc A list of all loaded configs
 */
exports.ConfigsList = React.createClass({
    // Misc methods

    updateFromDb: function () {
        var that = this;
        configStore.listConfigs().then(function (configs) {
            that.setState({ names: _.keys(configs) });
        });
    },
    // Event handlers

    doEdit: function (name) {
        $(document).trigger("ChangeView", { view: "EditConfig", name: name });
        return false;
    },

    doAdd: function (name) {
        var that = this;
        vex.dialog.open({ message: "Choose how to add the new config." +
                          "<div id=\"file-chooser\"></div>",
                          afterOpen:
                          function ($vexContent) {
                              React.renderComponent(FileChooser(
                                  { callback:
                                    function (file) {
                                        file.read().then(function (content) {
                                            configStore.setConfig(name, content).
                                                then(function () {
                                                    that.doEdit(name);
                                                });
                                        });
                                        vex.close($vexContent.data().vex.id);
                                    }
                                  }), document.getElementById("file-chooser"));
                              }
                        });
        this.setState({adding: false});
        return false;
    },

    doDelete: function (name) {
        var that = this;
        configStore.deleteConfig(name).then(function () {
            notify.notice("Config " + name + " deleted.");
            that.updateFromDb();
        }, function () {
            notify.warning("Deletion error!");
        });
    },

    // React methods
    getInitialState: function () {
        return { names: [], adding: false };
    },

    getDefaultProps: function () {
        return { name: "default" };
    },

    componentWillMount: function () {
        this.updateFromDb();
    },

    componentDidUpdate: function () {
        if (this.state.adding) {
            this.refs.newName.getDOMNode().focus();
        }
    },

    componentDidMount: function () {
        configStore.getLastConfig().then(function (c) {
            if (c) {
                $(this.refs.config.getDOMNode()).val(c);
            }
        });
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
        function change () {
            configStore.setLastConfig(that.refs.config.getDOMNode().value);
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
                <h2>Config files:</h2>
            <select ref="config" id="config-chooser" onChange={change}>
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
var ConfigEditor = exports.ConfigEditor = React.createClass({

    /** @member {Boolean} Are there unsaved changes? */
    dirty: false,

    // Event handler functions

    /**
     * @method Save the edited config
     */
    doSave: function doSave () {
        var that = this;
        configStore.setConfig(this.props.name, this.editor.getValue()).then(
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
            $(document).trigger("ChangeView", { view: "Welcome",
                                                name: that.props.name });
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
        var url = window.URL.createObjectURL(new Blob([this.editor.getValue()]));
        window.open(url, "_blank");
        window.URL.revokeObjectURL(url);
    },

    // React methods

    /**
     * @method
     */
    render: function () {
        return React.DOM.div(
            {id: "code-editor-outer"},
            React.DOM.span({style: {fontWeight: "bold",
                                    fontSize: "150%"}},
                          "Editing config: " + this.props.name),
            React.DOM.div({id: "code-editor-buttons"},
                          React.DOM.button({onClick: this.doSave}, "Save"),
                          React.DOM.button({onClick: this.doExit}, "Exit"),
                          React.DOM.button({onClick: this.doExport}, "Export")),
            React.DOM.div({id: "editor"}));
    },

    /**
     * @method Set up the Ace editor internals.
     */
    componentDidMount: function () {
        var editor = this.editor = ace.edit("editor"),
            that = this;
        editor.setTheme("ace/theme/xcode");
        editor.getSession().setMode("ace/mode/javascript");
        configStore.getConfig(this.props.name).then(function (result) {
            editor.setValue(result);
            editor.clearSelection();
            editor.gotoLine(1,0);
            editor.scrollToLine(0);
            editor.focus();
            this.dirty = false;
            editor.on("change", function () {
                that.dirty = true;
            });
        }).catch(function (error) {
            console.log("db error");
            console.log(error);
        });
    }
});
