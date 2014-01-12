/** @jsx React.DOM */
/*global require: false, exports: true */

var React = require("react");

exports.template = <div onContextMenu={function () {return false;}}>
    <div id="menus">
      <div id="floatMenu" className="menuPane">
        <div className="menuTitle">
          Annotald VERSION
        </div>{/* TODO */}

        Editing: FILENAME<br />{/*TODO*/}
        <input className="menubutton" type="button" value="Save" id="butsave" /><br />
        <div id="undoCtrls">
        <input className="menubutton" type="button" value="Undo" id="butundo" /><br />
        <input className="menubutton" type="button" value="Redo" id="butredo" /><br />
        </div>
        {/*TODO: partial file support*/}
        {/*TODO: timelog support */}
        {/*TODO: test runner */}
        {/* TODO togetherjs
        <button className="menubutton" type="button" id="butcollaborate"
               onClick="clearSelection();TogetherJS(this);return false;"
               data-end-togetherjs-html="Uncollaborate">Collaborate</button><br
          />
        */}
        <input className="menubutton" type="button" value="Exit" id="butexit" /><br />
      </div>

      <div id="toolsMenu" className="menuPane">
        <div className="menuTitle">Tools</div>
        <input className="menubutton" type="button" value="Search"
               id="butsearch" style={{marginTop:"4px"}} /><br />
        <div id="matchcommands">
          <input className="menubutton" type="button" value="Next Match" id="butnextmatch" /><br />
          <input className="menubutton" type="button" value="Clear Matches" id="butclearmatch" /><br />
        </div>
        {/*TODO validator*/}
        {""}
      </div>
      {/*TODO: show if using metadata*/}
      <div id="metadataEditor"
           style={{visibility:"hidden"}}
           >
        <div className="menuTitle">Metadata</div>
        <div id="metadata"></div>
      </div>

      <div id="messageBox" className="menuPane">
        <div className="menuTitle" id="messagesTitle">Messages</div>
        <div id="messageBoxInner">----</div>
        {/*TODO: timelog idle status*/}{""}
      </div>
    </div>

    <div id="editpane"></div>


    <div id="conMenu">
      <div id="conLeft" className="conMenuColumn">
        <div className="conMenuItem"><a>IP-SUB</a></div>
        <div className="conMenuItem"><a>IP-INF</a></div>
        <div className="conMenuItem"><a>IP-SMC</a></div>
        <div className="conMenuItem"><a>-SPE</a></div>
        <div className="conMenuItem"><a>-PRN</a></div>
        <div className="conMenuItem"><a>-XXX</a></div>
      </div>

      <div id="conRight" className="conMenuColumn">
        <div className="conMenuItem"><a>XXX</a></div>
        <div className="conMenuItem"><a>XXX</a></div>
      </div>

      <div id="conRightest" className="conMenuColumn">
        <div className="conMenuItem"><a>XXX</a></div>
        <div className="conMenuItem"><a>XXX</a></div>
      </div>
    </div>

    <div id="dialogBox" className="menuPane">
    </div>

    <div id="dialogBackground"></div>
    </div>;
