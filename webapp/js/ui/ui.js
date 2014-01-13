/*global require: false, exports: true */

/*jshint browser: true, devel: true */

var React = require("react"),
    ConfigEditor = require("./config").ConfigEditor,
    ConfigsList = require("./config").ConfigsList,
    FileChooser = require("./file").FileChooser,
    TreeEditor = require("./tree-editor").TreeEditor,
    $ = require("jquery");

exports.AnnotaldUI = React.createClass({
    getInitialState: function () {
        return { view: this.initialView({}) };
    },
    render: function () {
        return this.state.view;
    },

    componentDidMount: function () {
        var that = this;
        $(document).on("ChangeView", function (event, params) {
            that.changeView(params);
        });
    },

    /* TODO: we probably want to do this with some nicer sort of router
     * technology, to bind the states together, check on each entry that the
     * required params have been passed, and allow modularity (regustering of
     * new views in child modules, without the parent needing to know about
     * it...), as well as code reuse (since we might want something like this
     * in the tree editor as well)
     */
    changeView: function (params) {
        switch (params.view) {
        case "Welcome":
            this.setState({view : this.initialView(params)});
            break;
        case "EditTree":
            this.setState({view: TreeEditor({ path: params.path,
                                              content: params.content,
                                              saveCallback: params.saveCallback,
                                              // TODO: hackasaurus!!!
                                              config: $("#config-chooser").val()
                                            })});
            break;
        case "EditConfig":
            this.setState({view: ConfigEditor({ name: params.name })});
            break;
        default:
            this.setState({view: React.DOM.div("Don't know about view: " +
                                               params.view)});
        }
    },
    initialView: function (params) {
        return React.DOM.div(
            {},
            React.DOM.h1({}, "Welcome to Annotald"),
            React.DOM.div(
                {style: { width: "70%" }},
                FileChooser({ callback:
                              function (content, path, saveCallback) {
                                  $(document).trigger("ChangeView",
                                                      { view: "EditTree",
                                                        path: path,
                                                        saveCallback: saveCallback,
                                                        content: content });
                              } })),
            React.DOM.div({style: { width: "30%",
                                    float: "right" }},
                          ConfigsList({name: params.name })));
    }
});
